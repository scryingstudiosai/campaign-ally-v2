import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { campaignId, channel } = body;

  if (!campaignId || !channel) {
    return NextResponse.json({ error: 'Missing campaignId or channel' }, { status: 400 });
  }

  try {
    // Check if user is DM
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .single();

    const isDM = campaign?.user_id === user.id;

    if (channel === 'party') {
      // For party messages, mark all messages not from this user as read
      // Each user tracks their own read status, but we update globally
      // In a more complex system, we'd use a separate read_receipts table
      // For now, we'll mark messages as read for the recipient
      const { error } = await supabase
        .from('portal_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('channel', 'party')
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (error) throw error;
    } else if (channel === 'dm_private') {
      if (isDM) {
        // DM marking player messages as read
        const { error } = await supabase
          .from('portal_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('campaign_id', campaignId)
          .eq('channel', 'dm_private')
          .eq('is_read', false)
          .eq('sender_type', 'player');

        if (error) throw error;
      } else {
        // Player marking DM messages as read
        const { error } = await supabase
          .from('portal_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('campaign_id', campaignId)
          .eq('channel', 'dm_private')
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Mark messages read error:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark messages as read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
