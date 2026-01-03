import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InventoryView } from '@/components/portal/InventoryView';
import type { InventoryItemData, StashItemData } from '@/components/portal/InventoryView';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

interface InventoryPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Get Character Link
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!membership?.character_entity_id) {
    redirect(`/portal/${campaignId}`);
  }

  // 3. Fetch character entity to get gold from soul
  const { data: character } = await supabase
    .from('entities')
    .select('soul')
    .eq('id', membership.character_entity_id)
    .single();

  // Get gold from soul.gold (primary) or soul.loadout.gold (fallback)
  const soul = character?.soul as Record<string, unknown> | null;
  const characterGold = (soul?.gold as number) ?? (soul?.loadout as Record<string, unknown>)?.gold as number ?? 0;

  // 4. Fetch ALL items from inventory_instances table
  // Items are inserted here during character creation and when added later
  const { data: inventoryItems } = await supabase
    .from('inventory_instances')
    .select(`
      id,
      quantity,
      charges,
      max_charges,
      is_equipped,
      is_attuned,
      is_identified,
      notes,
      acquired_from,
      srd_item:srd_items!srd_item_id (
        id, name, item_type, subtype, rarity,
        description, mechanics, value_gp, weight,
        requires_attunement
      ),
      custom_item:entities!custom_entity_id (
        id, name, sub_type, description, mechanics, image_url
      )
    `)
    .eq('owner_id', membership.character_entity_id)
    .eq('owner_type', 'player')
    .order('is_equipped', { ascending: false })
    .order('sort_order', { ascending: true, nullsFirst: false });

  // Normalize inventory items (handle array vs single object from Supabase)
  const normalizedInventoryItems: InventoryItemData[] = (inventoryItems || []).map(item => ({
    ...item,
    srd_item: Array.isArray(item.srd_item) ? item.srd_item[0] || null : item.srd_item,
    custom_item: Array.isArray(item.custom_item) ? item.custom_item[0] || null : item.custom_item,
  }));

  // 5. Fetch Party Stash
  const { data: partyStash } = await supabase
    .from('inventory_instances')
    .select(`
      id, quantity, custom_name,
      srd_item:srd_items!srd_item_id (id, name, item_type, rarity),
      custom_item:entities!custom_entity_id (id, name, image_url)
    `)
    .eq('campaign_id', campaignId)
    .eq('owner_type', 'party');

  // Normalize stash items
  const normalizedStash: StashItemData[] = (partyStash || []).map(item => ({
    ...item,
    custom_name: item.custom_name || null,
    srd_item: Array.isArray(item.srd_item) ? item.srd_item[0] || null : item.srd_item,
    custom_item: Array.isArray(item.custom_item) ? item.custom_item[0] || null : item.custom_item,
  }));

  // 6. Get currency from character's soul.gold
  const currency = {
    gold: characterGold,
    silver: 0,
    copper: 0,
  };

  // Use all items for display (no longer filtering out gold since it's in soul)
  const displayItems = normalizedInventoryItems;

  return (
    <InventoryView
      items={displayItems}
      partyStash={normalizedStash}
      currency={currency}
      characterId={membership.character_entity_id}
      campaignId={campaignId}
    />
  );
}
