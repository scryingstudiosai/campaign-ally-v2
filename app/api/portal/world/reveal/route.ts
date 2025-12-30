import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - DM reveals an entity to players
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { campaignId, entityId, playerIds } = body; // playerIds is array, or null for all

  if (!campaignId || !entityId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify user is DM of this campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get target players
  let targetPlayerIds = playerIds;
  if (!targetPlayerIds || targetPlayerIds.length === 0) {
    // Reveal to all players in campaign
    const { data: members } = await supabase
      .from('campaign_members')
      .select('user_id')
      .eq('campaign_id', campaignId);

    targetPlayerIds = members?.map(m => m.user_id) || [];
  }

  if (targetPlayerIds.length === 0) {
    return NextResponse.json({ error: 'No players in campaign' }, { status: 400 });
  }

  // Create discoveries for each player (ignore duplicates)
  const discoveries = targetPlayerIds.map((userId: string) => ({
    campaign_id: campaignId,
    user_id: userId,
    entity_id: entityId,
  }));

  const { data, error } = await supabase
    .from('player_discoveries')
    .upsert(discoveries, {
      onConflict: 'user_id,entity_id',
      ignoreDuplicates: true
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ revealed: data?.length || 0 });
}
