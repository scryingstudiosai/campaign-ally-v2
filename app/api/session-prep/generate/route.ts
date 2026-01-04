import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionPrepGenerator } from '@/lib/ai/session-prep';

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
    const {
      campaignId,
      plannedLocationId,
      sessionGoals,
      includeRecap = true,
      includeOpeningScene = true,
    } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
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

    // Generate prep report
    const report = await sessionPrepGenerator.generatePrepReport({
      campaignId,
      plannedLocationId,
      sessionGoals,
      includeRecap,
      includeOpeningScene,
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error('[SessionPrep API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
