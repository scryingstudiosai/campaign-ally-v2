import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildMapPrompt, getLocationCategory, getMapGenerationSettings } from '@/lib/ai/map-prompts'
import { DEFAULT_MAP_STYLE } from '@/lib/ai/map-styles'

const openai = new OpenAI()

const MAX_ATTEMPTS = 3

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { locationId, campaignId, attemptNumber = 1 } = await request.json()

    if (!locationId || !campaignId) {
      return NextResponse.json({ error: 'Missing locationId or campaignId' }, { status: 400 })
    }

    // Fetch location details
    const { data: location, error: locError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', locationId)
      .single()

    if (locError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Fetch campaign for style settings
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    // Get campaign map style (or use default)
    const campaignStyle = campaign?.attributes?.map_style || DEFAULT_MAP_STYLE

    // Fetch child locations for context
    const { data: children } = await supabase
      .from('entities')
      .select('name, sub_type')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'location')
      .neq('status', 'archived')
      .is('deleted_at', null)

    // Filter to find children that have this location as parent
    const childLocations = (children || []).filter(
      (c) => c.sub_type // has a sub_type
    )

    // Build the optimized prompt
    const prompt = buildMapPrompt({
      locationName: location.name,
      locationType: location.sub_type || 'region',
      description: location.dm_slug || location.read_aloud,
      childLocations: childLocations.slice(0, 10).map((c) => ({ name: c.name, type: c.sub_type || 'location' })),
      terrain: location.attributes?.terrain,
      climate: location.attributes?.climate,
      campaignStyle,
      attemptNumber,
    })

    const category = getLocationCategory(location.sub_type || 'region')
    const settings = getMapGenerationSettings(category, campaignStyle)

    console.log('=== MAP GENERATION ===')
    console.log('Location:', location.name)
    console.log('Category:', category)
    console.log('Attempt:', attemptNumber)
    console.log('Style:', campaignStyle.artDirection)
    console.log('Prompt length:', prompt.length)

    // Generate with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    })

    const tempImageUrl = response.data[0]?.url
    const revisedPrompt = response.data[0]?.revised_prompt

    if (!tempImageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    console.log('Image generated successfully')
    console.log('Revised prompt:', revisedPrompt?.substring(0, 200) + '...')

    // Download and save to Supabase Storage for persistence
    const imageResponse = await fetch(tempImageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const fileName = `${campaignId}/${locationId}/map-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage.from('maps').upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // If storage fails, return the temporary URL (will expire in ~1 hour)
      return NextResponse.json({
        imageUrl: tempImageUrl,
        category,
        style: campaignStyle.artDirection,
        attemptNumber,
        warning: 'Image saved temporarily. Storage upload failed.',
      })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('maps').getPublicUrl(fileName)

    // Update location with map URL and generation metadata
    const { error: updateError } = await supabase
      .from('entities')
      .update({
        attributes: {
          ...location.attributes,
          map_image_url: publicUrl,
          map_generated_at: new Date().toISOString(),
          map_category: category,
          map_style: campaignStyle.artDirection,
          map_generation_attempts: attemptNumber,
        },
      })
      .eq('id', locationId)

    if (updateError) {
      console.error('Entity update error:', updateError)
    }

    return NextResponse.json({
      imageUrl: publicUrl,
      category,
      style: campaignStyle.artDirection,
      attemptNumber,
    })
  } catch (error: unknown) {
    console.error('Map generation error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate map'

    return NextResponse.json(
      {
        error: errorMessage,
        canRetry: true,
        maxAttempts: MAX_ATTEMPTS,
      },
      { status: 500 }
    )
  }
}
