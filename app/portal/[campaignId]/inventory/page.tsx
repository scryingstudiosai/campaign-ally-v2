import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InventoryView } from '@/components/portal/InventoryView';

interface InventoryPageProps {
  params: Promise<{ campaignId: string }>;
}

interface CharacterMechanics {
  currency?: {
    gold?: number;
    silver?: number;
    copper?: number;
  };
  gold?: number;
  silver?: number;
  copper?: number;
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

  // 3. Fetch Inventory with correct joins
  const { data: inventoryItems, error } = await supabase
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
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Inventory fetch error:', error);
  }

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

  // 5. Fetch Character for currency
  const { data: character } = await supabase
    .from('entities')
    .select('mechanics')
    .eq('id', membership.character_entity_id)
    .single();

  const mechanics = (character?.mechanics || {}) as CharacterMechanics;
  const currency = mechanics.currency || {
    gold: mechanics.gold || 0,
    silver: mechanics.silver || 0,
    copper: mechanics.copper || 0,
  };

  return (
    <InventoryView
      items={inventoryItems || []}
      partyStash={partyStash || []}
      currency={currency}
      characterId={membership.character_entity_id}
      campaignId={campaignId}
    />
  );
}
