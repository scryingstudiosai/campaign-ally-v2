import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';
import { CAMPAIGN_IMAGES_BUCKET } from '@/lib/supabase/storage';
import { buildGenerationPrompt } from '@/lib/image-generation/styles';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      prompt,
      campaignId,
      entityId,
      entityType,
      artStyle,
      lightingStyle,
      compositionStyle,
      size, // Optional: '1024x1024', '1792x1024', '1024x1792'
    } = await req.json();

    if (!prompt || !campaignId) {
      return NextResponse.json({ error: 'Missing prompt or campaignId' }, { status: 400 });
    }

    // Build context-aware prompt using the style system
    const fullPrompt = buildGenerationPrompt({
      userPrompt: prompt,
      entityType,
      artStyle: artStyle || 'classic-fantasy',
      lightingStyle: lightingStyle || 'dramatic',
      compositionStyle: compositionStyle || 'portrait',
      qualityLevel: 'high',
    });

    // Validate size parameter (DALL-E 3 supported sizes)
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';

    // Generate with DALL-E 3
    const openai = getOpenAIClient();
    const aiResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: imageSize as '1024x1024' | '1792x1024' | '1024x1792',
      response_format: 'b64_json',
    });

    if (!aiResponse.data || !aiResponse.data[0]) {
      throw new Error('No image generated');
    }
    const generatedImage = aiResponse.data[0];
    const imageBase64 = generatedImage.b64_json;
    if (!imageBase64) {
      throw new Error('No image data received');
    }

    // Convert to buffer
    const buffer = Buffer.from(imageBase64, 'base64');

    // Generate file path
    const fileName = entityId
      ? `${entityId}-${Date.now()}.png`
      : `generated-${Date.now()}.png`;
    const filePath = `${campaignId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(CAMPAIGN_IMAGES_BUCKET)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(CAMPAIGN_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      revised_prompt: generatedImage.revised_prompt,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
