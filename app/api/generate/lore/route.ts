import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchCampaignContext } from '@/lib/forge/context-fetcher'
import { buildLoreSystemPrompt, buildLoreUserPrompt, EVENT_TYPE_PROMPTS } from '@/lib/forge/prompts/lore-prompts'
import { EventSubType, GeneratedLore } from '@/types/event'
import { v4 as uuidv4 } from 'uuid'

interface LoreInputs {
  campaignId: string
  subType: EventSubType
  concept: string
  dateDisplay: string
  eventSort: number
  era?: string
  linkedEntities?: {
    locations?: string[]
    npcs?: string[]
    factions?: string[]
    events?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as LoreInputs
    const {
      campaignId,
      subType,
      concept,
      dateDisplay,
      eventSort,
      era,
      linkedEntities,
    } = body

    if (!campaignId || !subType || !concept || !dateDisplay) {
      return NextResponse.json(
        { error: 'Campaign ID, event type, concept, and date are required' },
        { status: 400 }
      )
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch campaign context (codex) for world consistency
    const campaignContext = await fetchCampaignContext(campaignId)

    // Build codex context string for the prompt
    let codexContext = campaignContext || 'No campaign context available.'

    // Add event type-specific guidance
    const typeGuidance = EVENT_TYPE_PROMPTS[subType]

    // Build the prompts
    const systemPrompt = buildLoreSystemPrompt() + (typeGuidance ? `\n\n## EVENT TYPE GUIDANCE\n${typeGuidance}` : '')
    const userPrompt = buildLoreUserPrompt({
      subType,
      concept,
      dateDisplay,
      era,
      linkedEntities,
      codexContext,
    })

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const generated = JSON.parse(responseContent)

    // Add IDs to lore drops
    if (generated.mechanics?.lore_drops) {
      generated.mechanics.lore_drops = generated.mechanics.lore_drops.map((drop: Record<string, unknown>) => ({
        ...drop,
        id: uuidv4(),
        used: false,
      }))
    }

    // Process discoveries - ensure they have IDs and proper structure
    let processedDiscoveries: Array<{
      id: string
      name: string
      entity_type: string
      brief: string
      connection: string
      status: string
    }> = []

    if (Array.isArray(generated.discoveries)) {
      // New format: array of discovery objects
      processedDiscoveries = generated.discoveries.map((disc: Record<string, unknown>) => ({
        id: uuidv4(),
        name: String(disc.name || 'Unknown'),
        entity_type: String(disc.entity_type || 'npc'),
        brief: String(disc.brief || ''),
        connection: String(disc.connection || ''),
        status: 'pending',
      }))
    } else if (generated.discoveries && typeof generated.discoveries === 'object') {
      // Legacy format: object with arrays of strings by type
      const legacyDiscoveries = generated.discoveries as Record<string, string[]>
      const typeMapping: Record<string, string> = {
        npcs: 'npc',
        locations: 'location',
        items: 'item',
        events: 'event',
        factions: 'faction',
        creatures: 'creature',
        quests: 'quest',
      }

      for (const [key, values] of Object.entries(legacyDiscoveries)) {
        if (Array.isArray(values)) {
          const entityType = typeMapping[key] || 'npc'
          for (const name of values) {
            if (name && typeof name === 'string') {
              processedDiscoveries.push({
                id: uuidv4(),
                name,
                entity_type: entityType,
                brief: `Discovered from ${generated.name || 'this event'}`,
                connection: `Related to the ${subType.replace('_', ' ')}`,
                status: 'pending',
              })
            }
          }
        }
      }
    }

    // Construct the final response
    const loreData: GeneratedLore = {
      name: generated.name,
      sub_type: subType,
      event_sort: eventSort,
      event_era: era || null,
      event_ongoing: subType === 'prophecy' || subType === 'war' || subType === 'rumor',
      soul: generated.soul || {},
      brain: generated.brain || {},
      mechanics: {
        date_display: dateDisplay,
        duration: generated.mechanics?.duration,
        affected_regions: generated.mechanics?.affected_regions || [],
        current_evidence: generated.mechanics?.current_evidence || '',
        lore_drops: generated.mechanics?.lore_drops || [],
      },
      discoveries: processedDiscoveries,
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'lore',
      input_summary: `Type: ${subType}, When: ${dateDisplay}${era ? `, Era: ${era}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      success: true,
      data: loreData,
    })
  } catch (error) {
    console.error('Lore generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate lore. Please try again.' },
      { status: 500 }
    )
  }
}
