import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildMapPrompt, getLocationCategory, getMapGenerationSettings, MAP_VISUAL_PRESETS } from '@/lib/ai/map-prompts'
import { DEFAULT_MAP_STYLE } from '@/lib/ai/map-styles'

const openai = new OpenAI()

const MAX_ATTEMPTS = 3

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { locationId, campaignId, attemptNumber = 1, visualStyle, additionalContext } = await request.json()

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

    // Merge child locations from DB with any passed from client
    const allChildLocations = [
      ...childLocations.slice(0, 8).map((c) => ({ name: c.name, type: c.sub_type || 'location' })),
      ...(additionalContext?.childLocations || []).slice(0, 4),
    ]

    // Build description with any additional context
    const descriptionParts = [location.dm_slug || location.read_aloud]
    if (additionalContext?.atmosphere) {
      descriptionParts.push(`Atmosphere: ${additionalContext.atmosphere}`)
    }
    if (additionalContext?.purpose) {
      descriptionParts.push(`Purpose: ${additionalContext.purpose}`)
    }
    // Include mechanics data
    if (additionalContext?.size) {
      descriptionParts.push(`Size: ${additionalContext.size}`)
    }
    if (additionalContext?.hazards && Array.isArray(additionalContext.hazards) && additionalContext.hazards.length > 0) {
      const hazardNames = additionalContext.hazards.map((h: { name?: string } | string) =>
        typeof h === 'object' && h.name ? h.name : String(h)
      ).join(', ')
      descriptionParts.push(`Notable hazards: ${hazardNames}`)
    }
    if (additionalContext?.resources && Array.isArray(additionalContext.resources) && additionalContext.resources.length > 0) {
      const resourceList = additionalContext.resources.join(', ')
      descriptionParts.push(`Resources: ${resourceList}`)
    }
    if (additionalContext?.additionalDetails) {
      descriptionParts.push(additionalContext.additionalDetails)
    }
    const fullDescription = descriptionParts.filter(Boolean).join('. ')

    // Validate visual style if provided
    const validVisualStyle = visualStyle && MAP_VISUAL_PRESETS[visualStyle as keyof typeof MAP_VISUAL_PRESETS]
      ? (visualStyle as keyof typeof MAP_VISUAL_PRESETS)
      : undefined

    // Build the optimized prompt
    const prompt = buildMapPrompt({
      locationName: location.name,
      locationType: location.sub_type || 'region',
      description: fullDescription,
      childLocations: allChildLocations.slice(0, 10),
      terrain: additionalContext?.terrain || location.attributes?.terrain,
      climate: additionalContext?.climate || location.attributes?.climate,
      campaignStyle,
      attemptNumber,
      visualStyle: validVisualStyle,
      additionalContext: additionalContext?.additionalDetails,
    })

    console.log('Visual style:', validVisualStyle || 'default')
    console.log('Additional context received:', additionalContext ? Object.keys(additionalContext) : 'none')

    const category = getLocationCategory(location.sub_type || 'region')
    const settings = getMapGenerationSettings(category, campaignStyle)

    console.log('=== MAP GENERATION ===')
    console.log('Location:', location.name)
    console.log('Category:', category)
    console.log('Attempt:', attemptNumber)
    console.log('Visual style:', validVisualStyle || 'default')
    console.log('Campaign style:', campaignStyle.artDirection)
    console.log('Prompt length:', prompt.length)

    // Generate with GPT Image 1.5 (much better at following "no text" instructions)
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    })

    // GPT Image returns base64, not URL
    const imageBase64 = response.data[0]?.b64_json

    if (!imageBase64) {
      throw new Error('No image data returned from OpenAI')
    }

    console.log('Image generated successfully')

    // Convert base64 to buffer for storage
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const fileName = `${campaignId}/${locationId}/map-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage.from('maps').upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // If storage fails, return base64 data URL for immediate use
      return NextResponse.json({
        imageUrl: `data:image/png;base64,${imageBase64}`,
        category,
        style: campaignStyle.artDirection,
        visualStyle: validVisualStyle || 'classic-dnd',
        attemptNumber,
        warning: 'Storage upload failed. Using temporary data URL.',
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
      visualStyle: validVisualStyle || 'classic-dnd',
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
