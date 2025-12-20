import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'

interface NPCInputs {
  name?: string
  role: string
  race?: string
  gender?: string
  personalityHints?: string
  voiceReference?: string
  additionalRequirements?: string
}

interface NpcBrain {
  desire: string
  fear: string
  leverage: string
  line: string
}

interface NpcVoice {
  style: string[]
  speech_patterns: string[]
  catchphrase?: string
  energy: 'subdued' | 'measured' | 'animated' | 'manic'
  vocabulary: 'simple' | 'educated' | 'archaic' | 'technical' | 'street'
  tells?: string[]
}

interface NpcFact {
  content: string
  category: 'appearance' | 'personality' | 'secret' | 'plot' | 'lore' | 'backstory' | 'mechanical' | 'flavor'
  visibility: 'public' | 'limited' | 'dm_only'
}

interface GeneratedNPC {
  name: string
  sub_type: string

  // New Brain/Voice/Facts structure
  brain: NpcBrain
  voice: NpcVoice
  facts: NpcFact[]
  read_aloud: string
  dm_slug: string

  // Legacy fields for backward compatibility
  dmSlug: string
  race: string
  gender: string
  appearance: string
  personality: string
  voiceAndMannerisms: string
  voiceReference?: string
  motivation: string
  secret: string
  plotHook: string
  loot: string[]
  combatStats: {
    armorClass: number
    hitPoints: string | number
    primaryWeapon: string
    combatStyle: string
  }
  connectionHooks: string[]
  tags: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, inputs } = body as { campaignId: string; inputs: NPCInputs }

    if (!campaignId || !inputs?.role) {
      return NextResponse.json(
        { error: 'Campaign ID and role are required' },
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

    // Check generation limits (free tier: 50/month)
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

    const generatedNPC: GeneratedNPC = JSON.parse(responseContent)

    // Add voice reference if provided by user
    if (inputs.voiceReference) {
      generatedNPC.voiceReference = inputs.voiceReference
    }

    // Track generation in database
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'npc',
      input_summary: `Role: ${inputs.role}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
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
      npc: generatedNPC,
      generationsUsed: currentUsed + 1,
      generationsLimit: limit,
    })
  } catch (error) {
    console.error('NPC generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate NPC. Please try again.' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(codex: Record<string, unknown> | null): string {
  let prompt = `You are a creative assistant for Dungeon Masters, specializing in generating memorable NPCs for tabletop RPG campaigns.

Your task is to generate a detailed NPC optimized for "at-the-table" use. DMs need to glance at info in 5 seconds and roleplay convincingly.

The NPC should be:
- Memorable and distinct with a clear hook
- Have a quick-reference summary (the dm_slug)
- Include a "brain" with psychology for roleplaying decisions
- Include a "voice" profile for speaking in character
- Include atomic facts about appearance, personality, secrets
- Include practical combat stats for potential encounters
- Provide items they carry for looting/pickpocketing (as separate items for quick reading)
- Have secrets and plot hooks that drive gameplay

IMPORTANT GUIDELINES:
- The dm_slug should be ONE punchy line that captures their essence (e.g., "Stoic Elf Guard who secretly hates conflict")
- Use **bold** markdown for key descriptors in appearance and personality
- Keep descriptions vivid but concise (2-3 sentences each section)

BRAIN GUIDELINES (The NPC's psychology - helps DM make decisions as this character):
- **Desire**: Must be SPECIFIC and CURRENT. Not "wants power" but "wants to secure the mining contract before the Festival"
- **Fear**: Must be VISCERAL. Not "fears failure" but "fears his children will discover he murdered their mother"
- **Leverage**: Must be ACTIONABLE. How can the party pressure this NPC?
- **Line**: Must be ABSOLUTE. The hard limit that defines their character.

VOICE GUIDELINES (How they speak - helps DM roleplay):
- **Style**: 2-3 adjectives that capture how they SOUND (e.g., "Gravelly", "Slow", "Menacing")
- **Speech patterns**: Specific verbal habits (speaks in third person, never uses contractions, curses frequently)
- **Energy**: subdued/measured/animated/manic
- **Vocabulary**: simple/educated/archaic/technical/street
- **Tells**: Physical behaviors when lying or nervous (optional but valuable)

FACTS GUIDELINES:
Generate 5-8 atomic facts:
- 2-3 appearance facts (visibility: "public")
- 2-3 personality facts (visibility: "public")
- 1-2 secret facts (visibility: "dm_only")
- 1-2 plot/lore facts (visibility: "dm_only")
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
    if (Array.isArray(codex.pillars) && codex.pillars.length > 0) {
      prompt += `Campaign Pillars: ${codex.pillars.join(', ')}\n`
    }
    if (codex.narrative_voice) {
      prompt += `Narrative Voice: ${codex.narrative_voice}\n`
    }
    if (Array.isArray(codex.languages) && codex.languages.length > 0) {
      prompt += `Common Languages: ${codex.languages.join(', ')}\n`
    }
    if (Array.isArray(codex.proper_nouns) && codex.proper_nouns.length > 0) {
      prompt += `Established Names (use these when relevant): ${codex.proper_nouns.join(', ')}\n`
    }
    if (Array.isArray(codex.content_warnings) && codex.content_warnings.length > 0) {
      prompt += `\nCONTENT TO AVOID: ${codex.content_warnings.join(', ')}\n`
    }
    if (Array.isArray(codex.open_questions) && codex.open_questions.length > 0) {
      prompt += `\nOPEN QUESTIONS (do not commit to answers for these): ${codex.open_questions.join('; ')}\n`
    }
  }

  prompt += `\n\nRESPONSE FORMAT:
Return a JSON object with these exact fields:
{
  "name": "Full name of the NPC",
  "sub_type": "standard",

  "brain": {
    "desire": "What they want RIGHT NOW - specific and actionable",
    "fear": "What terrifies them - be specific",
    "leverage": "How someone could manipulate or pressure them",
    "line": "The one thing they will NEVER do, no matter what"
  },

  "voice": {
    "style": ["Adjective1", "Adjective2", "Adjective3"],
    "speech_patterns": ["Pattern 1", "Pattern 2"],
    "catchphrase": "A phrase they repeat (optional)",
    "energy": "subdued|measured|animated|manic",
    "vocabulary": "simple|educated|archaic|technical|street",
    "tells": ["Physical tell when lying or nervous"]
  },

  "facts": [
    {"content": "Appearance fact", "category": "appearance", "visibility": "public"},
    {"content": "Personality fact", "category": "personality", "visibility": "public"},
    {"content": "Secret fact", "category": "secret", "visibility": "dm_only"}
  ],

  "read_aloud": "A 40-60 word sensory description for when players first meet this character. Focus on sight, sound, smell.",
  "dm_slug": "One-line quick reference (e.g., 'Nervous blacksmith hiding a dark secret')",
  "dmSlug": "Same as dm_slug for compatibility",

  "race": "Race/species of the NPC",
  "gender": "Gender of the NPC",
  "appearance": "Physical description with **bold** key features (2-3 sentences)",
  "personality": "Key personality traits with **bold** emphasis (2-3 sentences)",
  "voiceAndMannerisms": "How they speak, distinctive habits (1-2 sentences)",
  "motivation": "What drives this character (1-2 sentences)",
  "secret": "A hidden truth about them (1-2 sentences)",
  "plotHook": "How to involve this NPC in gameplay (1-2 sentences)",
  "loot": ["Item 1", "Item 2", "Item 3"],
  "combatStats": {
    "armorClass": 12,
    "hitPoints": 25,
    "primaryWeapon": "Weapon name",
    "combatStyle": "How they fight or avoid combat"
  },
  "connectionHooks": ["Way to connect to party 1", "Way to connect to party 2"],
  "tags": ["tag1", "tag2"]
}

IMPORTANT:
- loot must be an array of strings, NOT a single string
- hitPoints must be a NUMBER, not a string
- energy must be one of: subdued, measured, animated, manic
- vocabulary must be one of: simple, educated, archaic, technical, street`

  return prompt
}

function buildUserPrompt(inputs: NPCInputs): string {
  let prompt = `Generate an NPC with the following specifications:\n\n`

  prompt += `Role: ${inputs.role}\n`

  if (inputs.name) {
    prompt += `Name: ${inputs.name}\n`
  } else {
    prompt += `Name: Generate an appropriate name\n`
  }

  if (inputs.race && inputs.race !== 'let_ai_decide') {
    prompt += `Race: ${inputs.race}\n`
  } else {
    prompt += `Race: Choose an appropriate race for this role\n`
  }

  if (inputs.gender && inputs.gender !== 'let_ai_decide') {
    prompt += `Gender: ${inputs.gender}\n`
  } else {
    prompt += `Gender: Choose as appropriate\n`
  }

  if (inputs.personalityHints) {
    prompt += `\nPersonality hints: ${inputs.personalityHints}\n`
  }

  if (inputs.voiceReference) {
    prompt += `\nVoice/Accent reference: ${inputs.voiceReference}\n`
    prompt += `(Incorporate this voice style into the voiceAndMannerisms description)\n`
  }

  if (inputs.additionalRequirements) {
    prompt += `\nAdditional requirements: ${inputs.additionalRequirements}\n`
  }

  return prompt
}
