import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InventoryView } from '@/components/portal/InventoryView';
import type { InventoryItemData, StashItemData } from '@/components/portal/InventoryView';

interface InventoryPageProps {
  params: Promise<{ campaignId: string }>;
}

interface Loadout {
  weapons?: string[];
  armor?: string | null;
  shield?: string | null;
  pack?: string | null;
  packContents?: string[];
  focus?: string | null;
  automaticItems?: string[];
  gold?: number;
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

  // 3. Fetch Character with soul.loadout for starting equipment
  const { data: character } = await supabase
    .from('entities')
    .select('id, soul, mechanics')
    .eq('id', membership.character_entity_id)
    .single();

  const soul = (character?.soul || {}) as Record<string, unknown>;
  const mechanics = (character?.mechanics || {}) as Record<string, unknown>;
  const loadout = (soul.loadout || {}) as Loadout;

  // 4. Build inventory from soul.loadout (starting equipment)
  const loadoutItems: InventoryItemData[] = [];
  let itemIndex = 0;

  // Weapons
  if (loadout.weapons?.length) {
    for (const weapon of loadout.weapons) {
      loadoutItems.push({
        id: `loadout-weapon-${itemIndex++}`,
        quantity: 1,
        charges: null,
        max_charges: null,
        is_equipped: true,
        is_attuned: false,
        is_identified: true,
        notes: null,
        acquired_from: 'Starting Equipment',
        srd_item: {
          id: `loadout-weapon-${itemIndex}`,
          name: weapon,
          item_type: 'weapon',
          subtype: null,
          rarity: 'common',
          description: null,
          mechanics: null,
          value_gp: null,
          weight: null,
          requires_attunement: false,
        },
        custom_item: null,
      });
    }
  }

  // Armor
  if (loadout.armor) {
    loadoutItems.push({
      id: `loadout-armor-${itemIndex++}`,
      quantity: 1,
      charges: null,
      max_charges: null,
      is_equipped: true,
      is_attuned: false,
      is_identified: true,
      notes: null,
      acquired_from: 'Starting Equipment',
      srd_item: {
        id: `loadout-armor-${itemIndex}`,
        name: loadout.armor,
        item_type: 'armor',
        subtype: null,
        rarity: 'common',
        description: null,
        mechanics: null,
        value_gp: null,
        weight: null,
        requires_attunement: false,
      },
      custom_item: null,
    });
  }

  // Shield
  if (loadout.shield) {
    loadoutItems.push({
      id: `loadout-shield-${itemIndex++}`,
      quantity: 1,
      charges: null,
      max_charges: null,
      is_equipped: true,
      is_attuned: false,
      is_identified: true,
      notes: null,
      acquired_from: 'Starting Equipment',
      srd_item: {
        id: `loadout-shield-${itemIndex}`,
        name: loadout.shield,
        item_type: 'armor',
        subtype: 'Shield',
        rarity: 'common',
        description: null,
        mechanics: null,
        value_gp: null,
        weight: null,
        requires_attunement: false,
      },
      custom_item: null,
    });
  }

  // Spellcasting Focus
  if (loadout.focus) {
    loadoutItems.push({
      id: `loadout-focus-${itemIndex++}`,
      quantity: 1,
      charges: null,
      max_charges: null,
      is_equipped: true,
      is_attuned: false,
      is_identified: true,
      notes: null,
      acquired_from: 'Starting Equipment',
      srd_item: {
        id: `loadout-focus-${itemIndex}`,
        name: loadout.focus,
        item_type: 'wondrous',
        subtype: 'Spellcasting Focus',
        rarity: 'common',
        description: null,
        mechanics: null,
        value_gp: null,
        weight: null,
        requires_attunement: false,
      },
      custom_item: null,
    });
  }

  // Automatic Items (Spellbook, etc.)
  if (loadout.automaticItems?.length) {
    for (const item of loadout.automaticItems) {
      loadoutItems.push({
        id: `loadout-auto-${itemIndex++}`,
        quantity: 1,
        charges: null,
        max_charges: null,
        is_equipped: false,
        is_attuned: false,
        is_identified: true,
        notes: null,
        acquired_from: 'Starting Equipment',
        srd_item: {
          id: `loadout-auto-${itemIndex}`,
          name: item,
          item_type: 'wondrous',
          subtype: null,
          rarity: 'common',
          description: null,
          mechanics: null,
          value_gp: null,
          weight: null,
          requires_attunement: false,
        },
        custom_item: null,
      });
    }
  }

  // Pack Contents - group duplicates
  if (loadout.packContents?.length) {
    const packCounts: Record<string, number> = {};
    for (const item of loadout.packContents) {
      packCounts[item] = (packCounts[item] || 0) + 1;
    }

    for (const [itemName, quantity] of Object.entries(packCounts)) {
      loadoutItems.push({
        id: `loadout-pack-${itemIndex++}`,
        quantity,
        charges: null,
        max_charges: null,
        is_equipped: false,
        is_attuned: false,
        is_identified: true,
        notes: loadout.pack ? `From ${loadout.pack}` : null,
        acquired_from: 'Starting Equipment',
        srd_item: {
          id: `loadout-pack-${itemIndex}`,
          name: itemName,
          item_type: 'adventuring-gear',
          subtype: null,
          rarity: 'common',
          description: null,
          mechanics: null,
          value_gp: null,
          weight: null,
          requires_attunement: false,
        },
        custom_item: null,
      });
    }
  }

  // 5. Also fetch from inventory_instances table (for DM-added or found items)
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
    .order('sort_order', { ascending: true, nullsFirst: false });

  // Normalize inventory items (handle array vs single object from Supabase)
  const normalizedInventoryItems: InventoryItemData[] = (inventoryItems || []).map(item => ({
    ...item,
    srd_item: Array.isArray(item.srd_item) ? item.srd_item[0] || null : item.srd_item,
    custom_item: Array.isArray(item.custom_item) ? item.custom_item[0] || null : item.custom_item,
  }));

  // Combine loadout items with inventory items
  const allItems = [...loadoutItems, ...normalizedInventoryItems];

  // 6. Fetch Party Stash
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

  // 7. Get currency from loadout or mechanics
  const currency = {
    gold: loadout.gold || (mechanics.gold as number) || 0,
    silver: (mechanics.silver as number) || 0,
    copper: (mechanics.copper as number) || 0,
  };

  return (
    <InventoryView
      items={allItems}
      partyStash={normalizedStash}
      currency={currency}
      characterId={membership.character_entity_id}
      campaignId={campaignId}
    />
  );
}
