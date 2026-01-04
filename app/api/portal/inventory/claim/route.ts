import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId, characterId, campaignId } = await request.json();

  if (!itemId || !characterId || !campaignId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify user owns this character
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .eq('character_entity_id', characterId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not your character' }, { status: 403 });
  }

  // Verify item is in party stash
  const { data: item } = await supabase
    .from('inventory_instances')
    .select('*')
    .eq('id', itemId)
    .eq('campaign_id', campaignId)
    .eq('owner_type', 'party')
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Item not available' }, { status: 404 });
  }

  // Claim the item
  const { error } = await supabase
    .from('inventory_instances')
    .update({
      owner_type: 'player',
      owner_id: characterId,
      acquired_from: 'Claimed from Party Stash',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get character name for the log
  const { data: character } = await supabase
    .from('entities')
    .select('name')
    .eq('id', characterId)
    .single();

  // Get item name
  const { data: fullItem } = await supabase
    .from('inventory_instances')
    .select(`
      srd_item:srd_items!srd_item_id (name),
      custom_item:entities!custom_entity_id (name)
    `)
    .eq('id', itemId)
    .single();

  const srdItem = fullItem?.srd_item as { name: string } | null;
  const customItem = fullItem?.custom_item as { name: string } | null;
  const itemName = srdItem?.name || customItem?.name || 'an item';

  return NextResponse.json({
    success: true,
    message: `${character?.name || 'Someone'} claimed ${itemName}`
  });
}
