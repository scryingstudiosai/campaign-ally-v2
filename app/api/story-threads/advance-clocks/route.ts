import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Advance all clocks of a specific type for a campaign
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, clockType = 'sessions', amount = 1 } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all active threads with matching clock type
    const { data: threads } = await supabase
      .from('story_threads')
      .select('id, title, clock_current, clock_max, consequence_if_ignored')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .eq('clock_type', clockType);

    if (!threads?.length) {
      return NextResponse.json({
        message: 'No active clocks to advance',
        advanced: 0,
        triggered: [],
        warnings: [],
      });
    }

    const triggered: Array<{ id: string; title: string; message: string }> = [];
    const warnings: Array<{ id: string; title: string; message: string; percentage: number }> = [];
    let advanced = 0;

    for (const thread of threads) {
      const newCurrent = Math.min((thread.clock_current || 0) + amount, thread.clock_max || 999);

      await supabase.from('story_threads').update({ clock_current: newCurrent }).eq('id', thread.id);

      advanced++;

      const percentage = thread.clock_max ? Math.round((newCurrent / thread.clock_max) * 100) : 0;

      // Check if clock is now full
      if (thread.clock_max && newCurrent >= thread.clock_max) {
        triggered.push({
          id: thread.id,
          title: thread.title,
          message: thread.consequence_if_ignored || 'Clock full! Consequence triggered.',
        });
      } else if (thread.clock_max && newCurrent >= thread.clock_max * 0.75) {
        warnings.push({
          id: thread.id,
          title: thread.title,
          message: `Clock at ${percentage}% - consequence imminent!`,
          percentage,
        });
      }
    }

    console.log(
      `[StoryThreads] Advanced ${advanced} clocks, ${triggered.length} triggered, ${warnings.length} warnings`
    );

    return NextResponse.json({
      message: `Advanced ${advanced} ${clockType} clocks`,
      advanced,
      triggered,
      warnings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
