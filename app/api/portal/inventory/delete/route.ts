import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, characterId, campaignId } = await request.json();

    if (!itemId || !characterId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, characterId, campaignId' },
        { status: 400 }
      );
    }

    // Verify user owns this character
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.character_entity_id !== characterId) {
      return NextResponse.json(
        { error: 'You can only delete items from your own inventory' },
        { status: 403 }
      );
    }

    // Verify the item belongs to this character
    const { data: item } = await supabase
      .from('inventory_instances')
      .select('id, owner_id, owner_type')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.owner_id !== characterId || item.owner_type !== 'player') {
      return NextResponse.json(
        { error: 'This item does not belong to your character' },
        { status: 403 }
      );
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('inventory_instances')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
