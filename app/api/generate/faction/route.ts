import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchEntityContext, formatEntityContextForPrompt, fetchCampaignContext } from '@/lib/forge/context-fetcher'
import { FACTION_BRAIN_PROMPT, FACTION_TYPE_PROMPTS } from '@/lib/forge/prompts/faction-prompts'

interface FactionInputs {
  name?: string
  concept: string
  factionType: 'guild' | 'military' | 'religious' | 'criminal' | 'political' | 'merchant' | 'cult' | 'noble_house' | 'secret_society'
  influence?: string
  wealth?: string
  referencedEntityIds?: string[]
}

interface FactionBrain {
  purpose?: string
  goals?: string
  current_agenda?: string
  methods?: string
  secret?: string
  weakness?: string
  hierarchy?: string
  key_members?: string[]
}

interface FactionSoul {
  motto?: string
  symbol?: string
  reputation?: string
  colors?: string[]
  culture?: string
  greeting?: string
}

interface FactionMechanics {
  influence?: string
  wealth?: string
  military?: string
  reach?: string
  stability?: string
  territory?: string[]
  resources?: string[]
  benefits?: string[]
  requirements?: string
}

interface FactionFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

interface GeneratedFaction {
  name: string
  sub_type: string
  brain: FactionBrain
  soul: FactionSoul
  mechanics: FactionMechanics
  facts: FactionFact[]
  read_aloud: string
  dm_slug: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, inputs } = body as { campaignId: string; inputs: FactionInputs }

    if (!campaignId || !inputs?.factionType) {
      return NextResponse.json(
        { error: 'Campaign ID and faction type are required' },
        { status: 400 }
      )
    }

    // Default concept if not provided
    const effectiveConcept = inputs.concept?.trim() || `A ${inputs.factionType} faction`

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

    // Fetch context for referenced entities
    let entityContext = ''
    if (inputs.referencedEntityIds && inputs.referencedEntityIds.length > 0) {
      const contextEntities = await fetchEntityContext(inputs.referencedEntityIds)
      entityContext = formatEntityContextForPrompt(contextEntities)
    }

    // Build the prompt
    const systemPrompt = buildSystemPrompt(inputs.factionType, campaignContext, entityContext)
    const userPrompt = buildUserPrompt(inputs, effectiveConcept)

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2500,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const generatedFaction: GeneratedFaction = JSON.parse(responseContent)

    // Ensure sub_type is set from inputs
    generatedFaction.sub_type = inputs.factionType

    // Ensure required objects exist
    if (!generatedFaction.brain) {
      generatedFaction.brain = {}
    }
    if (!generatedFaction.soul) {
      generatedFaction.soul = {}
    }
    if (!generatedFaction.mechanics) {
      generatedFaction.mechanics = {}
    }
    if (!generatedFaction.facts) {
      generatedFaction.facts = []
    }

    // Override influence/wealth if specified in inputs
    if (inputs.influence) {
      generatedFaction.mechanics.influence = inputs.influence
    }
    if (inputs.wealth) {
      generatedFaction.mechanics.wealth = inputs.wealth
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'faction',
      input_summary: `Type: ${inputs.factionType}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      faction: generatedFaction,
    })
  } catch (error) {
    console.error('Faction generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate faction. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  factionType: string,
  campaignContext: string,
  entityContext: string
): string {
  let prompt = FACTION_BRAIN_PROMPT

  // Add type-specific prompt
  const typePrompt = FACTION_TYPE_PROMPTS[factionType]
  if (typePrompt) {
    prompt += `\n\n## TYPE-SPECIFIC GUIDELINES\n${typePrompt}`
  }

  // Inject campaign context (global world rules, tone, themes)
  if (campaignContext) {
    prompt += `\n\n${campaignContext}`
  }

  // Inject entity context (local connections from Quick Reference)
  if (entityContext) {
    prompt += `\n\n${entityContext}`
  }

  return prompt
}

function buildUserPrompt(inputs: FactionInputs, concept: string): string {
  let prompt = `Create a ${inputs.factionType.toUpperCase()} faction with these specifications:\n\n`

  prompt += `Concept: ${concept}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an evocative name\n`
  }

  if (inputs.influence) {
    prompt += `Influence Level: ${inputs.influence}\n`
  }

  if (inputs.wealth) {
    prompt += `Wealth Level: ${inputs.wealth}\n`
  }

  prompt += `\nReturn ONLY valid JSON matching the output structure. No markdown, no explanation.`

  return prompt
}
