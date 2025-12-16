import { SupabaseClient } from '@supabase/supabase-js'
import type { ForgeType } from '@/types/forge'

interface PromptContext {
  codex: CampaignCodex | null
  relatedEntities: RelatedEntity[]
  recentHistory: string[]
  userInput: Record<string, unknown>
}

export interface CampaignCodex {
  setting?: string
  themes?: string[]
  tone?: string
  naming_conventions?: {
    notes?: string
    examples?: string[]
  }
  safety_presets?: string[]
  proper_nouns?: Array<{ name: string; description: string }>
  resolved_questions?: Array<{ question: string; answer: string }>
}

interface RelatedEntity {
  id: string
  name: string
  type: string
  summary?: string
  relationship?: string
}

export async function buildForgePrompt(
  supabase: SupabaseClient,
  campaignId: string,
  forgeType: ForgeType,
  userInput: Record<string, unknown>
): Promise<{ systemPrompt: string; userPrompt: string; context: PromptContext }> {
  // 1. Fetch campaign codex
  const codex = await fetchCampaignCodex(supabase, campaignId)

  // 2. Fetch related entities based on input
  const relatedEntities = await fetchRelatedEntities(
    supabase,
    campaignId,
    userInput
  )

  // 3. Build recent history context (optional - for session awareness)
  const recentHistory = await fetchRecentHistory(supabase, campaignId)

  const context: PromptContext = {
    codex,
    relatedEntities,
    recentHistory,
    userInput,
  }

  // 4. Build the system prompt
  const systemPrompt = buildSystemPrompt(forgeType, codex)

  // 5. Build the user prompt with context
  const userPrompt = buildUserPrompt(
    forgeType,
    userInput,
    relatedEntities,
    codex
  )

  return { systemPrompt, userPrompt, context }
}

async function fetchCampaignCodex(
  supabase: SupabaseClient,
  campaignId: string
): Promise<CampaignCodex | null> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('codex')
    .eq('id', campaignId)
    .single()

  return campaign?.codex || null
}

async function fetchRelatedEntities(
  supabase: SupabaseClient,
  campaignId: string,
  userInput: Record<string, unknown>
): Promise<RelatedEntity[]> {
  const relatedEntities: RelatedEntity[] = []

  // If location is specified, fetch it and its contents
  if (userInput.location || userInput.locationId) {
    const locationQuery = userInput.locationId
      ? supabase.from('entities').select('*').eq('id', userInput.locationId)
      : supabase
          .from('entities')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'location')
          .ilike('name', String(userInput.location))

    const { data: location } = await locationQuery.single()

    if (location) {
      const locationAttrs = location.attributes as Record<string, unknown> | null
      relatedEntities.push({
        id: location.id,
        name: location.name,
        type: 'location',
        summary:
          (locationAttrs?.description as string) ||
          (locationAttrs?.summary as string),
        relationship: 'location',
      })

      // Fetch other entities at this location
      const { data: entitiesAtLocation } = await supabase
        .from('relationships')
        .select(
          `
          source_entity:source_id(id, name, entity_type, attributes),
          target_entity:target_id(id, name, entity_type, attributes)
        `
        )
        .eq('campaign_id', campaignId)
        .or(`source_id.eq.${location.id},target_id.eq.${location.id}`)
        .limit(10)

      if (entitiesAtLocation) {
        type JoinedEntity = {
          id: string
          name: string
          entity_type: string
          attributes: Record<string, unknown> | null
        } | null

        for (const rel of entitiesAtLocation) {
          const sourceEntity = rel.source_entity as unknown as JoinedEntity
          const targetEntity = rel.target_entity as unknown as JoinedEntity

          const entity =
            sourceEntity?.id === location.id ? targetEntity : sourceEntity

          if (entity && !relatedEntities.find((e) => e.id === entity.id)) {
            relatedEntities.push({
              id: entity.id,
              name: entity.name,
              type: entity.entity_type,
              summary:
                (entity.attributes?.summary as string) ||
                (entity.attributes?.description as string)?.substring(0, 100),
              relationship: 'at_same_location',
            })
          }
        }
      }
    }
  }

  // If owner is specified, fetch them
  if (userInput.owner || userInput.ownerId) {
    const ownerQuery = userInput.ownerId
      ? supabase.from('entities').select('*').eq('id', userInput.ownerId)
      : supabase
          .from('entities')
          .select('*')
          .eq('campaign_id', campaignId)
          .ilike('name', String(userInput.owner))

    const { data: owner } = await ownerQuery.single()

    if (owner) {
      const ownerAttrs = owner.attributes as Record<string, unknown> | null
      relatedEntities.push({
        id: owner.id,
        name: owner.name,
        type: owner.entity_type,
        summary:
          (ownerAttrs?.summary as string) ||
          (ownerAttrs?.description as string)?.substring(0, 100),
        relationship: 'owner',
      })
    }
  }

  // If faction is specified, fetch it and its members
  if (userInput.faction || userInput.factionId) {
    const factionQuery = userInput.factionId
      ? supabase.from('entities').select('*').eq('id', userInput.factionId)
      : supabase
          .from('entities')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'faction')
          .ilike('name', String(userInput.faction))

    const { data: faction } = await factionQuery.single()

    if (faction) {
      const factionAttrs = faction.attributes as Record<string, unknown> | null
      relatedEntities.push({
        id: faction.id,
        name: faction.name,
        type: 'faction',
        summary: factionAttrs?.description as string,
        relationship: 'faction',
      })
    }
  }

  return relatedEntities
}

