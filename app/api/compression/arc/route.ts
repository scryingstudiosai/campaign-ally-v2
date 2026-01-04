import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompressionEngine, SessionSummary } from '@/lib/ai/compression';

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
    const { campaignId, arcName, arcNumber, sessionIds, forceRegenerate } = body;

    if (!campaignId || !arcName || arcNumber === undefined || !sessionIds?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, arcName, arcNumber, sessionIds' },
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

    // Check for existing arc summary unless force regenerate
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('arc_summaries')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('arc_number', arcNumber)
        .single();

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Get session summaries for the arc
    const { data: sessionSummaries, error: fetchError } = await supabase
      .from('session_summaries')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('session_id', sessionIds)
      .order('session_number', { ascending: true });

    if (fetchError || !sessionSummaries || sessionSummaries.length === 0) {
      return NextResponse.json(
        { error: 'No session summaries found. Generate session summaries first.' },
        { status: 400 }
      );
    }

    // Generate arc summary
    const engine = new CompressionEngine(campaignId);
    const result = await engine.compressArc({
      campaignId,
      arcName,
      arcNumber,
      sessionSummaries: sessionSummaries as SessionSummary[],
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate arc summary' },
        { status: 500 }
      );
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from('arc_summaries')
      .upsert({
        id: result.data.id,
        campaign_id: result.data.campaign_id,
        arc_name: result.data.arc_name,
        arc_number: result.data.arc_number,
        session_range: result.data.session_range,
        summary: result.data.summary,
        major_events: result.data.major_events,
        character_arcs: result.data.character_arcs,
        faction_changes: result.data.faction_changes,
        world_changes: result.data.world_changes,
        unresolved_threads: result.data.unresolved_threads,
        word_count: result.data.word_count,
        compression_ratio: result.data.compression_ratio,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save arc summary:', saveError);
      return NextResponse.json(result.data);
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Arc compression error:', error);
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

    // Get arc summaries
    const { data: arcs, error } = await supabase
      .from('arc_summaries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('arc_number', { ascending: true });

    if (error) {
      console.error('Failed to fetch arc summaries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch arc summaries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ arcs: arcs || [] });
  } catch (error) {
    console.error('Arc summaries fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
