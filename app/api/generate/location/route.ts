import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchEntityContext, formatEntityContextForPrompt, fetchCampaignContext } from '@/lib/forge/context-fetcher'
import {
  LOCATION_BRAIN_PROMPT,
  REGION_PROMPT,
  SETTLEMENT_PROMPT,
  DISTRICT_PROMPT,
  BUILDING_PROMPT,
  ROOM_PROMPT,
  LANDMARK_PROMPT,
  DUNGEON_PROMPT,
  TAVERN_INN_PROMPT
} from '@/lib/forge/prompts/location-prompts'
import { isLikelyShop, inferShopType, getSrdItemsForShopType } from '@/lib/srd/item-lookup'

interface LocationInputs {
  name?: string
  concept: string
  locationType: 'region' | 'settlement' | 'district' | 'building' | 'room' | 'landmark' | 'dungeon'
  dangerLevel?: 'safe' | 'low' | 'moderate' | 'high' | 'deadly'
  atmosphere?: string
  parentLocationId?: string
  referencedEntityIds?: string[]
}

interface LocationBrain {
  purpose?: string
  atmosphere?: string
  danger_level?: 'safe' | 'low' | 'moderate' | 'high' | 'deadly'
  secret?: string
  history?: string
  current_state?: string
  conflict?: string
  opportunity?: string
  contains?: string[]
}

interface LocationSoul {
  sights?: string[]
  sounds?: string[]
  smells?: string[]
  textures?: string[]
  temperature?: string
  lighting?: string
  distinctive_feature?: string
  mood?: string
}

interface LocationMechanics {
  size?: string
  terrain?: string[]
  hazards?: Array<{
    name: string
    description: string
    dc?: number
    damage?: string
    effect?: string
  }>
  resources?: string[]
  travel_time?: {
    from?: string
    duration?: string
    method?: string
  }
  encounters?: Array<{
    name: string
    likelihood: 'common' | 'uncommon' | 'rare'
    cr_range?: string
  }>
  resting?: {
    safe_rest?: boolean
    long_rest_available?: boolean
    cost?: string
  }
  // Shop-related properties
  is_shop?: boolean
  shop_type?: string
  price_modifier?: number
  suggested_stock?: string[]
  // Tavern/Inn-related properties
  is_tavern?: boolean
  establishment_quality?: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'aristocratic'
  lodging?: {
    available: boolean
    rooms: Array<{
      type: string
      price_per_night: number
      description: string
    }>
  }
  menu?: {
    drinks: Array<{
      name: string
      price: number
      description: string
    }>
    meals: Array<{
      name: string
      price: number
      description: string
    }>
    specialty?: {
      name: string
      price: number
      description: string
    }
  }
}

interface LocationFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

interface GeneratedLocation {
  name: string
  sub_type: string
  brain: LocationBrain
  soul: LocationSoul
  mechanics: LocationMechanics
  facts: LocationFact[]
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
    const { campaignId, inputs } = body as { campaignId: string; inputs: LocationInputs }

    if (!campaignId || !inputs?.locationType) {
      return NextResponse.json(
        { error: 'Campaign ID and location type are required' },
        { status: 400 }
      )
    }

    // Default concept if not provided
    const effectiveConcept = inputs.concept?.trim() || `A ${inputs.locationType} location`
    // Update inputs with effective concept for prompt building
    inputs.concept = effectiveConcept

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

    // Fetch parent location context if specified
    let parentContext = ''
    if (inputs.parentLocationId) {
      const { data: parent } = await supabase
        .from('entities')
        .select('name, summary, brain, soul')
        .eq('id', inputs.parentLocationId)
        .single()

      if (parent) {
        const parentBrain = parent.brain as LocationBrain | null
        parentContext = `
## PARENT LOCATION
This location exists WITHIN: ${parent.name}
Parent Description: ${parent.summary || 'No description'}
${parentBrain?.atmosphere ? `Parent Atmosphere: ${parentBrain.atmosphere}` : ''}
${parentBrain?.danger_level ? `Parent Danger Level: ${parentBrain.danger_level}` : ''}

Ensure this location fits within and complements its parent location.
`
      }
    }

    // Build the prompt with proper context hierarchy
    const systemPrompt = buildSystemPrompt(inputs, campaignContext, entityContext, parentContext)
    const userPrompt = buildUserPrompt(inputs)

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

    const generatedLocation: GeneratedLocation = JSON.parse(responseContent)

    // Ensure sub_type is set from inputs
    generatedLocation.sub_type = inputs.locationType

    // Ensure brain exists with danger_level
    if (!generatedLocation.brain) {
      generatedLocation.brain = { danger_level: 'moderate' }
    }

    // Override danger_level if specified in inputs
    if (inputs.dangerLevel) {
      generatedLocation.brain.danger_level = inputs.dangerLevel
    }