async function fetchRecentHistory(
  supabase: SupabaseClient,
  campaignId: string
): Promise<string[]> {
  // Fetch recent session notes or significant events
  const { data: recentEntities } = await supabase
    .from('entities')
    .select('name, entity_type, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!recentEntities) return []

  return recentEntities.map((e) => `Recently created ${e.entity_type}: ${e.name}`)
}

function buildSystemPrompt(
  forgeType: ForgeType,
  codex: CampaignCodex | null
): string {
  let prompt = `You are a creative assistant helping a Dungeon Master create content for their D&D campaign.
You generate rich, evocative content that fits the campaign's established world.

CRITICAL RULES:
- Use **bold** markers around key visual details and important terms
- Be consistent with the campaign's tone and themes
- Reference existing world elements when appropriate
- Create content that provides hooks for future adventures
- Include both public information and DM-only secrets
`

  if (codex) {
    prompt += `\n\nCAMPAIGN CONTEXT:`

    if (codex.setting) {
      prompt += `\nSetting: ${codex.setting}`
    }

    if (codex.themes && codex.themes.length > 0) {
      prompt += `\nThemes: ${codex.themes.join(', ')}`
    }

    if (codex.tone) {
      prompt += `\nTone: ${codex.tone}`
    }

    if (codex.naming_conventions?.notes) {
      prompt += `\nNaming Conventions: ${codex.naming_conventions.notes}`
      if (codex.naming_conventions.examples?.length) {
        prompt += ` (Examples: ${codex.naming_conventions.examples.join(', ')})`
      }
    }

    if (codex.proper_nouns && codex.proper_nouns.length > 0) {
      prompt += `\n\nESTABLISHED WORLD ELEMENTS:`
      for (const noun of codex.proper_nouns.slice(0, 10)) {
        prompt += `\n- ${noun.name}: ${noun.description}`
      }
    }

    if (codex.safety_presets && codex.safety_presets.length > 0) {
      prompt += `\n\nCONTENT GUIDELINES: Avoid or handle carefully: ${codex.safety_presets.join(', ')}`
    }
  }

  // Add forge-specific instructions
  prompt += `\n\n${getForgeSpecificInstructions(forgeType)}`

  return prompt
}

function buildUserPrompt(
  forgeType: ForgeType,
  userInput: Record<string, unknown>,
  relatedEntities: RelatedEntity[],
  _codex: CampaignCodex | null
): string {
  let prompt = `Generate a ${forgeType} with the following details:\n\n`

  // Add user input
  prompt += `USER REQUEST:\n`
  if (userInput.slug || userInput.concept || userInput.dmSlug) {
    prompt += `Concept: ${userInput.slug || userInput.concept || userInput.dmSlug}\n`
  }

  for (const [key, value] of Object.entries(userInput)) {
    if (value && !['slug', 'concept', 'dmSlug'].includes(key)) {
      prompt += `${formatKey(key)}: ${value}\n`
    }
  }

  // Add related entities context
  if (relatedEntities.length > 0) {
    prompt += `\nRELATED WORLD ELEMENTS:\n`
    for (const entity of relatedEntities) {
      prompt += `- ${entity.name} (${entity.type})`
      if (entity.relationship) {
        prompt += ` [${entity.relationship}]`
      }
      if (entity.summary) {
        prompt += `: ${entity.summary}`
      }
      prompt += `\n`
    }
  }

  // Add output format instructions
  prompt += `\n${getOutputFormatInstructions(forgeType)}`

  return prompt
}

function getForgeSpecificInstructions(forgeType: ForgeType): string {
  const instructions: Record<ForgeType, string> = {
    npc: `FOR NPC GENERATION:
- Create a memorable, three-dimensional character
- Include physical appearance with distinctive features
- Define personality, motivations, and secrets
- Provide voice/mannerism notes for roleplay
- Include plot hooks that connect to the world
- Generate appropriate loot or possessions
- Consider their relationships to other entities`,

    item: `FOR ITEM GENERATION:
- Create items with history and personality
- Include both mechanical properties and narrative flavor
- Provide a "public" description (what players see) and "secret" description (DM only)
- Consider magical auras, curses, or hidden properties
- Include provenance - who made it, who owned it
- Make items that tell stories`,

    location: `FOR LOCATION GENERATION:
- Create vivid, explorable spaces
- Include sensory details (sights, sounds, smells)
- Define notable features and points of interest
- Include NPCs who inhabit or frequent the location
- Provide hooks and secrets for adventure
- Consider the location's history and purpose`,

    monster: `FOR MONSTER GENERATION:
- Create creatures with personality, not just stats
- Define lair, habits, and motivations
- Include tactical notes for combat
- Provide hooks connecting to the world
- Consider what treasure or loot they guard`,

    faction: `FOR FACTION GENERATION:
- Define clear goals and methods
- Create leadership structure
- Include notable members
- Define relationships with other factions
- Provide hooks for player involvement`,

    quest: `FOR QUEST GENERATION:
- Create compelling stakes and motivation
- Include multiple possible approaches
- Define complications and twists
- Connect to existing world elements
- Provide clear rewards and consequences`,
  }

  return instructions[forgeType] || ''
}

function getOutputFormatInstructions(forgeType: ForgeType): string {
  const formats: Record<ForgeType, string> = {
    npc: `OUTPUT FORMAT (JSON):
{
  "name": "Character name",
  "summary": "One-line description",
  "appearance": "Physical description with **bold** key features",
  "personality": "Personality traits and demeanor",
  "motivation": "What drives this character",
  "secret": "DM-only secret information",
  "voice_notes": "How they speak, mannerisms",
  "plot_hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "loot": ["Item 1", "Item 2"],
  "relationships": ["Relationship to other entities"],
  "combat_stats": { "ac": 12, "hp": "3d8+3", "challenge": "1/2" }
}`,

    item: `OUTPUT FORMAT (JSON):
{
  "name": "Item name",
  "item_type": "weapon/armor/wondrous/etc",
  "rarity": "common/uncommon/rare/very_rare/legendary",
  "public_description": "What players see with **bold** key details",
  "secret_description": "DM-only true nature, curses, hidden powers",
  "mechanical_properties": {
    "damage": "1d8 slashing",
    "properties": ["versatile", "finesse"],
    "attunement": "required",
    "charges": 3
  },
  "magical_aura": "evocation/none/etc",
  "origin_history": "Who made it and why",
  "value_gp": 500,
  "weight": "3 lb"
}`,

    location: `OUTPUT FORMAT (JSON):
{
  "name": "Location name",
  "type": "tavern/dungeon/city/wilderness/etc",
  "summary": "One-line description",
  "description": "Full description with **bold** key features",
  "atmosphere": "Mood and sensory details",
  "notable_features": ["Feature 1", "Feature 2"],
  "npcs": ["NPC who might be here"],
  "secrets": "DM-only hidden information",
  "hooks": ["Adventure hook 1", "Hook 2"],
  "connections": ["Connected locations"]
}`,

    monster: `OUTPUT FORMAT (JSON):
{
  "name": "Creature name",
  "type": "beast/undead/fiend/etc",
  "description": "Physical description with **bold** features",
  "personality": "Behavior and motivations",
  "lair": "Where it lives",
  "tactics": "How it fights",
  "secret": "DM-only information",
  "treasure": ["What it guards"],
  "hooks": ["Plot hooks"],
  "stats": { "ac": 15, "hp": "52 (8d10+8)", "challenge": "3" }
}`,

    faction: `OUTPUT FORMAT (JSON):
{
  "name": "Faction name",
  "type": "guild/cult/government/etc",
  "summary": "One-line description",
  "description": "Full description",
  "goals": ["Goal 1", "Goal 2"],
  "methods": "How they operate",
  "leadership": "Who leads and structure",
  "notable_members": ["Member 1", "Member 2"],
  "headquarters": "Where they're based",
  "secrets": "DM-only information",
  "relationships": ["Ally/enemy relationships"],
  "hooks": ["Player involvement hooks"]
}`,

    quest: `OUTPUT FORMAT (JSON):
{
  "name": "Quest name",
  "type": "fetch/rescue/investigate/etc",
  "summary": "One-line hook",
  "description": "Full quest description",
  "stakes": "What's at risk",
  "patron": "Who gives the quest",
  "objectives": ["Objective 1", "Objective 2"],
  "complications": ["Twist 1", "Twist 2"],
  "rewards": ["Reward 1", "Reward 2"],
  "secrets": "DM-only true situation",
  "connected_entities": ["Related NPCs, locations, items"]
}`,
  }

  return formats[forgeType] || 'Return a JSON object with appropriate fields.'
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}
