import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'

interface ItemInputs {
  name?: string
  dmSlug: string
  itemType?: string
  rarity?: string
  magicalAura?: string
  isIdentified?: boolean
  additionalRequirements?: string
}

interface GeneratedItem {
  name: string
  item_type: string
  rarity: string
  magical_aura: string
  is_identified: boolean
  public_description: string
  secret_description: string
  mechanical_properties: {
    damage?: string
    ac_bonus?: number
    properties?: string[]
    attunement: string
    charges?: number
    max_charges?: number
  }
  origin_history: string
  value_gp: number
  weight: string
  secret: string
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

    // Fetch codex for context
    const { data: codex } = await supabase
      .from('codex')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    // Check generation limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, generations_used, generations_reset_at')
      .eq('id', user.id)
      .single()

    const GENERATION_LIMITS: Record<string, number> = {
      free: 50,
      pro: 500,
      legendary: 9999,
    }

    const tier = profile?.subscription_tier || 'free'
    const limit = GENERATION_LIMITS[tier] || 50
    const used = profile?.generations_used || 0

    // Check if we need to reset the counter (monthly reset)
    const resetAt = profile?.generations_reset_at ? new Date(profile.generations_reset_at) : new Date()
    const now = new Date()
    const needsReset = now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()

    const currentUsed = needsReset ? 0 : used

    // Dev mode: bypass generation limits if env var is set
    const bypassLimit = process.env.BYPASS_GENERATION_LIMIT === 'true'

    if (!bypassLimit && currentUsed >= limit) {
      return NextResponse.json(
        { error: 'Generation limit reached. Upgrade your plan for more generations.' },
        { status: 429 }
      )
    }

    // Build the prompt
    const systemPrompt = buildSystemPrompt(codex)
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

    // Ensure is_identified matches user input
    generatedItem.is_identified = inputs.isIdentified !== false

    // Add initial history entry
    generatedItem.history = [
      {
        event: 'forged',
        entity_id: null,
        session: null,
        note: 'Created via Item Forge'
      }
    ]

    // Track generation in database
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

    // Increment generations_used
    if (needsReset) {
      await supabase
        .from('profiles')
        .update({ generations_used: 1, generations_reset_at: now.toISOString() })
        .eq('id', user.id)
    } else {
      await supabase
        .from('profiles')
        .update({ generations_used: currentUsed + 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({
      item: generatedItem,
      generationsUsed: currentUsed + 1,
      generationsLimit: limit,
    })
  } catch (error) {
    console.error('Item generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate item. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(codex: Record<string, unknown> | null): string {
  let prompt = `You are a creative assistant for Dungeon Masters, specializing in generating memorable items for tabletop RPG campaigns.

Your task is to generate a detailed item with DUAL DESCRIPTIONS - one for players and one for DMs. This enables the "identify" gameplay moment.

The item should be:
- Memorable with interesting lore and potential plot hooks
- Have distinct player-facing and DM-facing descriptions
- Include appropriate mechanical properties for D&D 5e
- Have secrets that could drive gameplay

IMPORTANT GUIDELINES:
- public_description: What players see BEFORE identifying - physical appearance, material, obvious features. NO mechanical details.
- secret_description: The TRUE nature - magical properties, hidden abilities, curses, lore. This is revealed on Identify.
- Use **bold** markdown for key descriptors in descriptions
- secret: Additional DM-only info like curses, sentience, true names - may never be revealed to players
- value_gp should be appropriate for the rarity (common: 50-100, uncommon: 100-500, rare: 500-5000, very_rare: 5000-50000, legendary: 50000+)
- weight should be realistic (e.g., "2 lb", "0.5 lb", "negligible")
`

  if (codex) {
    prompt += `\n\nCAMPAIGN CONTEXT:\n`

    if (codex.world_name) {
      prompt += `World: ${codex.world_name}\n`
    }
    if (codex.premise) {
      prompt += `Campaign Premise: ${codex.premise}\n`
    }
    if (Array.isArray(codex.tone) && codex.tone.length > 0) {
      prompt += `Tone: ${codex.tone.join(', ')}\n`
    }
    if (codex.magic_level) {
      prompt += `Magic Level: ${codex.magic_level}\n`
    }
    if (codex.tech_level) {
      prompt += `Tech Level: ${codex.tech_level}\n`
    }
    if (Array.isArray(codex.themes) && codex.themes.length > 0) {
      prompt += `Themes: ${codex.themes.join(', ')}\n`
    }
    if (Array.isArray(codex.proper_nouns) && codex.proper_nouns.length > 0) {
      prompt += `Established Names (use these when relevant): ${codex.proper_nouns.join(', ')}\n`
    }
    if (Array.isArray(codex.content_warnings) && codex.content_warnings.length > 0) {
      prompt += `\nCONTENT TO AVOID: ${codex.content_warnings.join(', ')}\n`
    }
  }

  prompt += `\n\nRESPONSE FORMAT:
Return a JSON object with these exact fields:
{
  "name": "Name of the item",
  "item_type": "weapon|armor|potion|scroll|wondrous_item|mundane|artifact|treasure|tool|material",
  "rarity": "common|uncommon|rare|very_rare|legendary|artifact",
  "magical_aura": "none|abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation",
  "public_description": "What players see - physical appearance, obvious features. Use **bold** for key details. NO mechanical info. (2-3 sentences)",
  "secret_description": "True nature revealed on Identify - magical properties, hidden features. Use **bold** for key details. (2-3 sentences)",
  "mechanical_properties": {
    "damage": "1d8 slashing (only for weapons)",
    "ac_bonus": 2 (only for armor/shields),
    "properties": ["versatile", "finesse", "light", etc],
    "attunement": "none|required|optional|Requires attunement by a spellcaster",
    "charges": 3 (if applicable),
    "max_charges": 3 (if applicable)
  },
  "origin_history": "How it was made, who made it, significant events (2-3 sentences)",
  "value_gp": 500,
  "weight": "2 lb",
  "secret": "DM-only secret - curses, sentience, true purpose. May never be revealed. (1-2 sentences)"
}

NOTE: Only include relevant mechanical_properties fields. A potion doesn't need damage/ac_bonus.`

  return prompt
}

function buildUserPrompt(inputs: ItemInputs): string {
  let prompt = `Generate an item with the following specifications:\n\n`

  prompt += `Concept: ${inputs.dmSlug}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an appropriate name\n`
  }

  if (inputs.itemType && inputs.itemType !== 'let_ai_decide') {
    prompt += `Item Type: ${inputs.itemType}\n`
  } else {
    prompt += `Item Type: Choose based on the concept\n`
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

  if (inputs.additionalRequirements) {
    prompt += `\nAdditional requirements: ${inputs.additionalRequirements}\n`
  }

  return prompt
}