    // Override atmosphere if specified in inputs
    if (inputs.atmosphere) {
      generatedLocation.brain.atmosphere = inputs.atmosphere
    }

    // Ensure soul exists
    if (!generatedLocation.soul) {
      generatedLocation.soul = {}
    }

    // Ensure mechanics exists
    if (!generatedLocation.mechanics) {
      generatedLocation.mechanics = {}
    }

    // Detect if this is a shop location and add shop metadata
    const locationForShopCheck = {
      name: generatedLocation.name,
      sub_type: generatedLocation.sub_type,
    }

    if (isLikelyShop(locationForShopCheck)) {
      const shopType = inferShopType(locationForShopCheck)
      const suggestedStock = getSrdItemsForShopType(shopType)

      // Add shop properties to mechanics
      generatedLocation.mechanics = {
        ...generatedLocation.mechanics,
        is_shop: true,
        shop_type: shopType,
        price_modifier: 1.0, // Default standard pricing
        suggested_stock: suggestedStock,
      }
    }

    // Ensure facts exists
    if (!generatedLocation.facts) {
      generatedLocation.facts = []
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'location',
      input_summary: `Concept: ${inputs.concept}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      location: generatedLocation,
    })
  } catch (error) {
    console.error('Location generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate location. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  inputs: LocationInputs,
  campaignContext: string,
  entityContext: string,
  parentContext: string
): string {
  let prompt = `You are an expert D&D location creator. Generate locations with rich atmosphere, sensory details, secrets, and game-relevant mechanics that fit naturally into the campaign world.

Your task is to generate a detailed location with:
- A "brain" containing purpose, atmosphere, secrets, conflict, and opportunity
- A "soul" with sensory details that make the location memorable
- "mechanics" with hazards, encounters, and resting options
- Atomic facts for the facts table
- An evocative read_aloud description

IMPORTANT GUIDELINES:
- read_aloud: 40-60 words focused on SENSES. What players see, hear, smell when they arrive.
- dm_slug: One-line DM reference for quick recall.
- distinctive_feature: The ONE memorable thing about this place.
- Use **bold** markdown for key descriptors in descriptions.
`

  // Add the main location brain prompt
  prompt += '\n' + LOCATION_BRAIN_PROMPT

  // Add type-specific prompt
  switch (inputs.locationType) {
    case 'region':
      prompt += '\n' + REGION_PROMPT
      break
    case 'settlement':
      prompt += '\n' + SETTLEMENT_PROMPT
      break
    case 'district':
      prompt += '\n' + DISTRICT_PROMPT
      break
    case 'building':
      prompt += '\n' + BUILDING_PROMPT
      break
    case 'room':
      prompt += '\n' + ROOM_PROMPT
      break
    case 'landmark':
      prompt += '\n' + LANDMARK_PROMPT
      break
    case 'dungeon':
      prompt += '\n' + DUNGEON_PROMPT
      break
  }

  // Add tavern/inn specific prompt if the concept suggests it
  const conceptLower = (inputs.concept || '').toLowerCase()
  const nameLower = (inputs.name || '').toLowerCase()
  const isTavernConcept = /tavern|inn|pub|ale\s*house|drinking|bar|taproom/.test(conceptLower) ||
    /tavern|inn|pub|ale\s*house/.test(nameLower)

  if (isTavernConcept && (inputs.locationType === 'building' || inputs.locationType === 'room')) {
    prompt += '\n' + TAVERN_INN_PROMPT
  }

  // Inject parent location context (hierarchy)
  if (parentContext) {
    prompt += `\n${parentContext}`
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

function buildUserPrompt(inputs: LocationInputs): string {
  const locationType = inputs.locationType || 'building'
  let prompt = `Create a ${locationType.toUpperCase()} location with these specifications:\n\n`

  prompt += `Concept: ${inputs.concept}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an evocative name\n`
  }

  if (inputs.atmosphere) {
    prompt += `Atmosphere: ${inputs.atmosphere}\n`
  } else {
    prompt += `Atmosphere: Choose based on the concept\n`
  }

  if (inputs.dangerLevel) {
    prompt += `Danger Level: ${inputs.dangerLevel}\n`
  } else {
    prompt += `Danger Level: Choose based on the concept and location type\n`
  }

  // Type-specific hints
  if (locationType === 'dungeon') {
    prompt += `\nThis is a DUNGEON/ADVENTURE SITE. Include multiple hazards and encounters. Make it feel dangerous.\n`
  } else if (locationType === 'settlement') {
    prompt += `\nThis is a SETTLEMENT. Include 3-5 notable sub-locations in the "contains" field.\n`
  } else if (locationType === 'region') {
    prompt += `\nThis is a REGION. Include 3-5 notable settlements or landmarks in the "contains" field.\n`
  }

  prompt += `\nReturn ONLY valid JSON matching the output structure. No markdown, no explanation.`

  return prompt
}
