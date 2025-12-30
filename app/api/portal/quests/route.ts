import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch tracked quests with full quest data
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const status = searchParams.get('status'); // 'active' | 'completed' | 'all'

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  let query = supabase
    .from('player_quest_tracking')
    .select(`
      *,
      quest:entities!quest_id (
        id,
        name,
        sub_type,
        description,
        soul,
        mechanics,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Track a new quest
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { campaignId, questId } = body;

  if (!campaignId || !questId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('player_quest_tracking')
    .insert({
      campaign_id: campaignId,
      user_id: user.id,
      quest_id: questId,
      status: 'active',
    })
    .select(`
      *,
      quest:entities!quest_id (
        id,
        name,
        sub_type,
        description
      )
    `)
    .single();

  if (error) {
    // Handle unique constraint violation (already tracking)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already tracking this quest' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH - Update quest tracking (status, notes)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, personalNotes } = body;

  if (!id) {
    return NextResponse.json({ error: 'Tracking ID required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (personalNotes !== undefined) updates.personal_notes = personalNotes;

  const { data, error } = await supabase
    .from('player_quest_tracking')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
