import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds, campaignId, markAll, type, senderId } = await req.json();

    // Handle player_message type - update portal_messages table
    if (type === 'player_message') {
      if (campaignId) {
        // Verify user owns this campaign
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('id')
          .eq('id', campaignId)
          .eq('user_id', user.id)
          .single();

        if (!campaign) {
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Build query to mark PRIVATE messages FROM players as read
        let query = supabase
          .from('portal_messages')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .eq('is_read', false)
          .eq('sender_type', 'player')
          .eq('channel', 'dm_private');

        // If senderId provided, only mark that player's messages
        if (senderId) {
          // The senderId might be an entity_id (character) instead of user_id
          // Check if it's an entity_id and convert to user_id if needed
          let actualSenderId = senderId;

          const { data: membership } = await supabase
            .from('campaign_members')
            .select('user_id')
            .eq('character_entity_id', senderId)
            .eq('campaign_id', campaignId)
            .single();

          if (membership) {
            // senderId was an entity_id, use the user_id instead
            actualSenderId = membership.user_id;
          }
          // If no membership found, assume senderId is already a user_id

          query = query.eq('sender_id', actualSenderId);
        }

        const { error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true });
      } else if (notificationIds?.length) {
        // Mark specific messages as read
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id);

        if (!campaigns || campaigns.length === 0) {
          return NextResponse.json({ error: 'No campaigns found' }, { status: 404 });
        }

        const campaignIds = campaigns.map(c => c.id);

        const { error } = await supabase
          .from('portal_messages')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .in('id', notificationIds)
          .in('campaign_id', campaignIds);

        if (error) throw error;

        return NextResponse.json({ success: true });
      }
    }

    // Default: update dm_notifications table
    if (markAll && campaignId) {
      // Verify user owns this campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      // Mark all notifications for this campaign as read
      let query = supabase
        .from('dm_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('is_read', false);

      // Optionally filter by type
      if (type) {
        query = query.eq('type', type);
      }

      const { error } = await query;

      if (error) throw error;
    } else if (notificationIds?.length) {
      // Mark specific notifications as read
      // First verify these belong to user's campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      if (!campaigns || campaigns.length === 0) {
        return NextResponse.json({ error: 'No campaigns found' }, { status: 404 });
      }

      const campaignIds = campaigns.map(c => c.id);

      const { error } = await supabase
        .from('dm_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', notificationIds)
        .in('campaign_id', campaignIds);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Must provide notificationIds or campaignId with markAll' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Mark read error:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark as read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
