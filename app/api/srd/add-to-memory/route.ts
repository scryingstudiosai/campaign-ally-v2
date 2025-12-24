import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SrdCreature, SrdItem } from '@/types/srd'
import type { HistoryEntry } from '@/types/forge'

type SrdEntityType = 'creature' | 'item'

interface AddToMemoryRequest {
  campaignId: string
  entityType: SrdEntityType
  srdEntity: SrdCreature | SrdItem
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AddToMemoryRequest = await request.json()
    const { campaignId, entityType, srdEntity } = body

    if (!campaignId || !entityType || !srdEntity) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, entityType, srdEntity' },
        { status: 400 }
      )
    }

    // Verify user has access to this campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build history entry
    const historyEntry: HistoryEntry = {
      event: 'srd_imported',
      note: `Imported from SRD (${srdEntity.source || 'D&D 5e SRD'})`,
      timestamp: new Date().toISOString(),
    }

    let entityData: Record<string, unknown>

    if (entityType === 'creature') {
      entityData = transformCreatureToEntity(srdEntity as SrdCreature, historyEntry)
    } else if (entityType === 'item') {
      entityData = transformItemToEntity(srdEntity as SrdItem, historyEntry)
    } else {
      return NextResponse.json(
        { error: 'Invalid entityType. Must be "creature" or "item".' },
        { status: 400 }
      )
    }

    // Add campaign_id
    entityData.campaign_id = campaignId

    // Save the entity
    const { data: savedEntity, error } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single()

    if (error) {
      console.error('Failed to save SRD entity:', error)
      return NextResponse.json(
        { error: 'Failed to save entity to Memory' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entity: savedEntity,
      message: `${srdEntity.name} added to Memory`,
    })
  } catch (error) {
    console.error('SRD add-to-memory error:', error)
    return NextResponse.json(
      { error: 'Failed to add SRD entity to Memory' },
      { status: 500 }
    )
  }
}

function transformCreatureToEntity(
  creature: SrdCreature,
  historyEntry: HistoryEntry
): Record<string, unknown> {
  // Build a read-aloud description
  const readAloud = buildCreatureReadAloud(creature)

  // Build the brain (core creature info)
  const brain = {
    purpose: `${creature.creature_type || 'Creature'} from the SRD`,
    tactics: creature.traits?.find(t => t.name.toLowerCase().includes('tactic'))?.description,
    habitat: creature.subtype ? `Often found among ${creature.subtype}` : undefined,
  }

  // Build mechanics from creature stats
  const mechanics = {
    cr: creature.cr,
    cr_numeric: creature.cr_numeric,
    xp_value: creature.xp_value,
    ac: creature.ac,
    ac_type: creature.ac_type,
    hp: creature.hp,
    hp_formula: creature.hp_formula,
    stats: creature.stats,
    speeds: creature.speeds,
    saves: creature.saves,
    skills: creature.skills,
    damage_resistances: creature.damage_resistances,
    damage_immunities: creature.damage_immunities,
    damage_vulnerabilities: creature.damage_vulnerabilities,
    condition_immunities: creature.condition_immunities,
    senses: creature.senses,
    languages: creature.languages,
    traits: creature.traits,
    actions: creature.actions,
    bonus_actions: creature.bonus_actions,
    reactions: creature.reactions,
    legendary_actions: creature.legendary_actions,
    legendary_description: creature.legendary_description,
  }

  return {
    name: creature.name,
    entity_type: 'creature',
    sub_type: creature.creature_type || 'beast',
    status: 'active',
    importance_tier: 'minor',
    visibility: 'dm_only',
    source_forge: 'srd_import',
    brain,
    mechanics,
    read_aloud: readAloud,
    dm_slug: `${creature.size || ''} ${creature.creature_type || 'creature'}, CR ${creature.cr || '?'}`.trim(),
    summary: creature.description || `A ${creature.size?.toLowerCase() || ''} ${creature.creature_type || 'creature'}`,
    subtype: creature.creature_type,
    attributes: {
      history: [historyEntry],
      srd_source: {
        slug: creature.slug,
        source: creature.source,
        license: creature.license,
        game_system: creature.game_system,
      },
      size: creature.size,
      alignment: creature.alignment,
      creature_subtype: creature.subtype,
    },
  }
}

