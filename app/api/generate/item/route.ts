import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchEntityContext, formatEntityContextForPrompt, fetchCampaignContext } from '@/lib/forge/context-fetcher'
import { ITEM_BRAIN_PROMPT, ARTIFACT_PROMPT, CURSED_ITEM_PROMPT } from '@/lib/forge/prompts/item-prompts'

interface ItemInputs {
  name?: string
  dmSlug: string
  itemType?: 'standard' | 'artifact' | 'cursed'
  category?: string
  rarity?: string
  magicalAura?: string
  isIdentified?: boolean
  additionalRequirements?: string
  // Sentience options
  isSentient?: boolean
  sentienceLevel?: 'none' | 'dormant' | 'awakened' | 'dominant'
  // Artifact-specific
  legendaryPower?: string
  creatorLore?: string
  // Cursed-specific
  curseType?: string
  curseTrigger?: string
  curseEscape?: string
  // Context injection
  referencedEntityIds?: string[]
}

interface ItemBrain {
  origin?: string
  history?: string
  secret?: string
  trigger?: string
  hunger?: string
  cost?: string
  sentience_level?: 'none' | 'dormant' | 'awakened' | 'dominant'
}

interface ItemVoice {
  personality?: string
  style?: string[]
  desires?: string
  communication?: 'telepathic' | 'verbal' | 'empathic' | 'visions'
}

interface ItemFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

interface ItemMechanics {
  base_item?: string
  damage?: string
  damage_type?: string
  bonus?: string
  properties?: string[]
  range?: string
  ac_bonus?: number
  charges?: {
    current?: number
    max: number
    recharge?: string
  }
  abilities?: Array<{
    name: string
    description: string
    cost?: string
    duration?: string
  }>
  attunement?: boolean
  attunement_requirements?: string
  spell_save_dc?: number
  spell_attack_bonus?: number
}

interface GeneratedItem {
  name: string
  sub_type: string
  category: string
  item_type: string
  rarity: string
  magical_aura?: string
  is_identified: boolean
  // Brain/Voice/Facts architecture
  brain: ItemBrain
  voice: ItemVoice | null
  mechanics: ItemMechanics
  facts: ItemFact[]
  read_aloud: string
  dm_slug: string
  // Legacy fields for backward compatibility
  public_description: string
  secret_description: string
  description?: string
  mechanical_properties: {
    damage?: string
    ac_bonus?: number
    properties?: string[]
    attunement: string
    charges?: number
    max_charges?: number
  }
  origin_history?: string
  value_gp: number
  weight: string
  secret?: string
  properties?: string[]
  attunement?: boolean
  attunementRequirements?: string
  history: Array<{
    event: string
    entity_id: string | null
    session: string | null
    note?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, inputs } = body as { campaignId: string; inputs: ItemInputs }

