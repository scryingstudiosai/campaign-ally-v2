import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'

interface CodexContext {
  worldName?: string
  tone?: string[]
  pillars?: string[]
  themes?: string[]
  magicLevel?: string
  techLevel?: string
}

interface InspireRequest {
  field: 'premise' | 'themes' | 'openQuestions'
  context: CodexContext
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: InspireRequest = await request.json()
    const { field, context } = body

    if (!field) {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildUserPrompt(field, context)

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 500,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(responseContent)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Codex inspire error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(context: CodexContext): string {
  let prompt = `You are a creative assistant helping a Dungeon Master build their campaign world.
Your job is to provide inspiring suggestions based on the campaign context provided.

Be creative but grounded in the established context. Suggest things that fit the tone and style already established.
`

  if (context.worldName) {
    prompt += `\nWorld Name: ${context.worldName}`
  }
  if (context.tone && context.tone.length > 0) {
    prompt += `\nTone: ${context.tone.join(', ')}`
  }
  if (context.pillars && context.pillars.length > 0) {
    prompt += `\nCampaign Pillars: ${context.pillars.join(', ')}`
  }
  if (context.themes && context.themes.length > 0) {
    prompt += `\nExisting Themes: ${context.themes.join(', ')}`
  }
  if (context.magicLevel) {
    prompt += `\nMagic Level: ${context.magicLevel}`
  }
  if (context.techLevel) {
    prompt += `\nTech Level: ${context.techLevel}`
  }

  return prompt
}

function buildUserPrompt(field: string, context: CodexContext): string {
  switch (field) {
    case 'premise':
      return `Generate a compelling campaign premise (1-2 sentences) for a D&D campaign.
The premise should establish the central conflict or hook that drives the story.

Consider any existing context like tone (${context.tone?.join(', ') || 'not set'}) and pillars (${context.pillars?.join(', ') || 'not set'}).

Return JSON: { "suggestion": "Your premise here" }`

    case 'themes':
      return `Suggest 2-3 additional themes that would complement this campaign.
Consider the existing themes (${context.themes?.join(', ') || 'none yet'}) and tone.

Return JSON: { "suggestions": ["theme1", "theme2", "theme3"] }

Make the themes single words or short phrases like: "betrayal", "lost love", "forbidden knowledge", "divine intervention", "colonial expansion"`

    case 'openQuestions':
      return `Suggest 2-3 intriguing open questions for this campaign - mysteries the DM hasn't decided yet.
These should be plot-driving questions that could shape the campaign.

Return JSON: { "suggestions": ["Question 1?", "Question 2?", "Question 3?"] }

Examples of good questions:
- "Who betrayed the old king?"
- "What lies beneath the abandoned city?"
- "Why did the gods go silent?"`

    default:
      return 'Return JSON: { "error": "Unknown field" }'
  }
}
