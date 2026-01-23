// Relationship Extractor
// Extracts implicit relationships from forged entity data and creates them in the database

import { SupabaseClient } from '@supabase/supabase-js'

export interface ExtractedRelationship {
  sourceId: string
  targetId: string
  targetName: string
  type: string
  description?: string
  context?: string
}

interface EntityReference {
  id: string
  name: string
  entity_type: string
  summary?: string
}

interface RelationshipMatch {
  entityId: string
  entityName: string
  relType: string
  description: string
  matchedIn: string
}

// Relationship type categories for context building
export interface CategorizedRelationships {
  conflicts: RelationshipWithEntities[]
  alliances: RelationshipWithEntities[]
  locations: RelationshipWithEntities[]
  memberships: RelationshipWithEntities[]
  ownership: RelationshipWithEntities[]
  other: RelationshipWithEntities[]
}

export interface RelationshipWithEntities {
  id: string
  relationship_type: string
  description?: string
  surface_description?: string
  intensity?: string
  source_entity?: EntityReference | null
  target_entity?: EntityReference | null
}

/**
 * Extract relationships from a forged entity by scanning its content
 * for mentions of other existing entities
 */
export async function extractRelationshipsFromEntity(
  supabase: SupabaseClient,
  campaignId: string,
  entityId: string,
  entityType: string,
  entityData: Record<string, unknown>,
  existingEntities?: EntityReference[]
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = []

  // Fetch existing entities if not provided
  if (!existingEntities) {
    const { data } = await supabase
      .from('entities')
      .select('id, name, entity_type, summary')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .neq('id', entityId)

    existingEntities = (data || []) as EntityReference[]
  }

  // Build name-to-entity map for matching
  const entityNameMap = new Map<string, EntityReference>()
  existingEntities.forEach((e) => {
    if (e.id !== entityId) {
      entityNameMap.set(e.name.toLowerCase(), e)
      // Also add without "The" prefix
      if (e.name.toLowerCase().startsWith('the ')) {
        entityNameMap.set(e.name.toLowerCase().slice(4), e)
      }
    }
  })

  // Helper to find entity mentions in text
  const findEntityMentions = (
    text: string,
    filterType?: string
  ): EntityReference[] => {
    if (!text) return []
    const textLower = text.toLowerCase()
    const found: EntityReference[] = []

    for (const [name, entity] of entityNameMap) {
      if (name.length > 3 && textLower.includes(name)) {
        if (!filterType || entity.entity_type === filterType) {
          found.push(entity)
        }
      }
    }
    return found
  }

  // Helper to determine relationship type from context
  const inferRelationshipType = (
    context: string,
    sourceType: string,
    targetType: string
  ): { type: string; description: string } => {
    const ctxLower = context.toLowerCase()

    // Conflict relationships
    if (
      ctxLower.includes('enemy') ||
      ctxLower.includes('rival') ||
      ctxLower.includes('opposes') ||
      ctxLower.includes('hates') ||
      ctxLower.includes('hunts') ||
      ctxLower.includes('nemesis')
    ) {
      return { type: 'rival', description: 'Rival/Enemy' }
    }
    if (ctxLower.includes('fear') || ctxLower.includes('afraid')) {
      return { type: 'fears', description: 'Fears' }
    }
    if (ctxLower.includes('betray') || ctxLower.includes('betrayed')) {
      return { type: 'betrayed_by', description: 'Betrayed by' }
    }

    // Alliance relationships
    if (
      ctxLower.includes('ally') ||
      ctxLower.includes('friend') ||
      ctxLower.includes('trusts')
    ) {
      return { type: 'ally', description: 'Ally/Friend' }
    }
    if (ctxLower.includes('loves') || ctxLower.includes('lover')) {
      return { type: 'loves', description: 'Romantic connection' }
    }
    if (ctxLower.includes('protect') || ctxLower.includes('guards')) {
      return { type: 'protects', description: 'Protects' }
    }

    // Hierarchy relationships
    if (
      ctxLower.includes('serves') ||
      ctxLower.includes('works for') ||
      ctxLower.includes('reports to')
    ) {
      return { type: 'serves', description: 'Serves/Reports to' }
    }
    if (ctxLower.includes('leads') || ctxLower.includes('commands')) {
      return { type: 'leads', description: 'Leads/Commands' }
    }

    // Knowledge relationships
    if (ctxLower.includes('knows about') || ctxLower.includes('secret about')) {
      return { type: 'knows_secret_about', description: 'Knows a secret about' }
    }
    if (ctxLower.includes('seeks') || ctxLower.includes('searching for')) {
      return { type: 'seeks', description: 'Actively seeking' }
    }

    // Location relationships
    if (sourceType === 'location' || targetType === 'location') {
      if (ctxLower.includes('lives') || ctxLower.includes('resides')) {
        return { type: 'lives_at', description: 'Resides at' }
      }
      if (ctxLower.includes('works') || ctxLower.includes('employed')) {
        return { type: 'works_at', description: 'Works at' }
      }
      if (ctxLower.includes('owns') || ctxLower.includes('runs')) {
        return { type: 'owns', description: 'Owns/Operates' }
      }
      if (ctxLower.includes('frequents') || ctxLower.includes('visits')) {
        return { type: 'frequents', description: 'Regular visitor' }
      }
      if (ctxLower.includes('controls') || ctxLower.includes('rules')) {
        return { type: 'controls', description: 'Controls' }
      }
    }

    // Faction relationships
    if (sourceType === 'faction' || targetType === 'faction') {
      if (ctxLower.includes('member') || ctxLower.includes('belongs')) {
        return { type: 'member_of', description: 'Member of' }
      }
      if (ctxLower.includes('leads') || ctxLower.includes('leader')) {
        return { type: 'led_by', description: 'Led by' }
      }
    }

    // Item relationships
    if (sourceType === 'item' || targetType === 'item') {
      if (ctxLower.includes('owns') || ctxLower.includes('possesses')) {
        return { type: 'owns', description: 'Owns' }
      }
      if (ctxLower.includes('created') || ctxLower.includes('made')) {
        return { type: 'created_by', description: 'Created by' }
      }
      if (ctxLower.includes('wields') || ctxLower.includes('uses')) {
        return { type: 'wields', description: 'Wields/Uses' }
      }
    }

    // Quest relationships
    if (sourceType === 'quest' || targetType === 'quest') {
      if (ctxLower.includes('given by') || ctxLower.includes('quest giver')) {
        return { type: 'given_by', description: 'Quest giver' }
      }
      if (ctxLower.includes('target') || ctxLower.includes('objective')) {
        return { type: 'targets', description: 'Quest target' }
      }
      if (ctxLower.includes('reward')) {
        return { type: 'rewards', description: 'Quest reward' }
      }
    }

    // Default
    return { type: 'related_to', description: 'Related to' }
  }

  // Add relationship if not duplicate
  const addRelationship = (match: RelationshipMatch): void => {
    // Check for duplicates (same source, target, type)
    const isDuplicate = relationships.some(
      (r) => r.targetId === match.entityId && r.type === match.relType
    )
    if (!isDuplicate) {
      relationships.push({
        sourceId: entityId,
        targetId: match.entityId,
        targetName: match.entityName,
        type: match.relType,
        description: match.description,
        context: `Extracted from ${match.matchedIn}`,
      })
    }
  }

  // Extract based on entity type
  switch (entityType) {
    case 'npc': {
      // Extract from brain
      const brain = entityData.brain as Record<string, unknown> | undefined
      if (brain) {
        // Check desire, fear, leverage, secret for entity mentions
        const brainFields = ['desire', 'fear', 'leverage', 'line', 'secret']
        for (const field of brainFields) {
          const fieldValue = brain[field] as string | undefined
          if (fieldValue) {
            const mentions = findEntityMentions(fieldValue)
            for (const entity of mentions) {
              const { type, description } = inferRelationshipType(
                fieldValue,
                'npc',
                entity.entity_type
              )
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType: type,
                description,
                matchedIn: `brain.${field}`,
              })
            }
          }
        }

        // Check enemies/rivals/allies arrays
        const enemies = brain.enemies as string | string[] | undefined
        const rivals = brain.rivals as string | string[] | undefined
        const allies = brain.allies as string | string[] | undefined

        const processRelArray = (
          arr: string | string[] | undefined,
          relType: string,
          desc: string
        ): void => {
          if (!arr) return
          const items = Array.isArray(arr) ? arr : [arr]
          for (const item of items) {
            const mentions = findEntityMentions(item, 'npc')
            for (const entity of mentions) {
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType,
                description: desc,
                matchedIn: 'brain relationships',
              })
            }
          }
        }

        processRelArray(enemies, 'rival', 'Enemy')
        processRelArray(rivals, 'rival', 'Rival')
        processRelArray(allies, 'ally', 'Ally')
      }

      // Check attributes for location, faction
      const attributes = entityData.attributes as Record<string, unknown> | undefined
      if (attributes) {
        // Location mentions
        const locationFields = [
          attributes.location,
          attributes.home,
          attributes.workplace,
        ].filter(Boolean) as string[]

        for (const locStr of locationFields) {
          const mentions = findEntityMentions(locStr, 'location')
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'located_at',
              description: 'Associated with this location',
              matchedIn: 'attributes.location',
            })
          }
        }

        // Faction mentions
        const factionFields = [
          attributes.faction,
          attributes.organization,
          attributes.allegiance,
        ].filter(Boolean) as string[]

        for (const factionStr of factionFields) {
          const mentions = findEntityMentions(factionStr, 'faction')
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'member_of',
              description: 'Member of faction',
              matchedIn: 'attributes.faction',
            })
          }
        }
      }

      // Check connectionHooks
      const connectionHooks = entityData.connectionHooks as string[] | undefined
      if (connectionHooks) {
        for (const hook of connectionHooks) {
          const mentions = findEntityMentions(hook)
          for (const entity of mentions) {
            const { type, description } = inferRelationshipType(
              hook,
              'npc',
              entity.entity_type
            )
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: type,
              description,
              matchedIn: 'connectionHooks',
            })
          }
        }
      }

      // Check summary/description
      const summary = entityData.summary as string | undefined
      const description = entityData.description as string | undefined
      const searchText = `${summary || ''} ${description || ''}`
      if (searchText.length > 10) {
        const mentions = findEntityMentions(searchText)
        for (const entity of mentions) {
          const { type, description: relDesc } = inferRelationshipType(
            searchText,
            'npc',
            entity.entity_type
          )
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: type,
            description: relDesc,
            matchedIn: 'summary/description',
          })
        }
      }
      break
    }

    case 'location': {
      // Check soul for key_figures, governance
      const soul = entityData.soul as Record<string, unknown> | undefined
      if (soul) {
        // Key figures at this location
        const keyFigures = soul.key_figures as Array<{ name: string; role?: string; entity_id?: string }> | undefined
        if (keyFigures) {
          for (const figure of keyFigures) {
            if (figure.entity_id) {
              // Already have entity ID
              addRelationship({
                entityId: figure.entity_id,
                entityName: figure.name,
                relType: figure.role?.toLowerCase().includes('owner') ? 'owned_by' : 'employs',
                description: figure.role || 'Associated NPC',
                matchedIn: 'soul.key_figures',
              })
            } else {
              // Try to match by name
              const mentions = findEntityMentions(figure.name, 'npc')
              for (const entity of mentions) {
                addRelationship({
                  entityId: entity.id,
                  entityName: entity.name,
                  relType: figure.role?.toLowerCase().includes('owner') ? 'owned_by' : 'employs',
                  description: figure.role || 'Associated NPC',
                  matchedIn: 'soul.key_figures',
                })
              }
            }
          }
        }

        // Governance/controlling faction
        const governance = soul.governance as string | undefined
        if (governance) {
          const mentions = findEntityMentions(governance, 'faction')
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'controlled_by',
              description: 'Controlling faction',
              matchedIn: 'soul.governance',
            })
          }
        }
      }

      // Check brain for owner, staff
      const brain = entityData.brain as Record<string, unknown> | undefined
      if (brain) {
        const owner = brain.owner as { name: string; entity_id?: string } | undefined
        if (owner) {
          if (owner.entity_id) {
            addRelationship({
              entityId: owner.entity_id,
              entityName: owner.name,
              relType: 'owned_by',
              description: 'Owner/Proprietor',
              matchedIn: 'brain.owner',
            })
          } else {
            const mentions = findEntityMentions(owner.name, 'npc')
            for (const entity of mentions) {
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType: 'owned_by',
                description: 'Owner/Proprietor',
                matchedIn: 'brain.owner',
              })
            }
          }
        }
      }

      // Check attributes for parent location
      const attributes = entityData.attributes as Record<string, unknown> | undefined
      if (attributes) {
        const parentFields = [attributes.region, attributes.parent, attributes.part_of].filter(Boolean) as string[]
        for (const parentStr of parentFields) {
          const mentions = findEntityMentions(parentStr, 'location')
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'located_in',
              description: 'Parent location',
              matchedIn: 'attributes.region',
            })
          }
        }
      }
      break
    }

    case 'faction': {
      // Check brain for rivals, allies
      const brain = entityData.brain as Record<string, unknown> | undefined
      if (brain) {
        // Rival factions
        const rivals = brain.rivals as string | string[] | undefined
        const enemies = brain.enemies as string | string[] | undefined

        const processRivals = (arr: string | string[] | undefined): void => {
          if (!arr) return
          const items = Array.isArray(arr) ? arr : [arr]
          for (const item of items) {
            const mentions = findEntityMentions(item, 'faction')
            for (const entity of mentions) {
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType: 'rival',
                description: 'Rival faction',
                matchedIn: 'brain.rivals/enemies',
              })
            }
          }
        }

        processRivals(rivals)
        processRivals(enemies)

        // Allied factions
        const allies = brain.allies as string | string[] | undefined
        if (allies) {
          const items = Array.isArray(allies) ? allies : [allies]
          for (const item of items) {
            const mentions = findEntityMentions(item, 'faction')
            for (const entity of mentions) {
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType: 'allied_with',
                description: 'Allied faction',
                matchedIn: 'brain.allies',
              })
            }
          }
        }
      }

      // Check soul/attributes for leader
      const soul = entityData.soul as Record<string, unknown> | undefined
      const attributes = entityData.attributes as Record<string, unknown> | undefined

      const leaderFields = [
        soul?.leader,
        soul?.leadership,
        attributes?.leader,
        brain?.leader,
      ].filter(Boolean) as string[]

      for (const leaderStr of leaderFields) {
        const mentions = findEntityMentions(leaderStr, 'npc')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'led_by',
            description: 'Faction leader',
            matchedIn: 'soul/attributes.leader',
          })
        }
      }

      // Check attributes for headquarters
      const headquarters = attributes?.headquarters as string | undefined
      if (headquarters) {
        const mentions = findEntityMentions(headquarters, 'location')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'headquartered_at',
            description: 'Faction headquarters',
            matchedIn: 'attributes.headquarters',
          })
        }
      }
      break
    }

    case 'quest': {
      // Check attributes for patron/quest giver
      const attributes = entityData.attributes as Record<string, unknown> | undefined
      const soul = entityData.soul as Record<string, unknown> | undefined

      const patronFields = [
        attributes?.patron,
        attributes?.quest_giver,
        soul?.given_by,
      ].filter(Boolean) as string[]

      for (const patronStr of patronFields) {
        const mentions = findEntityMentions(patronStr, 'npc')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'given_by',
            description: 'Quest giver',
            matchedIn: 'attributes.patron',
          })
        }
      }

      // Check for target locations
      const targetFields = [
        attributes?.location,
        attributes?.target,
        soul?.destination,
      ].filter(Boolean) as string[]

      for (const targetStr of targetFields) {
        const locationMentions = findEntityMentions(targetStr, 'location')
        for (const entity of locationMentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'targets',
            description: 'Quest target location',
            matchedIn: 'attributes.location/target',
          })
        }

        const npcMentions = findEntityMentions(targetStr, 'npc')
        for (const entity of npcMentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'targets',
            description: 'Quest target NPC',
            matchedIn: 'attributes.target',
          })
        }
      }

      // Check for involved factions
      const factionFields = [
        attributes?.faction,
        attributes?.involves,
      ].filter(Boolean) as string[]

      for (const factionStr of factionFields) {
        const mentions = findEntityMentions(factionStr, 'faction')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'involves',
            description: 'Involved faction',
            matchedIn: 'attributes.faction/involves',
          })
        }
      }

      // Check connected_entities array
      const connectedEntities = attributes?.connected_entities as string[] | undefined
      if (connectedEntities) {
        for (const conn of connectedEntities) {
          const mentions = findEntityMentions(conn)
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'involves',
              description: 'Connected entity',
              matchedIn: 'attributes.connected_entities',
            })
          }
        }
      }
      break
    }

    case 'item': {
      // Check attributes for owner, creator
      const attributes = entityData.attributes as Record<string, unknown> | undefined
      const soul = entityData.soul as Record<string, unknown> | undefined
      const brain = entityData.brain as Record<string, unknown> | undefined

      // Owner
      const ownerFields = [
        attributes?.owner,
        attributes?.current_owner,
        brain?.owner,
      ].filter(Boolean) as string[]

      for (const ownerStr of ownerFields) {
        const mentions = findEntityMentions(ownerStr, 'npc')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'owned_by',
            description: 'Current owner',
            matchedIn: 'attributes.owner',
          })
        }
      }

      // Creator
      const creatorFields = [
        attributes?.creator,
        attributes?.created_by,
        soul?.origin,
        attributes?.origin_history,
      ].filter(Boolean) as string[]

      for (const creatorStr of creatorFields) {
        const mentions = findEntityMentions(creatorStr, 'npc')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'created_by',
            description: 'Creator',
            matchedIn: 'attributes.creator/origin',
          })
        }
      }

      // Location found at
      const locationFields = [
        attributes?.location,
        attributes?.found_at,
      ].filter(Boolean) as string[]

      for (const locStr of locationFields) {
        const mentions = findEntityMentions(locStr, 'location')
        for (const entity of mentions) {
          addRelationship({
            entityId: entity.id,
            entityName: entity.name,
            relType: 'found_at',
            description: 'Location where item is found',
            matchedIn: 'attributes.location',
          })
        }
      }
      break
    }

    case 'encounter': {
      // Check mechanics for creatures
      const mechanics = entityData.mechanics as Record<string, unknown> | undefined
      if (mechanics) {
        const creatures = mechanics.creatures as Array<{ name: string }> | undefined
        if (creatures) {
          for (const creature of creatures) {
            const mentions = findEntityMentions(creature.name, 'creature')
            for (const entity of mentions) {
              addRelationship({
                entityId: entity.id,
                entityName: entity.name,
                relType: 'features',
                description: 'Featured creature',
                matchedIn: 'mechanics.creatures',
              })
            }
          }
        }
      }

      // Check brain for location
      const brain = entityData.brain as Record<string, unknown> | undefined
      if (brain) {
        const locationStr = brain.location as string | undefined
        if (locationStr) {
          const mentions = findEntityMentions(locationStr, 'location')
          for (const entity of mentions) {
            addRelationship({
              entityId: entity.id,
              entityName: entity.name,
              relType: 'located_at',
              description: 'Encounter location',
              matchedIn: 'brain.location',
            })
          }
        }
      }
      break
    }
  }

  console.log(`[RelationshipExtractor] Extracted ${relationships.length} relationships for ${entityType} ${entityId}`)
  relationships.forEach((r) => {
    console.log(`  ${r.type} → ${r.targetName} (from ${r.context})`)
  })

  return relationships
}

