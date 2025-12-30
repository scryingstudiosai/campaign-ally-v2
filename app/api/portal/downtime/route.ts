import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch player's downtime logs
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const status = searchParams.get('status'); // 'pending', 'resolved', 'all'

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  let query = supabase
    .from('downtime_logs')
    .select(`
      *,
      character:entities!character_id (
        id,
        name,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Submit a new downtime activity
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { campaignId, characterId, activityType, activityTarget, notes, daysSpent, goldSpent } = body;

  if (!campaignId || !characterId || !activityType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify user owns this character in this campaign
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.character_entity_id !== characterId) {
    return NextResponse.json({ error: 'Not your character' }, { status: 403 });
  }

  // Check if player already has a pending activity
  const { data: existing } = await supabase
    .from('downtime_logs')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'You already have a pending activity' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('downtime_logs')
    .insert({
      campaign_id: campaignId,
      character_id: characterId,
      user_id: user.id,
      activity_type: activityType,
      activity_target: activityTarget,
      notes,
      days_spent: daysSpent || 1,
      gold_spent: goldSpent || 0,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH - Cancel a pending activity
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, action } = body;

  if (!id) {
    return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
  }

  if (action === 'cancel') {
    const { data, error } = await supabase
      .from('downtime_logs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
