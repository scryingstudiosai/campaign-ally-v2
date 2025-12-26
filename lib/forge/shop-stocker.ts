import { createClient } from '@/lib/supabase/server';
import { getItemPrice } from '@/lib/inventory/price-utils';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ShopSpecialItem {
  name: string;
  description: string;
  item_type: string;
  rarity: string;
  base_price_gp: number;
  mechanics?: Record<string, unknown>;
}

export interface ShopInventoryData {
  shop_type: string;
  specialty?: string;
  price_modifier: number;
  suggested_srd_stock: string[];
  special_items?: ShopSpecialItem[];
}

export interface StockingResult {
  specialItems: number;
  srdItems: number;
  errors: string[];
}

// Search terms for each shop type - these will be used with ILIKE
const SHOP_SEARCH_TERMS: Record<string, string[]> = {
  general: [
    'rope', 'torch', 'lantern', 'ration', 'waterskin',
    'backpack', 'bedroll', 'blanket', 'candle', 'crowbar',
    'flask', 'piton', 'pole', 'pot', 'pouch',
    'sack', 'shovel', 'tent', 'tinderbox', 'vial',
    'caltrops', 'ball bearing', 'grappling', 'chain',
    'antitoxin', 'oil', 'mirror', 'lock', 'manacle',
    'healer', 'kit', 'tools', 'ink', 'chalk', 'whistle',
    'ladder', 'mess kit', 'spyglass', 'hunting trap',
  ],
  weapons: [
    'sword', 'axe', 'mace', 'dagger', 'spear',
    'bow', 'crossbow', 'staff', 'club', 'flail',
    'rapier', 'scimitar', 'javelin', 'sling', 'arrow', 'bolt',
    'halberd', 'pike', 'trident', 'morningstar', 'whip',
  ],
  armor: [
    'armor', 'mail', 'plate', 'leather', 'hide',
    'shield', 'breastplate', 'padded', 'studded', 'scale',
  ],
  potions: [
    'potion', 'antitoxin', 'holy water', 'alchemist',
    'acid', 'healer', 'herbalism',
  ],
  magic: [
    'potion', 'scroll', 'wand', 'rod', 'staff',
    'ring', 'amulet', 'cloak', 'boots',
  ],
};

interface SrdItem {
  id: string;
  name: string;
  item_type: string;
  rarity: string | null;
  value_gp: number | null;
  weight: number | null;
}

/**
 * Find items for a shop using ILIKE pattern matching
 */
