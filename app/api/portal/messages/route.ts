import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { campaignId, channel, content, recipientId } = body;

  if (!campaignId || !channel || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Check if user is DM
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, user_id')
    .eq('id', campaignId)
    .single();

  const isDM = campaign?.user_id === user.id;

  // Get sender name
  let senderName = 'Unknown';
  let senderType: 'dm' | 'player' = 'player';

  if (isDM) {
    senderName = 'Dungeon Master';
    senderType = 'dm';
  } else {
    // Get character name
    const { data: membership } = await supabase
      .from('campaign_members')
      .select(`
        character_entity_id,
        character:entities!character_entity_id (name)
      `)
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    const character = membership?.character as { name: string } | null;
    senderName = character?.name || 'Unknown Adventurer';
  }

  // Insert message
  // DM's own messages are always marked as read (they don't need to "see" their own messages)
  const { data: message, error } = await supabase
    .from('portal_messages')
    .insert({
      campaign_id: campaignId,
      sender_id: user.id,
      sender_name: senderName,
      sender_type: senderType,
      channel,
      recipient_id: channel === 'dm_private' ? recipientId : null,
      content,
      is_read: isDM,
      read_at: isDM ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    console.error('Message insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create DM notification if message is from a player
  if (!isDM && message) {
    // Get character entity ID for the notification
    const { data: membershipData } = await supabase
      .from('campaign_members')
      .select('character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    const messagePreview = content.length > 80 ? content.substring(0, 80) + '...' : content;

    await supabase.from('dm_notifications').insert({
      campaign_id: campaignId,
      type: 'player_message',
      title: `Message from ${senderName}`,
      message: messagePreview,
      source_user_id: user.id,
      source_entity_id: membershipData?.character_entity_id || null,
      reference_id: message.id,
    });
  }

  return NextResponse.json({ message });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const channel = searchParams.get('channel');

  if (!campaignId || !channel) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  let query = supabase
    .from('portal_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(50);

  // For DM channel, filter to only messages involving this user
  if (channel === 'dm_private') {
    query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}
