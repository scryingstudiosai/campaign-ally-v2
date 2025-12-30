import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - DM resolves a downtime activity
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { logId, resultSummary, resultRewards } = body;

  if (!logId || !resultSummary) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get the log and verify DM owns the campaign
  const { data: log } = await supabase
    .from('downtime_logs')
    .select(`
      id,
      campaign_id,
      campaign:campaigns!campaign_id (
        user_id
      )
    `)
    .eq('id', logId)
    .single();

  const campaign = log?.campaign as { user_id: string } | null;
  if (!log || campaign?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('downtime_logs')
    .update({
      status: 'resolved',
      result_summary: resultSummary,
      result_rewards: resultRewards || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
