import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';
import { CAMPAIGN_IMAGES_BUCKET } from '@/lib/supabase/storage';

// Style prompts based on entity type
const STYLE_PROMPTS: Record<string, string> = {
  npc: 'Fantasy RPG character portrait, painterly style, dramatic lighting, head and shoulders composition',
  player: 'Fantasy RPG character portrait, painterly style, dramatic lighting, head and shoulders composition',
  location: 'Fantasy RPG environment art, detailed landscape, atmospheric, cinematic composition',
  item: 'Fantasy RPG item illustration, detailed, centered on simple gradient background',
  creature: 'Fantasy RPG monster illustration, dynamic pose, dramatic lighting, menacing',
  faction: 'Fantasy RPG faction emblem or group scene, dramatic, symbolic, heraldic elements',
  encounter: 'Fantasy RPG battle scene, dramatic lighting, dynamic action, atmospheric',
  quest: 'Fantasy RPG quest illustration, epic scene, dramatic lighting, story moment',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, campaignId, entityId, entityType } = await req.json();

    if (!prompt || !campaignId) {
      return NextResponse.json({ error: 'Missing prompt or campaignId' }, { status: 400 });
    }

    // Build context-aware prompt
    const stylePrompt = STYLE_PROMPTS[entityType] || 'Fantasy RPG illustration, detailed, dramatic lighting';
    const fullPrompt = `${stylePrompt}: ${prompt}`;

    // Generate with DALL-E 3
    const openai = getOpenAIClient();
    const aiResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
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
