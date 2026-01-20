import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionPrepGenerator } from '@/lib/ai/session-prep';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, prompt, includeLastSession, includeActiveThreads } = await req.json();

    if (!campaignId || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user owns this campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const result = await sessionPrepGenerator.generateBlockOptions({
      campaignId,
      prompt,
      includeLastSession,
      includeActiveThreads,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GenerateBlocks] Error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
