import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionSummaries, getArcData, getCampaignBriefDerived } from '@/lib/chronicle/queries';

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

    // Fetch all chronicle data from existing tables
    const [sessionsResult, arcData, briefData] = await Promise.all([
      getSessionSummaries(campaignId),
      getArcData(campaignId),
      getCampaignBriefDerived(campaignId),
    ]);

    // Debug: Log what we got from the query
    console.log('[Chronicle API] Raw sessions count:', sessionsResult.sessions.length);
    if (sessionsResult.sessions.length > 0) {
      const sample = sessionsResult.sessions[0];
      console.log('[Chronicle API] Sample session fields:', Object.keys(sample));
      console.log('[Chronicle API] Sample session data:', {
        id: sample.id,
        name: sample.name,
        hasSummary: !!sample.summary,
        summaryPreview: sample.summary?.substring(0, 50),
        hasAiSummary: !!sample.ai_summary,
        aiSummaryType: typeof sample.ai_summary,
        aiSummaryKeys: sample.ai_summary ? Object.keys(sample.ai_summary) : null,
      });
    }

    // Transform ALL sessions - don't filter, let the UI show them
    // Sessions without summaries can still be listed
    const sessions = sessionsResult.sessions.map(s => {
      // Handle ai_summary which might be a string (JSON) or object
      let aiSummary = s.ai_summary;
      if (typeof aiSummary === 'string') {
        try {
          aiSummary = JSON.parse(aiSummary);
        } catch {
          aiSummary = null;
        }
      }

      const summaryText = s.summary || aiSummary?.narrative_summary || '';
      const keyEvents = aiSummary?.key_events || [];
      const npcsInvolved = aiSummary?.npcs_encountered || [];

      const sessionDate = s.session_date || new Date().toISOString();

      return {
        // Core identifiers (required by SessionSummary type)
        id: s.id,
        campaign_id: campaignId,
        session_id: s.id,
        session_number: s.session_number,
        // Display fields (extended for UI)
        name: s.name,
        status: s.status,
        hasSummary: !!(s.summary || aiSummary?.narrative_summary),
        // Summary content
        summary: summaryText,
        key_events: keyEvents,
        npcs_involved: npcsInvolved,
        // Empty arrays for type compatibility
        locations_visited: [],
        items_acquired: [],
        threads_advanced: [],
        threads_resolved: [],
        party_decisions: [],
        // Optional fields
        cliffhanger: aiSummary?.cliffhanger || undefined,
        // Metrics
        word_count: summaryText ? summaryText.split(/\s+/).filter(Boolean).length : 0,
        compression_ratio: 1,
        // Timestamps
        created_at: sessionDate,
        updated_at: sessionDate,
      };
    });

    // Count sessions that have actual summary content
    const sessionsWithSummary = sessions.filter(s => s.hasSummary).length;
    console.log('[Chronicle API] Sessions with summary:', sessionsWithSummary, '/', sessions.length);

    // Transform arcs (quests + threads) to match expected format
    const arcs = [
      ...arcData.quests.map((q, i) => ({
        id: q.id,
        arc_number: i + 1,
        arc_name: q.name,
        summary: q.summary || `Quest with ${q.progress.total} milestones (${q.progress.completed} complete)`,
        session_range: { start: 1, end: sessions.length || 1 },
        major_events: q.milestones.map(m => m.text),
        world_changes: [],
        word_count: q.summary?.split(/\s+/).length || 0,
        compression_ratio: null,
        type: 'quest',
        progress: q.progress,
      })),
      ...arcData.threads.map((t, i) => ({
        id: t.id,
        arc_number: arcData.quests.length + i + 1,
        arc_name: t.name,
        summary: t.stakes || `${t.status} story thread`,
        session_range: { start: 1, end: sessions.length || 1 },
        major_events: [],
        world_changes: [],
        word_count: 0,
        compression_ratio: null,
        type: 'thread',
        status: t.status,
        urgency: t.urgency,
      })),
    ];

    // Generate brief from existing data
    const brief = briefData.campaign ? {
      brief: briefData.campaign.codex?.premise || briefData.campaign.description || 'No campaign description available.',
      current_arc: arcs.length > 0 ? arcs[0].arc_name : 'No active arcs',
      party_status: 'Active',
      major_npcs: [],
      active_threads: briefData.urgentThreads.map(t => ({
        title: t.title,
        status: t.priority || 'active',
      })),
      total_sessions: sessions.length,
      word_count: briefData.campaign.description?.split(/\s+/).length || 0,
      compression_ratio: null,
    } : null;

    const chronicle = {
      campaignId,
      campaignName: campaign.name,
      brief,
      arcs,
      sessions,
      lastUpdated: new Date().toISOString(),
    };

    console.log('[Chronicle API] Returning:', {
      sessions: sessions.length,
      arcs: arcs.length,
      hasBrief: !!brief,
    });

    return NextResponse.json(chronicle);
  } catch (error) {
    console.error('Chronicle fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
