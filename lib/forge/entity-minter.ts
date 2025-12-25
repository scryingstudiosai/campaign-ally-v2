// Entity Minter
// Creates stub entities and saves forged entities to the database

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Discovery,
  Conflict,
  ForgeType,
  HistoryEntry,
} from '@/types/forge'
import type { ForgeFactOutput } from '@/types/living-entity'

export interface StubCreationResult {
  discoveryId: string
  entityId: string
  name: string
}

export interface StubCreationContext {
  sourceEntityId?: string
  sourceEntityName?: string
}

export async function createStubEntities(
  supabase: SupabaseClient,
  campaignId: string,
  discoveries: Discovery[],
  sourceForgeType: ForgeType,
  sourceContext?: StubCreationContext
): Promise<StubCreationResult[]> {
  const results: StubCreationResult[] = []

  for (const discovery of discoveries) {
    const historyEntry: HistoryEntry = {
      event: 'stub_created',
      note: sourceContext?.sourceEntityName
        ? `Discovered in ${sourceContext.sourceEntityName}`
        : `Auto-created from ${sourceForgeType} forge`,
      timestamp: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('entities')
      .insert({
        campaign_id: campaignId,
        name: discovery.text,
        entity_type: discovery.suggestedType,
        summary: `Stub entity - needs details. Context: "${discovery.context.substring(0, 100)}..."`,
        status: 'active',
        importance_tier: 'background',
        visibility: 'dm_only',
        attributes: {
          is_stub: true,
          needs_review: true,
          stub_context: discovery.context,
          source_entity_id: sourceContext?.sourceEntityId,
          source_entity_name: sourceContext?.sourceEntityName,
          history: [historyEntry],
        },
      })
      .select()
      .single()

    if (data && !error) {
      results.push({
        discoveryId: discovery.id,
        entityId: data.id,
        name: data.name,
      })
    } else if (error) {
      console.error(`Failed to create stub for "${discovery.text}":`, error)
    }
  }

  return results
}

interface CommitContext {
  discoveries: Discovery[]
  conflicts: Conflict[]
  createdStubs: StubCreationResult[]
  metadata?: {
    ownerId?: string
    locationId?: string
    factionId?: string
  }
}

// Maps forge type to entity type
const FORGE_TO_ENTITY_TYPE: Record<ForgeType, string> = {
  npc: 'npc',
  item: 'item',
  location: 'location',
  monster: 'npc', // Monsters are stored as NPCs with a subtype
  faction: 'faction',
  quest: 'quest',
  encounter: 'encounter',
}

export async function saveForgedEntity(
  supabase: SupabaseClient,
  campaignId: string,
  forgeType: ForgeType,
  output: Record<string, unknown> | null,
  context: CommitContext
): Promise<unknown> {
  console.log('[EntityMinter] saveForgedEntity called')
  console.log('[EntityMinter] forgeType:', forgeType)
  console.log('[EntityMinter] context.createdStubs:', context.createdStubs)
  console.log('[EntityMinter] context.discoveries:', context.discoveries?.length, 'discoveries')

  if (!output) {
    throw new Error('No output to save')
  }

  // Build history entry
  const historyEntry: HistoryEntry = {
    event: 'forged',
    note: `Created via ${forgeType} forge`,
    timestamp: new Date().toISOString(),
  }

  // Get existing history or initialize
  const existingAttributes = (output.attributes as Record<string, unknown>) || {}
  const existingHistory = (existingAttributes.history as HistoryEntry[]) || []

  // Build the entity data based on forge type
  const entityData = buildEntityData(forgeType, output, {
    history: [...existingHistory, historyEntry],
  })

  // Add campaign_id
  entityData.campaign_id = campaignId

  // Save the entity
  const { data: savedEntity, error } = await supabase
    .from('entities')
    .insert(entityData)
    .select()
    .single()

  if (error) throw error

  // Save facts to the facts table (for NPC forge with Brain/Voice architecture)
  const facts = output.facts as ForgeFactOutput[] | undefined
  if (facts && Array.isArray(facts) && facts.length > 0) {
    const factRecords = facts.map((fact) => ({
      entity_id: savedEntity.id,
      campaign_id: campaignId,
      content: fact.content,
      category: fact.category,
      visibility: fact.visibility || 'dm_only',
      is_current: true,
      source_type: 'generated',
    }))

    const { error: factsError } = await supabase.from('facts').insert(factRecords)

    if (factsError) {
      console.error('Failed to save facts:', factsError)
      // Don't throw - entity was saved successfully, facts are supplementary
    }
  }

  // Create relationships to linked entities
  const linkedDiscoveries = context.discoveries.filter(
    (d) => d.status === 'link_existing' && d.linkedEntityId
  )

  for (const discovery of linkedDiscoveries) {
    await supabase.from('relationships').insert({
      campaign_id: campaignId,
      source_id: savedEntity.id,
      target_id: discovery.linkedEntityId,
      relationship_type: 'related_to',
      description: `Mentioned in ${forgeType} description`,
    })
  }

  // Create relationships to newly created stubs
  // Use 'contains' for sub-locations, 'inhabited_by' for NPCs, otherwise 'related_to'
  for (const stub of context.createdStubs) {
    const isContainsDiscovery = stub.discoveryId.startsWith('contains-')
    const isNpcDiscovery = stub.discoveryId.startsWith('npc-')

    let relationshipType = 'related_to'
    let description = `Discovered via ${forgeType} forge`

    if (isContainsDiscovery) {
      relationshipType = 'contains'
      description = 'Sub-location'
    } else if (isNpcDiscovery) {
      relationshipType = 'inhabited_by'
      description = 'Inhabitant of this location'
    }

    await supabase.from('relationships').insert({
      campaign_id: campaignId,
      source_id: savedEntity.id,
      target_id: stub.entityId,
      relationship_type: relationshipType,
      description,
    })
  }

  // For location forge, update the location entity with NPC references in soul/brain
  if (forgeType === 'location') {
    console.log('[EntityMinter] Location forge detected, checking for NPC stubs...')
    console.log('[EntityMinter] All created stubs:', context.createdStubs)

    const npcStubs = context.createdStubs.filter((stub) => stub.discoveryId.startsWith('npc-'))
    console.log('[EntityMinter] NPC stubs found:', npcStubs.length, npcStubs)

    if (npcStubs.length > 0) {
      // Get inhabitant details from output to enrich the references
      const inhabitants = (output.brain as Record<string, unknown>)?.inhabitants as Array<{
        name: string
        role: string
        hook?: string
      }> | undefined
      console.log('[EntityMinter] Inhabitants from output.brain:', inhabitants)

      // Build NPC references with entity IDs
      const npcReferences = npcStubs.map((stub) => {
        // Find matching inhabitant data
        const inhabitant = inhabitants?.find(
          (i) => i.name.toLowerCase() === stub.name.toLowerCase()
        )

        return {
          name: stub.name,
          role: inhabitant?.role || 'Unknown',
          hook: inhabitant?.hook,
          entity_id: stub.entityId,
        }
      })

      console.log('[EntityMinter] Built NPC references:', npcReferences)

      // Determine owner (first one with owner/keeper/master in role, or first NPC)
      const owner = npcReferences.find((npc) =>
        npc.role?.toLowerCase().includes('owner') ||
        npc.role?.toLowerCase().includes('keeper') ||
        npc.role?.toLowerCase().includes('master') ||
        npc.role?.toLowerCase().includes('proprietor')
      ) || npcReferences[0]
      console.log('[EntityMinter] Determined owner:', owner)

      // Get current soul and brain from the saved entity
      const currentSoul = (savedEntity.soul as Record<string, unknown>) || {}
      const currentBrain = (savedEntity.brain as Record<string, unknown>) || {}
      console.log('[EntityMinter] Current soul:', currentSoul)
      console.log('[EntityMinter] Current brain:', currentBrain)

      // Update the location entity with NPC references
      const updatePayload = {
        soul: {
          ...currentSoul,
          key_figures: npcReferences.map((npc) => ({
            name: npc.name,
            role: npc.role,
            entity_id: npc.entity_id,
          })),
        },
        brain: {
          ...currentBrain,
          staff: npcReferences.map((npc) => ({
            name: npc.name,
            role: npc.role,
            entity_id: npc.entity_id,
          })),
          owner: owner ? {
            name: owner.name,
            role: owner.role,
            entity_id: owner.entity_id,
          } : null,
        },
      }
      console.log('[EntityMinter] Update payload:', JSON.stringify(updatePayload, null, 2))
      console.log('[EntityMinter] Updating entity ID:', savedEntity.id)

      const { error: updateError } = await supabase
        .from('entities')
        .update(updatePayload)
        .eq('id', savedEntity.id)

      if (updateError) {
        console.error('[EntityMinter] Failed to update location with NPCs:', updateError)
      } else {
        console.log('[EntityMinter] Successfully updated location with NPC references')
      }
    } else {
      console.log('[EntityMinter] No NPC stubs found, skipping NPC reference update')
    }
  } else {
    console.log('[EntityMinter] Not a location forge, skipping NPC reference update')
  }

  // Create metadata-based relationships (owner, location, faction)
  if (context.metadata) {
    const { ownerId, locationId, factionId } = context.metadata

    if (ownerId) {
      await supabase.from('relationships').insert({
        campaign_id: campaignId,
        source_id: savedEntity.id,
        target_id: ownerId,
        relationship_type: 'owned_by',
        description: `Assigned owner from ${forgeType} forge`,
      })
    }

    if (locationId) {
      await supabase.from('relationships').insert({
        campaign_id: campaignId,
        source_id: savedEntity.id,
        target_id: locationId,
        relationship_type: 'located_in',
        description: `Assigned location from ${forgeType} forge`,
      })
    }

    if (factionId) {
      await supabase.from('relationships').insert({
        campaign_id: campaignId,
        source_id: savedEntity.id,
        target_id: factionId,
        relationship_type: 'member_of',
        description: `Assigned faction from ${forgeType} forge`,
      })
    }
  }

  return savedEntity
}

function buildEntityData(
  forgeType: ForgeType,
  output: Record<string, unknown>,
  additionalAttributes: Record<string, unknown>
): Record<string, unknown> {
  const entityType = FORGE_TO_ENTITY_TYPE[forgeType]

  // Base entity fields
  const baseData: Record<string, unknown> = {
    name: output.name as string,
    entity_type: entityType,
    status: 'active',
    importance_tier: 'minor',
    visibility: 'dm_only',
    source_forge: forgeType,
  }

  // Add type-specific fields
  switch (forgeType) {
    case 'npc':
      return {
        ...baseData,
        // New Brain/Voice architecture columns
        sub_type: (output.sub_type as string) || 'standard',
        brain: output.brain || {},
        voice: output.voice || {},
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        // Legacy fields for backward compatibility
        subtype: output.race as string,
        summary: (output.dm_slug as string) || (output.dmSlug as string),
        description: buildNPCDescription(output),
        attributes: {
          ...additionalAttributes,
          // Legacy NPC fields (kept for backward compatibility)
          race: output.race,
          gender: output.gender,
          appearance: output.appearance,
          personality: output.personality,
          voiceAndMannerisms: output.voiceAndMannerisms,
          voiceReference: output.voiceReference,
          motivation: output.motivation,
          secret: output.secret,
          plotHook: output.plotHook,
          loot: output.loot,
          combatStats: output.combatStats,
          connectionHooks: output.connectionHooks,
        },
      }

    case 'item':
      return {
        ...baseData,
        // New Brain/Voice/Mechanics architecture columns
        sub_type: (output.sub_type as string) || 'standard',
        brain: output.brain || {},
        voice: output.voice || null,  // null for non-sentient items
        mechanics: output.mechanics || {},  // Item mechanics (stats, abilities)
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        // Legacy fields
        subtype: output.item_type as string || output.category as string,
        summary: output.public_description as string,
        description: output.secret_description as string,
        attributes: {
          ...additionalAttributes,
          item_type: output.item_type || output.category,
          category: output.category,
          rarity: output.rarity,
          magical_aura: output.magical_aura,
          is_identified: output.is_identified,
          public_description: output.public_description,
          secret_description: output.secret_description,
          mechanical_properties: output.mechanical_properties,
          origin_history: output.origin_history,
          value_gp: output.value_gp,
          weight: output.weight,
          secret: output.secret,
        },
      }

    case 'location':
      return {
        ...baseData,
        // Brain/Soul/Mechanics architecture columns
        sub_type: (output.sub_type as string) || 'building',
        brain: output.brain || {},
        soul: output.soul || {},
        mechanics: output.mechanics || {},
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        // Legacy fields
        subtype: (output.sub_type as string) || (output.location_type as string),
        summary: (output.dm_slug as string) || (output.summary as string),
        description: output.description as string,
        attributes: {
          ...additionalAttributes,
          location_type: output.location_type || output.sub_type,
          atmosphere: output.atmosphere,
          notable_features: output.notable_features,
          secrets: output.secrets,
          encounters: output.encounters,
        },
      }

    case 'faction':
      return {
        ...baseData,
        // Brain/Soul/Mechanics architecture columns
        sub_type: (output.sub_type as string) || 'guild',
        brain: output.brain || {},
        soul: output.soul || {},
        mechanics: output.mechanics || {},
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        // Legacy fields
        subtype: (output.sub_type as string) || (output.faction_type as string),
        summary: (output.dm_slug as string) || (output.summary as string),
        description: output.description as string,
        attributes: {
          ...additionalAttributes,
        },
      }

    case 'encounter':
      return {
        ...baseData,
        // Brain/Soul/Mechanics architecture columns
        sub_type: (output.sub_type as string) || 'combat',
        brain: output.brain || {},
        soul: output.soul || {},
        mechanics: output.mechanics || {},
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        summary: (output.dm_slug as string) || (output.summary as string),
        attributes: {
          ...additionalAttributes,
          rewards: output.rewards,
        },
      }

    default:
      return {
        ...baseData,
        summary: (output.summary as string) || '',
        description: (output.description as string) || '',
        attributes: {
          ...additionalAttributes,
          ...output,
        },
      }
  }
}

function buildNPCDescription(output: Record<string, unknown>): string {
  const parts: string[] = []

  if (output.appearance) {
    parts.push(`**Appearance:** ${output.appearance}`)
  }
  if (output.personality) {
    parts.push(`**Personality:** ${output.personality}`)
  }
  if (output.motivation) {
    parts.push(`**Motivation:** ${output.motivation}`)
  }

  return parts.join('\n\n')
}

// Helper to update an entity's history
export async function addHistoryEntry(
  supabase: SupabaseClient,
  entityId: string,
  entry: HistoryEntry
): Promise<void> {
  // Fetch current entity
  const { data: entity } = await supabase
    .from('entities')
    .select('attributes')
    .eq('id', entityId)
    .single()

  if (!entity) return

  const attributes = (entity.attributes as Record<string, unknown>) || {}
  const history = (attributes.history as HistoryEntry[]) || []

  // Add new entry
  await supabase
    .from('entities')
    .update({
      attributes: {
        ...attributes,
        history: [...history, entry],
      },
    })
    .eq('id', entityId)
}
