import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const type = searchParams.get('type');

    // Handle player_message type - query portal_messages table
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

        // Only count PRIVATE messages FROM players TO the DM
        const { count, error } = await supabase
          .from('portal_messages')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('is_read', false)
          .eq('sender_type', 'player')
          .eq('channel', 'dm_private');

        if (error) throw error;

        return NextResponse.json({ count: count || 0 });
      } else {
        // Get count for all campaigns owned by this user
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id)
          .is('deleted_at', null);

        if (!campaigns || campaigns.length === 0) {
          return NextResponse.json({ count: 0 });
        }

        const campaignIds = campaigns.map(c => c.id);

        // Only count PRIVATE messages FROM players TO the DM
        const { count, error } = await supabase
          .from('portal_messages')
          .select('id', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
          .eq('is_read', false)
          .eq('sender_type', 'player')
          .eq('channel', 'dm_private');

        if (error) throw error;

        return NextResponse.json({ count: count || 0 });
      }
    }

    // Default: query dm_notifications table
    if (campaignId) {
      // Get count for specific campaign
      // First verify user owns this campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      const { count, error } = await supabase
        .from('dm_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ count: count || 0 });
    } else {
      // Get count for all campaigns owned by this user
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (!campaigns || campaigns.length === 0) {
        return NextResponse.json({ count: 0 });
      }

      const campaignIds = campaigns.map(c => c.id);

      const { count, error } = await supabase
        .from('dm_notifications')
        .select('id', { count: 'exact', head: true })
        .in('campaign_id', campaignIds)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ count: count || 0 });
    }
  } catch (error: unknown) {
    // If the table doesn't exist yet, return 0 gracefully
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({ count: 0 });
    }
    console.error('Get unread count error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get unread count';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
