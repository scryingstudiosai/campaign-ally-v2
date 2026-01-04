import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompressionEngine, ArcSummary } from '@/lib/ai/compression';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, forceRegenerate } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing required field: campaignId' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check for existing brief unless force regenerate
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('campaign_briefs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Get arc summaries
    const { data: arcSummaries, error: fetchError } = await supabase
      .from('arc_summaries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('arc_number', { ascending: true });

    if (fetchError || !arcSummaries || arcSummaries.length === 0) {
      return NextResponse.json(
        { error: 'No arc summaries found. Generate arc summaries first.' },
        { status: 400 }
      );
    }

    // Get current session number
    const { data: sessions } = await supabase
      .from('sessions')
      .select('session_number')
      .eq('campaign_id', campaignId)
      .order('session_number', { ascending: false })
      .limit(1);

    const currentSessionNumber = sessions?.[0]?.session_number || 1;

    // Generate campaign brief
    const engine = new CompressionEngine(campaignId);
    const result = await engine.generateBrief({
      campaignId,
      arcSummaries: arcSummaries as ArcSummary[],
      currentSessionNumber,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate campaign brief' },
        { status: 500 }
      );
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from('campaign_briefs')
      .upsert({
        id: result.data.id,
        campaign_id: result.data.campaign_id,
        brief: result.data.brief,
        current_arc: result.data.current_arc,
        party_status: result.data.party_status,
        major_npcs: result.data.major_npcs,
        key_locations: result.data.key_locations,
        active_threads: result.data.active_threads,
        campaign_themes: result.data.campaign_themes,
        total_sessions: result.data.total_sessions,
        word_count: result.data.word_count,
        compression_ratio: result.data.compression_ratio,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save campaign brief:', saveError);
      return NextResponse.json(result.data);
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Brief generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get latest campaign brief
    const { data: brief, error } = await supabase
      .from('campaign_briefs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch campaign brief:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaign brief' },
        { status: 500 }
      );
    }

    return NextResponse.json({ brief: brief || null });
  } catch (error) {
    console.error('Campaign brief fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
