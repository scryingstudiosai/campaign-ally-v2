import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CampaignChronicle } from '@/lib/ai/compression';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId parameter' },
        { status: 400 }
      );
    }

    // Verify campaign ownership and get name
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch all chronicle data in parallel
    const [briefResult, arcsResult, sessionsResult, entitiesResult] = await Promise.all([
      supabase
        .from('campaign_briefs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('arc_summaries')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('arc_number', { ascending: true }),
      supabase
        .from('session_summaries')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false }),
      supabase
        .from('entity_histories')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('entity_name', { ascending: true }),
    ]);

    const chronicle: CampaignChronicle = {
      campaignId,
      campaignName: campaign.name,
      brief: briefResult.data || undefined,
      arcs: arcsResult.data || [],
      sessions: sessionsResult.data || [],
      entityHistories: entitiesResult.data || [],
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(chronicle);
  } catch (error) {
    console.error('Chronicle fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
