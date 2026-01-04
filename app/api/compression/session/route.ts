import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompressionEngine } from '@/lib/ai/compression';

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
    const { campaignId, sessionId, sessionNumber, forceRegenerate } = body;

    if (!campaignId || !sessionId || sessionNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, sessionId, sessionNumber' },
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

    // Check for existing summary unless force regenerate
    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from('session_summaries')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Get session events
    const { data: events } = await supabase
      .from('session_events')
      .select('id, event_type, title, description, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'No events found for this session' },
        { status: 400 }
      );
    }

    // Generate summary
    const engine = new CompressionEngine(campaignId);
    const result = await engine.compressSession({
      campaignId,
      sessionId,
      sessionNumber,
      events,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from('session_summaries')
      .upsert({
        id: result.data.id,
        campaign_id: result.data.campaign_id,
        session_id: result.data.session_id,
        session_number: result.data.session_number,
        summary: result.data.summary,
        key_events: result.data.key_events,
        npcs_involved: result.data.npcs_involved,
        locations_visited: result.data.locations_visited,
        items_acquired: result.data.items_acquired,
        threads_advanced: result.data.threads_advanced,
        threads_resolved: result.data.threads_resolved,
        party_decisions: result.data.party_decisions,
        cliffhanger: result.data.cliffhanger,
        word_count: result.data.word_count,
        compression_ratio: result.data.compression_ratio,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save session summary:', saveError);
      // Return the generated data even if save fails
      return NextResponse.json(result.data);
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Session compression error:', error);
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
    const sessionId = searchParams.get('sessionId');

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

    // Get summaries
    let query = supabase
      .from('session_summaries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('session_number', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: summaries, error } = await query;

    if (error) {
      console.error('Failed to fetch session summaries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch summaries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summaries: summaries || [] });
  } catch (error) {
    console.error('Session summaries fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