function transformItemToEntity(
  item: SrdItem,
  historyEntry: HistoryEntry
): Record<string, unknown> {
  // Clean description - remove table formatting artifacts and @tags
  const cleanDescription = item.description
    ?.replace(/\|/g, ' ')
    ?.replace(/\s+/g, ' ')
    ?.replace(/\{@\w+\s+([^}]+)\}/g, '$1') // Remove @tags like {@damage 2d4+2}
    ?.trim() || ''

  // Determine item category
  const isWeapon = item.item_type === 'weapon' || !!item.mechanics?.damage
  const isArmor = item.item_type === 'armor' || item.mechanics?.ac !== undefined || item.mechanics?.ac_bonus !== undefined

  // Build the soul (item's lore/flavor)
  const soul = {
    origin: `Official ${item.item_type || 'item'} from the D&D 5e SRD`,
    rarity: item.rarity,
  }

  // Build mechanics from item data - include cleaned effect text
  const mechanics = {
    item_type: item.item_type,
    subtype: item.subtype,
    rarity: item.rarity,
    requires_attunement: item.requires_attunement || false,
    attunement_requirements: item.attunement_requirements,
    value_gp: item.value_gp,
    weight: item.weight,
    // Only include weapon stats for weapons
    ...(isWeapon && {
      damage: item.mechanics?.damage,
      damage_type: item.mechanics?.damage_type,
      properties: item.mechanics?.properties,
    }),
    // Only include armor stats for armor
    ...(isArmor && {
      ac: item.mechanics?.ac,
      ac_bonus: item.mechanics?.ac_bonus,
      stealth_disadvantage: item.mechanics?.stealth_disadvantage,
      str_minimum: item.mechanics?.str_minimum,
    }),
    // Effect text - the actual description of what the item does
    effect: cleanDescription || item.mechanics?.effect,
    charges: item.mechanics?.charges,
    recharge: item.mechanics?.recharge,
  }

  // Generate a short summary for list views
  const shortSummary = item.rarity
    ? `${item.rarity} ${item.item_type || 'item'}`
    : item.item_type || 'item'

  return {
    name: item.name,
    entity_type: 'item',
    sub_type: item.item_type || 'gear',
    status: 'active',
    importance_tier: 'minor',
    visibility: 'dm_only',
    source_forge: 'srd_import',
    soul,
    mechanics,
    // NO read_aloud for SRD items - can be added later by user
    read_aloud: null,
    // DM description gets the full mechanical details
    dm_description: cleanDescription,
    // Player description - clean summary
    description: `A ${item.rarity || 'common'} ${item.item_type || 'item'}.`,
    dm_slug: shortSummary,
    summary: shortSummary,
    subtype: item.item_type,
    attributes: {
      history: [historyEntry],
      srd_source: {
        slug: item.slug,
        source: item.source,
        license: item.license,
        game_system: item.game_system,
      },
      is_srd: true,
      is_identified: true,
      rarity: item.rarity,
      value_gp: item.value_gp,
      weight: item.weight,
    },
  }
}

function buildCreatureReadAloud(creature: SrdCreature): string {
  const parts: string[] = []

  // Opening description
  if (creature.size && creature.creature_type) {
    parts.push(
      `A ${creature.size.toLowerCase()} ${creature.creature_type}${creature.subtype ? ` (${creature.subtype})` : ''} stands before you.`
    )
  }

  // Add alignment flavor if available
  if (creature.alignment) {
    const alignmentFlavor = getAlignmentFlavor(creature.alignment)
    if (alignmentFlavor) {
      parts.push(alignmentFlavor)
    }
  }

  // Add first trait description if it's descriptive
  const flavorTrait = creature.traits?.find(
    t => !t.name.toLowerCase().includes('spellcasting') &&
        !t.name.toLowerCase().includes('multiattack') &&
        t.description.length < 300
  )
  if (flavorTrait) {
    parts.push(flavorTrait.description)
  }

  return parts.join(' ') || `A ${creature.creature_type || 'creature'} of unknown origin.`
}

function getAlignmentFlavor(alignment: string): string | null {
  const lower = alignment.toLowerCase()
  if (lower.includes('chaotic evil')) {
    return 'Its presence exudes malevolence and unpredictability.'
  } else if (lower.includes('lawful evil')) {
    return 'Cold calculation gleams in its eyes.'
  } else if (lower.includes('neutral evil')) {
    return 'It regards you with selfish indifference.'
  } else if (lower.includes('chaotic good')) {
    return 'Despite its wild nature, you sense no malice.'
  } else if (lower.includes('lawful good')) {
    return 'An aura of righteous purpose surrounds it.'
  } else if (lower.includes('chaotic neutral')) {
    return 'Its behavior seems utterly unpredictable.'
  }
  return null
}
