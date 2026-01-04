import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { fetchCampaignContext } from '@/lib/forge/context-fetcher'

interface MapInputs {
  campaignId: string
  name?: string
  concept: string
  mapType: 'world' | 'region' | 'city' | 'dungeon' | 'building' | 'encounter' | 'other'
  style: string
  linkedEntityId?: string
}

interface SuggestedPOI {
  name: string
  description: string
  type: string
}

interface GeneratedMap {
  name: string
  description: string
  imageUrl: string
  style: string
  mapType: string
  suggestedPOIs: SuggestedPOI[]
}

const mapTypePrompts: Record<string, string> = {
  world: 'a fantasy world map showing continents, oceans, and major regions',
  region: 'a detailed regional map showing terrain, settlements, and roads',
  city: 'a city map showing districts, streets, and notable buildings',
  dungeon: 'a dungeon map with rooms, corridors, and chambers',
  building: 'a floor plan or building layout',
  encounter: 'a battle map with terrain features and tactical elements',
  other: 'a detailed fantasy map',
}

const stylePrompts: Record<string, string> = {
  parchment: 'aged parchment style with sepia tones and weathered edges',
  satellite: 'aerial satellite view perspective',
  artistic: 'beautifully painted artistic style with rich colors',
  'hand-drawn': 'hand-drawn sketch style with ink lines',
  fantasy: 'fantasy RPG style with decorative borders and compass rose',
  realistic: 'realistic detailed cartographic style',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const inputs: MapInputs = await request.json()
    const { campaignId, name, concept, mapType, style, linkedEntityId } = inputs

    if (!campaignId || !concept) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, setting, themes')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch linked entity context if provided
    let linkedEntityContext = ''
    if (linkedEntityId) {
      const { data: entity } = await supabase
        .from('entities')
        .select('name, summary, soul')
        .eq('id', linkedEntityId)
        .single()

      if (entity) {
        linkedEntityContext = `\nThis map is for: ${entity.name}\nDescription: ${entity.summary || 'No description'}`
      }
    }

    const openai = getOpenAIClient()

    // Step 1: Generate map metadata and POIs using GPT
    const metadataPrompt = `You are a creative fantasy cartographer and world-builder. Generate metadata for a map based on the following:

Campaign: ${campaign.name}
Setting: ${campaign.setting || 'Fantasy'}
Themes: ${campaign.themes?.join(', ') || 'Adventure'}

Map Type: ${mapType}
Style: ${style}
Concept: ${concept}
${linkedEntityContext}

Generate the following in JSON format:
{
  "name": "A creative name for this map",
  "description": "A 1-2 sentence description of what this map shows",
  "suggestedPOIs": [
    {
      "name": "Point of Interest Name",
      "description": "Brief description",
      "type": "settlement|landmark|dungeon|danger|natural|mystery"
    }
  ]
}

Generate 3-5 suggested Points of Interest that would make sense for this map.
Ensure the POIs fit the map type and the campaign's setting.`

    const metadataResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: metadataPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 500,
    })

    const metadataText = metadataResponse.choices[0]?.message?.content || '{}'
    const metadata = JSON.parse(metadataText)

    // Step 2: Generate the map image using DALL-E
    const mapTypeDescription = mapTypePrompts[mapType] || mapTypePrompts.other
    const styleDescription = stylePrompts[style] || stylePrompts.fantasy

    const imagePrompt = `Create ${mapTypeDescription}. ${styleDescription}.
The map should depict: ${concept}.
${metadata.suggestedPOIs?.length > 0 ? `Include these key locations: ${metadata.suggestedPOIs.map((p: SuggestedPOI) => p.name).join(', ')}.` : ''}
The style should be suitable for a tabletop RPG. Top-down perspective, clear and readable, with terrain details and labels.`

    let imageUrl = ''

    try {
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      })

      imageUrl = imageResponse.data?.[0]?.url || ''
    } catch (imageError) {
      console.error('DALL-E generation failed:', imageError)
      // Fall back to a placeholder if image generation fails
      imageUrl = `https://placehold.co/1024x1024/1a1a2e/14b8a6?text=${encodeURIComponent(name || metadata.name || 'Map')}`
    }

    const generatedMap: GeneratedMap = {
      name: name || metadata.name || 'Unnamed Map',
      description: metadata.description || concept,
      imageUrl,
      style,
      mapType,
      suggestedPOIs: metadata.suggestedPOIs || [],
    }

    return NextResponse.json({ map: generatedMap })
  } catch (error) {
    console.error('Map generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate map' },
      { status: 500 }
    )
  }
}
