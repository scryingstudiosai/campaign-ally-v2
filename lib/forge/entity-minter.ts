// Entity Minter
// Creates stub entities and saves forged entities to the database

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Discovery,
  Conflict,
  ForgeType,
  HistoryEntry,
} from '@/types/forge'

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
}

export async function saveForgedEntity(
  supabase: SupabaseClient,
  campaignId: string,
  forgeType: ForgeType,
  output: Record<string, unknown> | null,
  context: CommitContext
): Promise<unknown> {
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
  for (const stub of context.createdStubs) {
    await supabase.from('relationships').insert({
      campaign_id: campaignId,
      source_id: savedEntity.id,
      target_id: stub.entityId,
      relationship_type: 'related_to',
      description: `Discovered via ${forgeType} forge`,
    })
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
        subtype: output.race as string,
        summary: output.dmSlug as string,
        description: buildNPCDescription(output),
        attributes: {
          ...additionalAttributes,
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
        subtype: output.item_type as string,
        summary: output.public_description as string,
        description: output.secret_description as string,
        attributes: {
          ...additionalAttributes,
          item_type: output.item_type,
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
        subtype: output.location_type as string,
        summary: output.summary as string,
        description: output.description as string,
        attributes: {
          ...additionalAttributes,
          location_type: output.location_type,
          atmosphere: output.atmosphere,
          notable_features: output.notable_features,
          secrets: output.secrets,
          encounters: output.encounters,
        },
      }

    case 'faction':
      return {
        ...baseData,
        subtype: output.faction_type as string,
        summary: output.summary as string,
        description: output.description as string,
        attributes: {
          ...additionalAttributes,
          faction_type: output.faction_type,
          goals: output.goals,
          resources: output.resources,
          leadership: output.leadership,
          membership: output.membership,
          secrets: output.secrets,
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
