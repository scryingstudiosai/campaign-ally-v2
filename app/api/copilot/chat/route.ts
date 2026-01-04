import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { copilotService } from '@/lib/ai/copilot';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, message, conversationHistory } = body;

    if (!campaignId || !message) {
      return NextResponse.json({ error: 'Missing campaignId or message' }, { status: 400 });
    }

    // Verify user owns campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Process chat
    const response = await copilotService.chat({
      campaignId,
      message,
      conversationHistory,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[Copilot API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