async function findItemsForShopType(
  supabase: SupabaseClient,
  shopType: string,
  count: number
): Promise<SrdItem[]> {
  const searchTerms = SHOP_SEARCH_TERMS[shopType] || SHOP_SEARCH_TERMS.general;
  const allItems: SrdItem[] = [];
  const seenIds = new Set<string>();

  console.log(`[ShopStocker] Searching for ${shopType} items with terms:`, searchTerms.slice(0, 10));

  // Search for each term
  for (const term of searchTerms) {
    if (allItems.length >= count * 3) break; // Get extras to randomize

    const { data, error } = await supabase
      .from('srd_items')
      .select('id, name, item_type, rarity, value_gp, weight')
      .ilike('name', `%${term}%`)
      .limit(5);

    if (error) {
      console.error(`[ShopStocker] Error searching for "${term}":`, error);
      continue;
    }

    if (data && data.length > 0) {
      // Filter out rare+ items and magic items for non-magic shops
      const filtered = data.filter((item: SrdItem) => {
        // Skip duplicates
        if (seenIds.has(item.id)) return false;

        // Skip rare+ items unless magic shop
        const rarity = (item.rarity || '').toLowerCase();
        if (shopType !== 'magic') {
          if (rarity.includes('rare') || rarity.includes('legendary') || rarity.includes('artifact')) {
            return false;
          }
        }

        // Skip magic item indicators for non-magic shops
        if (shopType !== 'magic') {
          const name = item.name.toLowerCase();
          if (name.includes('+1') || name.includes('+2') || name.includes('+3')) {
            return false;
          }
          if (name.includes(' of ') && !name.includes('bag of') && !name.includes('ball of')) {
            return false;
          }
        }

        return true;
      });

      for (const item of filtered) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }
  }

  console.log(`[ShopStocker] Found ${allItems.length} candidate items`);

  if (allItems.length === 0) {
    // Diagnostic query - what's in the SRD?
    const { data: sampleItems } = await supabase
      .from('srd_items')
      .select('name, item_type')
      .limit(10);

    console.log('[ShopStocker] Sample SRD items:', sampleItems?.map(i => i.name));
  }

  // Shuffle and return requested count
  const shuffled = allItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Stock a shop location with inventory items
 */
export async function stockShopInventory(
  campaignId: string,
  locationId: string,
  inventoryData: ShopInventoryData
): Promise<StockingResult> {
  const supabase = await createClient();
  const priceMultiplier = inventoryData.price_modifier || 1.0;
  const results: StockingResult = { specialItems: 0, srdItems: 0, errors: [] };

  // 1. Create and stock SPECIAL ITEMS (AI-generated unique items)
  for (const specialItem of inventoryData.special_items || []) {
    try {
      // Create the custom item entity
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .insert({
          campaign_id: campaignId,
          name: specialItem.name,
          entity_type: 'item',
          sub_type: specialItem.item_type,
          description: specialItem.description,
          source_forge: 'location',
          forge_status: 'complete',
          status: 'active',
          mechanics: {
            rarity: specialItem.rarity,
            base_price_gp: specialItem.base_price_gp,
            ...specialItem.mechanics,
          },
          soul: {
            origin: `Shop special from ${inventoryData.shop_type}`,
            rarity: specialItem.rarity,
          },
        })
        .select('id')
        .single();

      if (entityError) {
        results.errors.push(`Failed to create ${specialItem.name}: ${entityError.message}`);
        continue;
      }

      // Add to inventory with price markup
      const finalPrice = Math.ceil(specialItem.base_price_gp * priceMultiplier);

      const { error: invError } = await supabase
        .from('inventory_instances')
        .insert({
          campaign_id: campaignId,
          custom_entity_id: entity.id,
          owner_type: 'location',
          owner_id: locationId,
          quantity: 1,
          value_override: finalPrice,
          acquired_from: 'Shop Special Stock',
          notes: inventoryData.specialty
            ? `Part of shop specialty: ${inventoryData.specialty}`
            : null,
        });

      if (invError) {
        results.errors.push(`Failed to add ${specialItem.name} to inventory: ${invError.message}`);
      } else {
        results.specialItems++;
      }
    } catch (err) {
      results.errors.push(`Error processing ${specialItem.name}: ${String(err)}`);
    }
  }

  // 2. Stock SRD ITEMS using ILIKE pattern matching (most reliable)
  const shopType = inventoryData.shop_type.toLowerCase();
  const itemCount = 8; // Stock up to 8 items

  console.log(`[ShopStocker] Stocking ${shopType} shop using pattern matching`);

  // Find items using ILIKE pattern matching
  const foundItems = await findItemsForShopType(supabase, shopType, itemCount);

  if (foundItems.length === 0) {
    console.log('[ShopStocker] No items found via pattern matching');
    results.errors.push(`No items found for shop type: ${shopType}`);
    return results;
  }

  console.log(`[ShopStocker] Found ${foundItems.length} items:`,
    foundItems.map(i => i.name));

  // Stock the found items
  const finalItems = foundItems;

  for (const srdItem of finalItems) {
    try {
      console.log(`[ShopStocker] Adding item: ${srdItem.name} (${srdItem.rarity || 'mundane'})`);

      // Determine quantity based on item type
      const isCommonConsumable = ['potion', 'ammunition', 'rations', 'torch', 'oil', 'arrow', 'bolt', 'vial'].some(
        (t) => srdItem.name?.toLowerCase().includes(t) || srdItem.item_type?.toLowerCase().includes(t)
      );
      const quantity = isCommonConsumable ? randomInt(5, 15) : randomInt(1, 3);

      // Calculate shop price using price utility (handles fallbacks for items without prices)
      const finalPrice = getItemPrice(
        srdItem.name,
        srdItem.value_gp,
        srdItem.rarity,
        srdItem.item_type,
        priceMultiplier
      );

      // Check if item already exists in this shop's inventory
      const { data: existing } = await supabase
        .from('inventory_instances')
        .select('id, quantity')
        .eq('srd_item_id', srdItem.id)
        .eq('owner_type', 'location')
        .eq('owner_id', locationId)
        .single();

      if (existing) {
        // Update quantity
        await supabase
          .from('inventory_instances')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
        results.srdItems++;
      } else {
        // Create new inventory entry
        const { error: invError } = await supabase
          .from('inventory_instances')
          .insert({
            campaign_id: campaignId,
            srd_item_id: srdItem.id,
            owner_type: 'location',
            owner_id: locationId,
            quantity,
            value_override: finalPrice,
            acquired_from: 'Shop Stock',
          });

        if (invError) {
          results.errors.push(`Failed to add ${srdItem.name}: ${invError.message}`);
        } else {
          results.srdItems++;
        }
      }
    } catch (err) {
      results.errors.push(`Error processing ${srdItem.name}: ${String(err)}`);
    }
  }

  console.log(`[ShopStocker] Successfully stocked ${results.srdItems} items`);

  return results;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mark a location as a shop in its mechanics
 */
export async function markLocationAsShop(
  locationId: string,
  shopType: string,
  priceModifier: number = 1.0,
  specialty?: string
): Promise<void> {
  const supabase = await createClient();

  const { data: location } = await supabase
    .from('entities')
    .select('mechanics')
    .eq('id', locationId)
    .single();

  const existingMechanics = (location?.mechanics as Record<string, unknown>) || {};

  await supabase
    .from('entities')
    .update({
      mechanics: {
        ...existingMechanics,
        is_shop: true,
        shop_type: shopType,
        price_modifier: priceModifier,
        specialty: specialty || null,
      },
    })
    .eq('id', locationId);
}