/**
 * Save extracted relationships to the database, avoiding duplicates
 */
export async function saveExtractedRelationships(
  supabase: SupabaseClient,
  campaignId: string,
  relationships: ExtractedRelationship[]
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const rel of relationships) {
    // Check if relationship already exists (in either direction for symmetric types)
    const symmetricTypes = ['rival', 'ally', 'allied_with', 'knows', 'related_to']
    const isSymmetric = symmetricTypes.includes(rel.type)

    let existsQuery = supabase
      .from('relationships')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('source_id', rel.sourceId)
      .eq('target_id', rel.targetId)
      .eq('relationship_type', rel.type)
      .limit(1)

    const { data: existing } = await existsQuery

    if (existing && existing.length > 0) {
      skipped++
      continue
    }

    // Check reverse direction for symmetric relationships
    if (isSymmetric) {
      const { data: reverseExisting } = await supabase
        .from('relationships')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('source_id', rel.targetId)
        .eq('target_id', rel.sourceId)
        .eq('relationship_type', rel.type)
        .limit(1)

      if (reverseExisting && reverseExisting.length > 0) {
        skipped++
        continue
      }
    }

    // Create the relationship
    const { error } = await supabase.from('relationships').insert({
      campaign_id: campaignId,
      source_id: rel.sourceId,
      target_id: rel.targetId,
      relationship_type: rel.type,
      description: rel.description,
      surface_description: rel.context,
    })

    if (error) {
      console.error(`[RelationshipExtractor] Failed to create relationship: ${error.message}`)
      skipped++
    } else {
      created++
    }
  }

  console.log(`[RelationshipExtractor] Created ${created} relationships, skipped ${skipped} duplicates`)
  return { created, skipped }
}