    if (!campaignId || !inputs?.dmSlug) {
      return NextResponse.json(
        { error: 'Campaign ID and DM concept are required' },
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

    // Fetch context for referenced entities
    let entityContext = ''
    if (inputs.referencedEntityIds && inputs.referencedEntityIds.length > 0) {
      const contextEntities = await fetchEntityContext(inputs.referencedEntityIds)
      entityContext = formatEntityContextForPrompt(contextEntities)
    }

    // Build the prompt with proper context hierarchy
    const systemPrompt = buildSystemPrompt(inputs, campaignContext, entityContext)
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

    const generatedItem: GeneratedItem = JSON.parse(responseContent)

    // Ensure sub_type is set from inputs
    generatedItem.sub_type = inputs.itemType || 'standard'

    // Ensure is_identified matches user input
    generatedItem.is_identified = inputs.isIdentified !== false

    // Validate sentience rules - ensure non-sentient items don't have voice
    const shouldBeSentient = inputs.isSentient || inputs.curseType === 'haunted'
    if (!shouldBeSentient || generatedItem.brain?.sentience_level === 'none') {
      generatedItem.voice = null
      if (generatedItem.brain) {
        generatedItem.brain.sentience_level = 'none'
        generatedItem.brain.hunger = undefined
      }
    }

    // Ensure brain and facts exist
    if (!generatedItem.brain) {
      generatedItem.brain = { sentience_level: 'none' }
    }
    if (!generatedItem.facts) {
      generatedItem.facts = []
    }

    // Ensure mechanics exists (provide defaults if AI forgot)
    if (!generatedItem.mechanics) {
      generatedItem.mechanics = {
        base_item: generatedItem.category === 'weapon' ? 'unknown weapon' : undefined,
        properties: [],
        attunement: false
      }
    }

    // Add initial history entry
    generatedItem.history = [
      {
        event: 'forged',
        entity_id: null,
        session: null,
        note: 'Created via Item Forge'
      }
    ]

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'item',
      input_summary: `Concept: ${inputs.dmSlug}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    })

    if (genError) {
      console.error('Failed to track generation:', genError)
    }

    return NextResponse.json({
      item: generatedItem,
    })
  } catch (error) {
    console.error('Item generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate item. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  inputs: ItemInputs,
  campaignContext: string,
  entityContext: string
): string {
  let prompt = `You are an expert D&D item creator. Generate items with rich history, secrets, and purpose that fit naturally into the campaign world.

Your task is to generate a detailed item with:
- A "brain" containing origin, history, secrets, triggers, and costs
- A "voice" object ONLY if the item is sentient
- Atomic facts for the facts table
- Dual descriptions (public vs secret) for the identify mechanic

IMPORTANT GUIDELINES:
- public_description: What players see BEFORE identifying - physical appearance only. NO mechanical details.
- secret_description: True nature revealed on Identify - magical properties, hidden features.
- Use **bold** markdown for key descriptors
- value_gp should be appropriate for the rarity (common: 50-100, uncommon: 100-500, rare: 500-5000, very_rare: 5000-50000, legendary: 50000+)
`

  // Add type-specific prompt
  if (inputs.itemType === 'artifact') {
    prompt += '\n' + ARTIFACT_PROMPT
  } else if (inputs.itemType === 'cursed') {
    prompt += '\n' + CURSED_ITEM_PROMPT
  }

  // Add the main item brain prompt
  prompt += '\n' + ITEM_BRAIN_PROMPT

  // Inject campaign context first (global world rules, tone, themes)
  if (campaignContext) {
    prompt += `\n\n${campaignContext}`
  }

  // Inject entity context second (local connections from Quick Reference)
  if (entityContext) {
    prompt += `\n\n${entityContext}`
  }

  return prompt
}

function buildUserPrompt(inputs: ItemInputs): string {
  const itemType = inputs.itemType || 'standard'
  let prompt = `Create a ${itemType.toUpperCase()} item with these specifications:\n\n`

  prompt += `Concept: ${inputs.dmSlug}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an evocative name\n`
  }

  if (inputs.category && inputs.category !== 'let_ai_decide') {
    prompt += `Category: ${inputs.category}\n`
  } else {
    prompt += `Category: Choose based on the concept\n`
  }

  if (inputs.rarity && inputs.rarity !== 'let_ai_decide') {
    prompt += `Rarity: ${inputs.rarity}\n`
  } else {
    prompt += `Rarity: Choose based on the concept\n`
  }

  if (inputs.magicalAura && inputs.magicalAura !== 'let_ai_decide' && inputs.magicalAura !== 'none') {
    prompt += `Magical Aura: ${inputs.magicalAura}\n`
  } else if (inputs.magicalAura === 'none') {
    prompt += `Magical Aura: none (mundane item)\n`
  }

  // Sentience
  const shouldBeSentient = inputs.isSentient || inputs.curseType === 'haunted'
  const sentienceLevel = inputs.sentienceLevel || (shouldBeSentient ? 'awakened' : 'none')

  if (shouldBeSentient) {
    prompt += `\nSentient: YES - Sentience Level: ${sentienceLevel}\n`
    prompt += `Generate full voice object with personality, style, desires, and communication method.\n`
  } else {
    prompt += `\nSentient: NO - Set sentience_level to "none" and voice to null. Do NOT generate any personality.\n`
  }

  // Artifact-specific inputs
  if (itemType === 'artifact') {
    prompt += `\n## ARTIFACT INPUTS:\n`
    if (inputs.legendaryPower) {
      prompt += `Legendary Power: ${inputs.legendaryPower}\n`
    } else {
      prompt += `Legendary Power: Let AI decide based on concept\n`
    }
    if (inputs.creatorLore) {
      prompt += `Creator/Origin: ${inputs.creatorLore}\n`
    }
  }

  // Cursed-specific inputs
  if (itemType === 'cursed') {
    prompt += `\n## CURSED ITEM INPUTS:\n`
    if (inputs.curseType) {
      prompt += `Curse Type: ${inputs.curseType}\n`
    } else {
      prompt += `Curse Type: Let AI decide\n`
    }
    if (inputs.curseTrigger) {
      prompt += `Curse Trigger: ${inputs.curseTrigger}\n`
    }
    if (inputs.curseEscape) {
      prompt += `Escape Method: ${inputs.curseEscape}\n`
    } else {
      prompt += `Escape Method: Let AI decide - but there should be one\n`
    }
  }

  if (inputs.additionalRequirements) {
    prompt += `\nAdditional requirements: ${inputs.additionalRequirements}\n`
  }

  prompt += `\nReturn ONLY valid JSON matching the output structure. No markdown, no explanation.`

  return prompt
}
