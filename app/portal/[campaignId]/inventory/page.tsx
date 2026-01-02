import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InventoryView } from '@/components/portal/InventoryView';
import type { InventoryItemData, StashItemData } from '@/components/portal/InventoryView';

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

  // 3. Fetch ALL items from inventory_instances table
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

  // 4. Fetch Party Stash
  const { data: partyStash } = await supabase
    .from('inventory_instances')
    .select(`
      id, quantity,
      srd_item:srd_items!srd_item_id (id, name, item_type, rarity),
      custom_item:entities!custom_entity_id (id, name, image_url)
    `)
    .eq('campaign_id', campaignId)
    .eq('owner_type', 'party');

  // Normalize stash items
  const normalizedStash: StashItemData[] = (partyStash || []).map(item => ({
    ...item,
    srd_item: Array.isArray(item.srd_item) ? item.srd_item[0] || null : item.srd_item,
    custom_item: Array.isArray(item.custom_item) ? item.custom_item[0] || null : item.custom_item,
  }));

  // 5. Get currency - check for gold item in inventory
  const goldItem = normalizedInventoryItems.find(item =>
    item.srd_item?.name?.toLowerCase() === 'gold pieces' ||
    item.custom_item?.name?.toLowerCase() === 'gold pieces'
  );

  const currency = {
    gold: goldItem?.quantity || 0,
    silver: 0,
    copper: 0,
  };

  // Filter out gold from regular items display
  const displayItems = normalizedInventoryItems.filter(item =>
    item.srd_item?.name?.toLowerCase() !== 'gold pieces' &&
    item.custom_item?.name?.toLowerCase() !== 'gold pieces'
  );

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
