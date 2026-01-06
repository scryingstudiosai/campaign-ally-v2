import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompressionEngine, ArcSummary } from '@/lib/ai/compression';
import { getArcData, getSessionSummaries } from '@/lib/chronicle/queries';

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
      .select('id, name, description, codex')
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

    // Get existing data instead of empty arc_summaries table
    const [arcData, sessionsResult] = await Promise.all([
      getArcData(campaignId),
      getSessionSummaries(campaignId),
    ]);

    const { quests, threads } = arcData;
    const { sessions } = sessionsResult;

    // Validate we have SOME data to work with
    const hasArcs = quests.length > 0 || threads.length > 0;
    const hasSessions = sessions.length > 0;

    if (!hasArcs && !hasSessions) {
      return NextResponse.json(
        { error: 'No session or arc data found to generate brief. Add some sessions, quests, or story threads first.' },
        { status: 400 }
      );
    }

    const currentSessionNumber = sessions[0]?.session_number || 1;

    // Transform existing data into ArcSummary format for the engine
    const arcSummaries: ArcSummary[] = [
      // Convert quests to arcs
      ...quests.map((q, i) => ({
        id: q.id,
        campaign_id: campaignId,
        arc_name: q.name,
        arc_number: i + 1,
        session_range: { start: 1, end: currentSessionNumber },
        summary: q.summary || `Quest: ${q.name} - ${q.progress.completed}/${q.progress.total} milestones complete`,
        major_events: q.milestones.filter(m => m.completed).map(m => m.text),
        character_arcs: [],
        faction_changes: [],
        world_changes: [],
        word_count: q.summary?.split(/\s+/).length || 0,
        compression_ratio: null,
        created_at: q.updatedAt,
        updated_at: q.updatedAt,
      })),
      // Convert threads to arcs
      ...threads.map((t, i) => ({
        id: t.id,
        campaign_id: campaignId,
        arc_name: t.name,
        arc_number: quests.length + i + 1,
        session_range: { start: 1, end: currentSessionNumber },
        summary: t.stakes || `Story Thread: ${t.name} (${t.status}${t.urgency ? `, ${t.urgency} priority` : ''})`,
        major_events: [],
        character_arcs: [],
        faction_changes: [],
        world_changes: [],
        word_count: t.stakes?.split(/\s+/).length || 0,
        compression_ratio: null,
        created_at: t.updatedAt,
        updated_at: t.updatedAt,
      })),
    ];

    // If no arcs but we have sessions, create a synthetic arc from session data
    if (arcSummaries.length === 0 && sessions.length > 0) {
      const sessionSummaries = sessions
        .filter(s => s.summary || s.ai_summary?.narrative_summary)
        .slice(0, 5)
        .map(s => s.summary || s.ai_summary?.narrative_summary || '')
        .join(' ');

      arcSummaries.push({
        id: 'synthetic-arc',
        campaign_id: campaignId,
        arc_name: 'Campaign Progress',
        arc_number: 1,
        session_range: { start: 1, end: currentSessionNumber },
        summary: sessionSummaries || `${sessions.length} sessions played`,
        major_events: [],
        character_arcs: [],
        faction_changes: [],
        world_changes: [],
        word_count: sessionSummaries.split(/\s+/).length,
        compression_ratio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Generate campaign brief
    const engine = new CompressionEngine(campaignId);
    const result = await engine.generateBrief({
      campaignId,
      arcSummaries,
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
