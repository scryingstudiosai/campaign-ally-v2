import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions?campaignId=X
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('session_number', { ascending: false });

  if (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/sessions
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { campaign_id, name, starting_location_id } = body;

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get next session number
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('session_number')
    .eq('campaign_id', campaign_id)
    .order('session_number', { ascending: false })
    .limit(1);

  const nextNumber = (existingSessions?.[0]?.session_number || 0) + 1;
  const sessionName = name || `Session ${nextNumber}`;

  // Get active quests for snapshot
  const { data: activeQuests } = await supabase
    .from('entities')
    .select('id')
    .eq('campaign_id', campaign_id)
    .eq('entity_type', 'quest')
    .eq('status', 'active');

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      campaign_id,
      name: sessionName,
      session_number: nextNumber,
      status: 'planning',
      starting_location_id,
      active_quest_ids: activeQuests?.map(q => q.id) || [],
      prep_content: { type: 'doc', content: [] },
      live_log: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
