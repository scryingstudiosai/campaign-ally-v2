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

// Determine relationship type based on NPC role for location-NPC relationships
function getLocationNpcRelationshipType(role: string): {
  locationToNpc: string
  npcToLocation: string
  description: string
} {
  const roleLower = role?.toLowerCase() || ''

  // Owner/Proprietor relationships
  if (
    roleLower.includes('owner') ||
    roleLower.includes('proprietor') ||
    roleLower.includes('master') ||
    roleLower.includes('keeper') ||
    roleLower.includes('head') ||
    roleLower.includes('innkeeper') ||
    roleLower.includes('barkeep')
  ) {
    return {
      locationToNpc: 'owned_by',
      npcToLocation: 'owns',
      description: 'Owner/Proprietor',
    }
  }

  // Employee/Staff relationships
  if (
    roleLower.includes('apprentice') ||
    roleLower.includes('assistant') ||
    roleLower.includes('employee') ||
    roleLower.includes('staff') ||
    roleLower.includes('worker') ||
    roleLower.includes('servant') ||
    roleLower.includes('maid') ||
    roleLower.includes('cook') ||
    roleLower.includes('guard') ||
    roleLower.includes('clerk') ||
    roleLower.includes('barmaid') ||
    roleLower.includes('bartender') ||
    roleLower.includes('bouncer')
  ) {
    return {
      locationToNpc: 'employs',
      npcToLocation: 'works_at',
      description: 'Staff member',
    }
  }

  // Resident relationships
  if (
    roleLower.includes('resident') ||
    roleLower.includes('tenant') ||
    roleLower.includes('lives') ||
    roleLower.includes('dweller')
  ) {
    return {
      locationToNpc: 'houses',
      npcToLocation: 'lives_at',
      description: 'Resident',
    }
  }

  // Regular customer/visitor
  if (
    roleLower.includes('regular') ||
    roleLower.includes('patron') ||
    roleLower.includes('customer') ||
    roleLower.includes('visitor')
  ) {
    return {
      locationToNpc: 'frequented_by',
      npcToLocation: 'frequents',
      description: 'Regular patron',
    }
  }

  // Default - works_at is most common for commercial locations
  return {
    locationToNpc: 'employs',
    npcToLocation: 'works_at',
    description: 'Associated with this location',
  }
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
        forge_status: 'stub',
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
  creature: 'creature',
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
    // Valid categories per database constraint
    const validCategories = ['lore', 'plot', 'mechanical', 'secret', 'flavor', 'appearance', 'personality', 'backstory']

    // Map any invalid categories to valid ones
    const mapCategory = (cat: string): string => {
      if (validCategories.includes(cat)) return cat
      // Common mappings for AI-generated categories
      const lowerCat = cat.toLowerCase()
      if (lowerCat.includes('appear')) return 'appearance'
      if (lowerCat.includes('personal')) return 'personality'
      if (lowerCat.includes('secret') || lowerCat.includes('hidden')) return 'secret'
      if (lowerCat.includes('plot') || lowerCat.includes('story')) return 'plot'
      if (lowerCat.includes('back') || lowerCat.includes('history')) return 'backstory'
      if (lowerCat.includes('lore') || lowerCat.includes('world')) return 'lore'
      if (lowerCat.includes('mechanic') || lowerCat.includes('combat') || lowerCat.includes('stat')) return 'mechanical'
      return 'flavor' // Default fallback
    }

    const factRecords = facts.map((fact) => ({
      entity_id: savedEntity.id,
      campaign_id: campaignId,
      content: fact.content,
      category: mapCategory(fact.category),
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
  // Use 'contains' for sub-locations, role-based types for NPCs, otherwise 'related_to'
  // Get inhabitant details from output for NPC role info
  const inhabitants = forgeType === 'location'
    ? ((output.brain as Record<string, unknown>)?.inhabitants as Array<{
        name: string
        role: string
        hook?: string
      }> | undefined)
    : undefined

  for (const stub of context.createdStubs) {
    const isContainsDiscovery = stub.discoveryId.startsWith('contains-')
    const discovery = context.discoveries.find((d) => d.id === stub.discoveryId)
    const isNpcDiscovery = stub.discoveryId.startsWith('npc-') || discovery?.suggestedType === 'npc'

    let relationshipType = 'related_to'
    let description = `Discovered via ${forgeType} forge`

    if (isContainsDiscovery) {
      relationshipType = 'contains'
      description = 'Sub-location'
    } else if (isNpcDiscovery && forgeType === 'location') {
      // Get role from inhabitants or discovery context
      const inhabitant = inhabitants?.find(
        (i) => i.name.toLowerCase() === stub.name.toLowerCase()
      )
      const contextRole = discovery?.context?.split(' - ')?.[0] || discovery?.context?.split(' at ')?.[0]
      const role = inhabitant?.role || contextRole || ''

      // Use role-based relationship type
      const relTypes = getLocationNpcRelationshipType(role)
      relationshipType = relTypes.locationToNpc
      description = relTypes.description
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
    console.log('[EntityMinter] All discoveries:', context.discoveries.map(d => ({ id: d.id, text: d.text, type: d.suggestedType, status: d.status })))

    // Find NPC stubs by EITHER:
    // 1. Discovery ID starts with 'npc-' (from brain.inhabitants)
    // 2. Discovery has suggestedType === 'npc' (from scanner detection)
    const npcDiscoveryIds = new Set(
      context.discoveries
        .filter((d) => d.status === 'create_stub' && (d.id.startsWith('npc-') || d.suggestedType === 'npc'))
        .map((d) => d.id)
    )
    console.log('[EntityMinter] NPC discovery IDs:', Array.from(npcDiscoveryIds))

    const npcStubs = context.createdStubs.filter((stub) => npcDiscoveryIds.has(stub.discoveryId))
    console.log('[EntityMinter] NPC stubs found:', npcStubs.length, npcStubs)

    if (npcStubs.length > 0) {
      // Reuse inhabitants from earlier (already fetched for relationship creation)
      console.log('[EntityMinter] Inhabitants from output.brain:', inhabitants)

      // Build NPC references with entity IDs
      const npcReferences = npcStubs.map((stub) => {
        // Find matching inhabitant data (if AI provided it)
        const inhabitant = inhabitants?.find(
          (i) => i.name.toLowerCase() === stub.name.toLowerCase()
        )
        // Also check discovery context for role info
        const discovery = context.discoveries.find((d) => d.id === stub.discoveryId)
        const contextRole = discovery?.context?.split(' - ')?.[0] || discovery?.context?.split(' at ')?.[0]

        return {
          name: stub.name,
          role: inhabitant?.role || contextRole || 'Staff',
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
        // Verify the update by re-fetching
        const { data: verifyData } = await supabase
          .from('entities')
          .select('id, name, soul, brain')
          .eq('id', savedEntity.id)
          .single()
        console.log('[EntityMinter] VERIFICATION - Entity after update:')
        console.log('[EntityMinter] - soul:', JSON.stringify(verifyData?.soul, null, 2))
        console.log('[EntityMinter] - brain:', JSON.stringify(verifyData?.brain, null, 2))
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

    case 'creature':
      return {
        ...baseData,
        // Brain/Soul/Mechanics architecture columns
        sub_type: (output.sub_type as string) || 'beast',
        brain: output.brain || {},
        soul: output.soul || {},
        mechanics: output.mechanics || {},
        read_aloud: output.read_aloud as string,
        dm_slug: (output.dm_slug as string) || (output.dmSlug as string),
        summary: (output.soul as Record<string, unknown>)?.vivid_description as string ||
          (output.dm_slug as string) || '',
        description: (output.soul as Record<string, unknown>)?.vivid_description as string || '',
        attributes: {
          ...additionalAttributes,
          treasure: output.treasure,
          srd_base: output.srd_base,
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

// Loot item structure for inventory integration
interface LootItem {
  name: string
  quantity: number
  description?: string
}

// Result of processing loot into inventory
export interface LootProcessingResult {
  srdItems: number
  customItems: number
  errors: string[]
}

// Common item name variations that map to SRD items
const ITEM_NAME_VARIATIONS: Record<string, string> = {
  'sword': 'Longsword',
  'steel sword': 'Longsword',
  'iron sword': 'Longsword',
  'axe': 'Handaxe',
  'battle axe': 'Battleaxe',
  'bow': 'Shortbow',
  'staff': 'Quarterstaff',
  'wooden staff': 'Quarterstaff',
  'club': 'Club',
  'mace': 'Mace',
  'hammer': 'Warhammer',
  'spear': 'Spear',
  'javelin': 'Javelin',
  'crossbow': 'Crossbow, Light',
  'light crossbow': 'Crossbow, Light',
  'heavy crossbow': 'Crossbow, Heavy',
  'shield': 'Shield',
  'leather armor': 'Leather Armor',
  'chain mail': 'Chain Mail',
  'chainmail': 'Chain Mail',
  'plate armor': 'Plate',
  'potion': 'Potion of Healing',
  'health potion': 'Potion of Healing',
  'healing potion': 'Potion of Healing',
  'healing elixir': 'Potion of Healing',
  'antidote': 'Antitoxin',
  'rope': 'Rope, Hempen (50 feet)',
  'torch': 'Torch',
  'lantern': 'Lantern, Hooded',
  'backpack': 'Backpack',
  'bedroll': 'Bedroll',
  'rations': 'Rations (1 day)',
  'waterskin': 'Waterskin',
}

/**
 * Infer the item type/category from the item name
 */
function inferItemType(name: string): string {
  const nameLower = name.toLowerCase()
  if (/sword|axe|mace|hammer|dagger|spear|bow|crossbow|staff|club|flail|halberd|pike|rapier|scimitar|whip|trident|glaive/.test(nameLower)) return 'weapon'
  if (/armor|mail|plate|leather|shield|helm|helmet|gauntlet|boot|greave|bracer/.test(nameLower)) return 'armor'
  if (/potion|elixir|oil|salve|tonic|draught/.test(nameLower)) return 'potion'
  if (/scroll|tome|book|letter|map|note|document|journal|diary/.test(nameLower)) return 'document'
  if (/ring|amulet|necklace|bracelet|cloak|robe|circlet|crown|brooch|pendant/.test(nameLower)) return 'wondrous item'
  if (/gold|silver|copper|gem|jewel|coin|ruby|emerald|sapphire|diamond/.test(nameLower)) return 'treasure'
  if (/key|lockpick|thieves|tool/.test(nameLower)) return 'tool'
  if (/wand|rod|orb|focus|crystal/.test(nameLower)) return 'arcane focus'
  return 'adventuring gear'
}

/**
 * Find an SRD item match with fuzzy matching
 */
async function findSrdItemMatch(
  supabase: SupabaseClient,
  itemName: string
): Promise<{ id: string; name: string; item_type: string; rarity: string | null; value_gp: number | null; weight: number | null } | null> {
  // Normalize the item name
  const normalized = itemName.toLowerCase()
    .replace(/^(steel|iron|wooden|silver|golden|masterwork|fine|crude|old|rusty|worn|ancient|enchanted)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Try exact match first (case-insensitive)
  const { data: exactMatch } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', normalized)
    .limit(1)
    .single()

  if (exactMatch) return exactMatch

  // Try original name as-is
  const { data: originalMatch } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', itemName)
    .limit(1)
    .single()

  if (originalMatch) return originalMatch

  // Try fuzzy match (contains)
  const { data: fuzzyMatch } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', `%${normalized}%`)
    .limit(1)
    .single()

  if (fuzzyMatch) return fuzzyMatch

  // Try known variations
  for (const [key, srdName] of Object.entries(ITEM_NAME_VARIATIONS)) {
    if (normalized.includes(key) || normalized === key) {
      const { data: variation } = await supabase
        .from('srd_items')
        .select('id, name, item_type, rarity, value_gp, weight')
        .ilike('name', srdName)
        .limit(1)
        .single()

      if (variation) return variation
    }
  }

  return null
}

/**
 * Process NPC loot items into the inventory system
 * - SRD items are added directly as inventory instances
 * - Custom items are created as item entity stubs and added to inventory
 */
export async function processLootToInventory(
  supabase: SupabaseClient,
  campaignId: string,
  ownerId: string,
  ownerName: string,
  loot: LootItem[] | string[]
): Promise<LootProcessingResult> {
  const result: LootProcessingResult = { srdItems: 0, customItems: 0, errors: [] }

  // Normalize loot to LootItem format
  const normalizedLoot: LootItem[] = loot.map((item) => {
    if (typeof item === 'string') {
      // Legacy string format - parse as single item
      return { name: item, quantity: 1 }
    }
    return item
  })

  for (const lootItem of normalizedLoot) {
    try {
      // Skip empty items
      if (!lootItem.name?.trim()) continue

      // Handle currency separately (Gold pieces, Silver pieces, etc.)
      if (lootItem.name.toLowerCase().includes('pieces') ||
          lootItem.name.toLowerCase().includes('gold') ||
          lootItem.name.toLowerCase().includes('silver') ||
          lootItem.name.toLowerCase().includes('copper')) {
        // Add as note in inventory - we don't have a currency system
        // For now, skip currency items (they're just tracked in attributes)
        continue
      }

      // Try to find SRD item match with fuzzy matching
      const srdItem = await findSrdItemMatch(supabase, lootItem.name)

      if (srdItem) {
        // Add SRD item to inventory
        const { error } = await supabase.from('inventory_instances').insert({
          campaign_id: campaignId,
          srd_item_id: srdItem.id,
          owner_type: 'npc',
          owner_id: ownerId,
          quantity: lootItem.quantity || 1,
          acquired_from: `Generated with ${ownerName}`,
          is_identified: true,
          // Note if the original name was different
          notes: lootItem.name.toLowerCase() !== srdItem.name.toLowerCase()
            ? `Originally: ${lootItem.name}`
            : null,
        })

        if (error) {
          result.errors.push(`Failed to add ${lootItem.name} to inventory: ${error.message}`)
        } else {
          result.srdItems++
        }
      } else {
        // Create custom item entity with inferred type
        const itemType = inferItemType(lootItem.name)
        const { data: itemEntity, error: entityError } = await supabase
          .from('entities')
          .insert({
            campaign_id: campaignId,
            name: lootItem.name,
            entity_type: 'item',
            sub_type: itemType,
            forge_status: 'stub',
            status: 'active',
            summary: lootItem.description || `Custom ${itemType} from ${ownerName}`,
            description: lootItem.description || `Found on ${ownerName}`,
            mechanics: {
              item_type: itemType,
              requires_attunement: false,
              rarity: 'common',
            },
            attributes: {
              is_stub: true,
              needs_review: true,
              source_entity_id: ownerId,
              source_entity_name: ownerName,
              stub_context: lootItem.description || `Carried by ${ownerName}`,
            },
          })
          .select('id')
          .single()

        if (entityError) {
          result.errors.push(`Failed to create item ${lootItem.name}: ${entityError.message}`)
          continue
        }

        // Add to inventory
        const { error: invError } = await supabase.from('inventory_instances').insert({
          campaign_id: campaignId,
          custom_entity_id: itemEntity.id,
          owner_type: 'npc',
          owner_id: ownerId,
          quantity: lootItem.quantity || 1,
          acquired_from: `Generated with ${ownerName}`,
          notes: lootItem.description,
          is_identified: true,
        })

        if (invError) {
          result.errors.push(`Failed to add ${lootItem.name} to inventory: ${invError.message}`)
        } else {
          result.customItems++
        }
      }
    } catch (err) {
      result.errors.push(`Error processing ${lootItem.name}: ${String(err)}`)
    }
  }

  return result
}