/**
 * Categorize relationships for context building
 */
export function categorizeRelationships(
  relationships: RelationshipWithEntities[]
): CategorizedRelationships {
  const categories: CategorizedRelationships = {
    conflicts: [],
    alliances: [],
    locations: [],
    memberships: [],
    ownership: [],
    other: [],
  }

  const conflictTypes = ['rival', 'enemy', 'opposes', 'hunts', 'betrayed', 'betrayed_by', 'fears', 'hates']
  const allianceTypes = ['ally', 'friend', 'trusts', 'loves', 'protects', 'serves', 'allied_with']
  const locationTypes = [
    'located_at', 'located_in', 'lives_in', 'lives_at', 'works_at', 'found_at',
    'controls', 'controlled_by', 'headquartered_at', 'frequents'
  ]
  const membershipTypes = ['member_of', 'led_by', 'has_member', 'belongs_to', 'leads']
  const ownershipTypes = ['owns', 'owned_by', 'created_by', 'wields', 'possesses']

  for (const rel of relationships) {
    const type = rel.relationship_type?.toLowerCase() || ''

    if (conflictTypes.includes(type)) {
      categories.conflicts.push(rel)
    } else if (allianceTypes.includes(type)) {
      categories.alliances.push(rel)
    } else if (locationTypes.includes(type)) {
      categories.locations.push(rel)
    } else if (membershipTypes.includes(type)) {
      categories.memberships.push(rel)
    } else if (ownershipTypes.includes(type)) {
      categories.ownership.push(rel)
    } else {
      categories.other.push(rel)
    }
  }

  return categories
}

