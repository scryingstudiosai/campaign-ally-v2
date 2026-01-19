import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchCampaignContext } from '@/lib/forge/context-fetcher'
import { deitySystemPrompt, buildDeityUserPrompt } from '@/lib/forge/prompts/deity-prompts'
import { DeityRank, DeityGeneration } from '@/types/deity'
import { v4 as uuidv4 } from 'uuid'

interface DeityInputs {
  campaignId: string
  rank: DeityRank
  domains: string[]
  alignment?: string
  concept?: string
  pantheon?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as DeityInputs
    const {
      campaignId,
      rank,
      domains,
      alignment,
      concept,
      pantheon,
    } = body

    if (!campaignId || !rank || !domains || domains.length === 0) {
      return NextResponse.json(
        { error: 'Campaign ID, deity rank, and at least one domain are required' },
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
    let campaignContext = await fetchCampaignContext(campaignId) || ''

    // Get existing deities for consistency
    const { data: existingDeities } = await supabase
      .from('entities')
      .select('name, soul')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'deity')
      .is('deleted_at', null)
      .limit(10)

    if (existingDeities && existingDeities.length > 0) {
      const deityList = existingDeities.map(d => {
        const soul = d.soul as Record<string, unknown> | null
        const domains = (soul?.portfolio as Record<string, unknown>)?.domains as string[] | undefined
        return `${d.name}${domains ? ` (${domains.join(', ')})` : ''}`
      }).join(', ')
      campaignContext += `\n\nExisting deities in this world: ${deityList}`
    }

    // Build the prompts
    const systemPrompt = deitySystemPrompt
    const userPrompt = buildDeityUserPrompt({
      rank,
      domains,
      alignment,
      concept,
      pantheon,
      campaignContext: campaignContext || undefined,
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
      max_tokens: 4000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const generated = JSON.parse(responseContent)

    // Process discoveries - ensure they have IDs and proper structure
    let processedDiscoveries: DeityGeneration['discoveries'] = []

    if (Array.isArray(generated.discoveries)) {
      processedDiscoveries = generated.discoveries.map((disc: Record<string, unknown>) => ({
        id: uuidv4(),
        name: String(disc.name || 'Unknown'),
        entity_type: String(disc.entity_type || 'faction') as DeityGeneration['discoveries'][0]['entity_type'],
        brief: String(disc.brief || ''),
        connection: String(disc.connection || ''),
        status: 'pending' as const,
      }))
    }

    // Construct the final response
    const deityData: DeityGeneration = {
      name: generated.name || 'Unnamed Deity',
      rank: rank,
      soul: {
        titles: generated.soul?.titles || [],
        portfolio: {
          domains: domains,
          alignment: generated.soul?.portfolio?.alignment || alignment || 'True Neutral',
          symbol: generated.soul?.portfolio?.symbol || '',
          favored_weapon: generated.soul?.portfolio?.favored_weapon,
          holy_day: generated.soul?.portfolio?.holy_day,
          sacred_colors: generated.soul?.portfolio?.sacred_colors || [],
          sacred_animal: generated.soul?.portfolio?.sacred_animal,
        },
        manifestation: generated.soul?.manifestation || '',
        personality: generated.soul?.personality || '',
        voice: generated.soul?.voice || '',
        tenets: generated.soul?.tenets || [],
        prayers: {
          invocation: generated.soul?.prayers?.invocation || '',
          blessing: generated.soul?.prayers?.blessing || '',
          oath: generated.soul?.prayers?.oath || '',
        },
        worship: {
          followers: generated.soul?.worship?.followers || '',
          clergy_title: generated.soul?.worship?.clergy_title || 'Priest',
          temple_style: generated.soul?.worship?.temple_style || '',
          rituals: generated.soul?.worship?.rituals || [],
          offerings: generated.soul?.worship?.offerings || [],
          taboos: generated.soul?.worship?.taboos || [],
        },
      },
      brain: {
        true_nature: generated.brain?.true_nature || '',
        divine_agenda: generated.brain?.divine_agenda || '',
        secrets: generated.brain?.secrets || '',
        divine_signals: {
          distance: generated.brain?.divine_signals?.distance || 'symbolic',
          omens: {
            watching: generated.brain?.divine_signals?.omens?.watching || [],
            pleased: generated.brain?.divine_signals?.omens?.pleased || [],
            angry: generated.brain?.divine_signals?.omens?.angry || [],
          },
          boons: generated.brain?.divine_signals?.boons || [],
          curses: generated.brain?.divine_signals?.curses || [],
        },
        conflicts: generated.brain?.conflicts || '',
        weaknesses: generated.brain?.weaknesses || '',
        hooks: generated.brain?.hooks || [],
      },
      mechanics: {
        cleric_domains: generated.mechanics?.cleric_domains || domains,
        channel_divinity: generated.mechanics?.channel_divinity,
        sacred_spells: generated.mechanics?.sacred_spells || [],
        suggested_classes: generated.mechanics?.suggested_classes || ['Cleric'],
      },
      discoveries: processedDiscoveries,
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'deity',
      input_summary: `Rank: ${rank}, Domains: ${domains.join(', ')}${concept ? `, Concept: ${concept}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      success: true,
      data: deityData,
    })
  } catch (error) {
    console.error('Deity generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate deity. Please try again.' },
      { status: 500 }
    )
  }
}
