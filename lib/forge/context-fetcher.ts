import { createClient } from '@/lib/supabase/server'

export interface EntityContext {
  id: string
  name: string
  entity_type: string
  sub_type: string | null
  summary: string | null
  dm_slug: string | null
  brain: Record<string, unknown> | null
  facts: {
    content: string
    category: string
    visibility: string
  }[]
  relationships: {
    type: string
    target_name: string
    surface_description: string | null
  }[]
}

interface FactRecord {
  entity_id: string
  content: string
  category: string
  visibility: string
}

interface RelationshipRecord {
  source_id: string
  relationship_type: string
  surface_description: string | null
  target: { name: string } | null
}

interface Codex {
  world_name?: string
  premise?: string
  tone?: string | string[]
  themes?: string | string[]
  magic_level?: string
  tech_level?: string
  pillars?: string[]
  narrative_voice?: string
  languages?: string[]
  proper_nouns?: string[]
  content_warnings?: string[]
  open_questions?: string[]
}

/**
 * Fetch campaign codex and format it as context for AI generation.
 * This ensures generated NPCs align with the campaign's global tone, themes, and setting.
 */
export async function fetchCampaignContext(campaignId: string): Promise<string> {
  const supabase = await createClient()

  const { data: codex, error } = await supabase
    .from('codex')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  if (error || !codex) return ''

  const c = codex as Codex

  // Format tone (could be string or array)
  const toneStr = Array.isArray(c.tone) ? c.tone.join(', ') : c.tone || ''
  const themesStr = Array.isArray(c.themes) ? c.themes.join(', ') : c.themes || ''
  const pillarsStr = Array.isArray(c.pillars) ? c.pillars.join(', ') : ''

  const contextParts: string[] = []

  if (c.world_name) contextParts.push(`World: ${c.world_name}`)
  if (c.premise) contextParts.push(`Campaign Premise: ${c.premise}`)
  if (toneStr) contextParts.push(`Tone: ${toneStr}`)
  if (themesStr) contextParts.push(`Themes: ${themesStr}`)
  if (pillarsStr) contextParts.push(`Campaign Pillars: ${pillarsStr}`)
  if (c.magic_level) contextParts.push(`Magic Level: ${c.magic_level}`)
  if (c.tech_level) contextParts.push(`Technology Level: ${c.tech_level}`)
  if (c.narrative_voice) contextParts.push(`Narrative Voice: ${c.narrative_voice}`)
  if (c.proper_nouns?.length) contextParts.push(`Established Names (use when relevant): ${c.proper_nouns.join(', ')}`)
  if (c.content_warnings?.length) contextParts.push(`CONTENT TO AVOID: ${c.content_warnings.join(', ')}`)
  if (c.open_questions?.length) contextParts.push(`OPEN QUESTIONS (do not commit to answers): ${c.open_questions.join('; ')}`)

  if (contextParts.length === 0) return ''

  return `
## CAMPAIGN SETTING & TONE
The following global settings apply to this campaign. Ensure the generated character fits this world naturally.

${contextParts.join('\n')}

## END CAMPAIGN CONTEXT
`.trim()
}

export async function fetchEntityContext(entityIds: string[]): Promise<EntityContext[]> {
  if (!entityIds.length) return []

  const supabase = await createClient()

  // Fetch entities with their brains
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('id, name, entity_type, sub_type, summary, dm_slug, brain')
    .in('id', entityIds)

  if (entitiesError || !entities) {
    console.error('Error fetching entity context:', entitiesError)
    return []
  }

  // Fetch facts for these entities
  const { data: facts } = await supabase
    .from('facts')
    .select('entity_id, content, category, visibility')
    .in('entity_id', entityIds)
    .eq('is_current', true)

  // Fetch relationships
  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      source_id,
      relationship_type,
      surface_description,
      target:entities!relationships_target_id_fkey(name)
    `)
    .in('source_id', entityIds)
    .eq('is_active', true)

  // Combine the data
  return entities.map((entity) => ({
    id: entity.id,
    name: entity.name,
    entity_type: entity.entity_type,
    sub_type: entity.sub_type,
    summary: entity.summary,
    dm_slug: entity.dm_slug,
    brain: entity.brain as Record<string, unknown> | null,
    facts: ((facts as FactRecord[] | null) || [])
      .filter((f) => f.entity_id === entity.id)
      .map((f) => ({ content: f.content, category: f.category, visibility: f.visibility })),
    relationships: ((relationships as RelationshipRecord[] | null) || [])
      .filter((r) => r.source_id === entity.id)
      .map((r) => ({
        type: r.relationship_type,
        target_name: r.target?.name || 'Unknown',
        surface_description: r.surface_description,
      })),
  }))
}

export function formatEntityContextForPrompt(entities: EntityContext[]): string {
  if (!entities.length) return ''

  const contextBlocks = entities.map((entity) => {
    const brain = entity.brain || {}
    const brainStr = Object.entries(brain)
      .filter(([, v]) => v)
      .map(([k, v]) => `  - ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n')

    const factsStr = entity.facts
      .slice(0, 5) // Limit to avoid token bloat
      .map((f) => `  - [${f.category}] ${f.content}`)
      .join('\n')

    const relStr = entity.relationships
      .slice(0, 3)
      .map(
        (r) =>
          `  - ${r.type}: ${r.target_name}${r.surface_description ? ` (${r.surface_description})` : ''}`
      )
      .join('\n')

    return `
=== REFERENCED ENTITY: ${entity.name} ===
Type: ${entity.entity_type}${entity.sub_type ? ` (${entity.sub_type})` : ''}
Summary: ${entity.dm_slug || entity.summary || 'No summary'}
${brainStr ? `Psychology:\n${brainStr}` : ''}
${factsStr ? `Key Facts:\n${factsStr}` : ''}
${relStr ? `Relationships:\n${relStr}` : ''}
`.trim()
  })

  return `
## REFERENCED ENTITIES (Use this context to maintain world consistency)

The user has referenced the following existing entities. Ensure the generated NPC fits logically with these characters and their situations.

${contextBlocks.join('\n\n')}

## END REFERENCED ENTITIES
`
}