/**
 * Check relationship density for an entity
 */
export function checkRelationshipDensity(
  entityId: string,
  relationships: RelationshipWithEntities[]
): { count: number; warning: string | null } {
  const relCount = relationships.filter(
    (r) =>
      r.source_entity?.id === entityId || r.target_entity?.id === entityId
  ).length

  if (relCount === 0) {
    return { count: 0, warning: 'ISOLATED - has no relationships!' }
  } else if (relCount < 2) {
    return { count: relCount, warning: 'SPARSE - consider adding more connections' }
  }
  return { count: relCount, warning: null }
}

/**
 * Build formatted relationship context for AI prompts
 */
export function buildRelationshipContext(
  categories: CategorizedRelationships
): string {
  let context = ''

  if (categories.conflicts.length > 0) {
    context += `\n🔥 CONFLICTS & RIVALRIES - Perfect for Drama!
${categories.conflicts
  .map((r) => {
    const source = r.source_entity?.name || 'Unknown'
    const target = r.target_entity?.name || 'Unknown'
    const desc = r.description || r.surface_description || ''
    return `• ${source} is ${r.relationship_type.toUpperCase()} of ${target}
  → ${desc || 'Use this tension!'}`
  })
  .join('\n')}
`
  }

  if (categories.alliances.length > 0) {
    context += `\n🤝 ALLIANCES & FRIENDSHIPS - For Support & Aid
${categories.alliances
  .map((r) => {
    const source = r.source_entity?.name || 'Unknown'
    const target = r.target_entity?.name || 'Unknown'
    return `• ${source} ${r.relationship_type} ${target}`
  })
  .join('\n')}
`
  }

  if (categories.locations.length > 0) {
    context += `\n📍 LOCATION CONNECTIONS - Who Is Where
${categories.locations
  .map((r) => {
    const source = r.source_entity?.name || 'Unknown'
    const target = r.target_entity?.name || 'Unknown'
    return `• ${source} ${r.relationship_type} ${target}`
  })
  .join('\n')}
`
  }

  if (categories.memberships.length > 0) {
    context += `\n🏛️ FACTION MEMBERSHIPS - Political Ties
${categories.memberships
  .map((r) => {
    const source = r.source_entity?.name || 'Unknown'
    const target = r.target_entity?.name || 'Unknown'
    return `• ${source} ${r.relationship_type} ${target}`
  })
  .join('\n')}
`
  }

  if (categories.ownership.length > 0) {
    context += `\n🎒 OWNERSHIP & CREATION
${categories.ownership
  .map((r) => {
    const source = r.source_entity?.name || 'Unknown'
    const target = r.target_entity?.name || 'Unknown'
    return `• ${source} ${r.relationship_type} ${target}`
  })
  .join('\n')}
`
  }

  if (context) {
    context += '\n⚠️ USE THESE RELATIONSHIPS! They create continuity and drama!'
  }

  return context
}
