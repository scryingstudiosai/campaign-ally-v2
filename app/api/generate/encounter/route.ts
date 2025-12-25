import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchEntityContext, formatEntityContextForPrompt, fetchCampaignContext } from '@/lib/forge/context-fetcher'
import { ENCOUNTER_BRAIN_PROMPT, ENCOUNTER_TYPE_PROMPTS, ENCOUNTER_LOCATION_CONTEXT } from '@/lib/forge/prompts/encounter-prompts'
import type { EncounterSubType } from '@/types/living-entity'

interface EncounterInputs {
  name?: string
  concept: string
  encounterType: EncounterSubType
  locationId?: string
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly'
  partySize?: number
  partyLevel?: string
  referencedEntityIds?: string[]
}

interface EncounterCreature {
  name: string
  count: number
  role?: string
  notes?: string
}

interface EncounterPhase {
  trigger: string
  description: string
}

interface EncounterRewardItem {
  name: string
  type?: string
}

interface EncounterBrain {
  purpose?: string
  objective?: string
  tactics?: string
  trigger?: string
  secret?: string
  scaling?: string
  failure_consequence?: string
  resolution?: string
}

interface EncounterSoul {
  read_aloud?: string
  sights?: string[]
  sounds?: string[]
  tension?: string
  environmental_features?: string[]
}

interface EncounterMechanics {
  difficulty?: string
  party_size?: number
  party_level?: string
  creatures?: EncounterCreature[]
  terrain?: string[]
  hazards?: string[]
  duration?: string
  phases?: EncounterPhase[]
}

interface EncounterRewards {
  xp?: number
  gold?: number
  items?: EncounterRewardItem[]
  story?: string
}

interface EncounterFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

interface GeneratedEncounter {
  name: string
  sub_type: string
  brain: EncounterBrain
  soul: EncounterSoul
  mechanics: EncounterMechanics
  rewards: EncounterRewards
  facts: EncounterFact[]
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
    const { campaignId, inputs } = body as { campaignId: string; inputs: EncounterInputs }

    if (!campaignId || !inputs?.encounterType) {
      return NextResponse.json(
        { error: 'Campaign ID and encounter type are required' },
        { status: 400 }
      )
    }

    // Default concept if not provided
    const effectiveConcept = inputs.concept?.trim() || `A ${inputs.encounterType} encounter`

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

    // Fetch location context if provided
    let locationContext = ''
    if (inputs.locationId) {
      const { data: location } = await supabase
        .from('entities')
        .select('name, summary, read_aloud, dm_slug, brain, soul')
        .eq('id', inputs.locationId)
        .single()

      if (location) {
        const locationDescription = location.dm_slug || location.summary || location.read_aloud || ''
        locationContext = ENCOUNTER_LOCATION_CONTEXT
          .replace('{location_name}', location.name)
          .replace('{location_description}', locationDescription)
      }
    }

    // Fetch context for referenced entities
    let entityContext = ''
    if (inputs.referencedEntityIds && inputs.referencedEntityIds.length > 0) {
      const contextEntities = await fetchEntityContext(inputs.referencedEntityIds)
      entityContext = formatEntityContextForPrompt(contextEntities)
    }

    // Build the prompt
    const systemPrompt = buildSystemPrompt(inputs.encounterType, campaignContext, entityContext, locationContext)
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
      max_tokens: 3000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const generatedEncounter: GeneratedEncounter = JSON.parse(responseContent)

    // Ensure sub_type is set from inputs
    generatedEncounter.sub_type = inputs.encounterType

    // Ensure required objects exist
    if (!generatedEncounter.brain) {
      generatedEncounter.brain = {}
    }
    if (!generatedEncounter.soul) {
      generatedEncounter.soul = {}
    }
    if (!generatedEncounter.mechanics) {
      generatedEncounter.mechanics = {}
    }
    if (!generatedEncounter.rewards) {
      generatedEncounter.rewards = {}
    }
    if (!generatedEncounter.facts) {
      generatedEncounter.facts = []
    }

    // Override mechanics if specified in inputs
    if (inputs.difficulty) {
      generatedEncounter.mechanics.difficulty = inputs.difficulty
    }
    if (inputs.partySize) {
      generatedEncounter.mechanics.party_size = inputs.partySize
    }
    if (inputs.partyLevel) {
      generatedEncounter.mechanics.party_level = inputs.partyLevel
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'encounter',
      input_summary: `Type: ${inputs.encounterType}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      encounter: generatedEncounter,
    })
  } catch (error) {
    console.error('Encounter generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate encounter. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  encounterType: string,
  campaignContext: string,
  entityContext: string,
  locationContext: string
): string {
  let prompt = ENCOUNTER_BRAIN_PROMPT

  // Add type-specific prompt
  const typePrompt = ENCOUNTER_TYPE_PROMPTS[encounterType]
  if (typePrompt) {
    prompt += `\n\n## TYPE-SPECIFIC GUIDELINES\n${typePrompt}`
  }

  // Inject location context (terrain and atmosphere adaptation)
  if (locationContext) {
    prompt += `\n\n${locationContext}`
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

function buildUserPrompt(inputs: EncounterInputs, concept: string): string {
  let prompt = `Create a ${inputs.encounterType.toUpperCase().replace('_', ' ')} encounter with these specifications:\n\n`

  prompt += `Concept: ${concept}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an evocative name\n`
  }

  if (inputs.difficulty) {
    prompt += `Difficulty: ${inputs.difficulty}\n`
  }

  if (inputs.partySize) {
    prompt += `Party Size: ${inputs.partySize} players\n`
  }

  if (inputs.partyLevel) {
    prompt += `Party Level: ${inputs.partyLevel}\n`
  }

  prompt += `\nReturn ONLY valid JSON matching the output structure. No markdown, no explanation.`

  return prompt
}
