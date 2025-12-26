import { createClient } from '@/lib/supabase/server';
import { findSrdItemByName } from '@/lib/srd/item-lookup';
import { getItemPrice } from '@/lib/inventory/price-utils';

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

  // 2. Stock SRD ITEMS using direct name lookup (most reliable)
  const itemsToStock = inventoryData.suggested_srd_stock || [];

  if (itemsToStock.length === 0) {
    console.log('[ShopStocker] No items to stock');
    return results;
  }

  // Shuffle the item list and select a reasonable number
  const shuffled = [...itemsToStock].sort(() => Math.random() - 0.5);
  const itemCount = Math.min(8, shuffled.length); // Stock 8 items max
  const selectedNames = shuffled.slice(0, itemCount * 2); // Get extras in case some aren't found

  console.log(`[ShopStocker] Stocking ${inventoryData.shop_type} shop`);
  console.log(`[ShopStocker] Looking for items:`, selectedNames.slice(0, 10));

  // Do a bulk lookup using exact name matching
  const { data: srdItems, error: srdError } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .in('name', selectedNames);

  if (srdError) {
    console.error('[ShopStocker] SRD query error:', srdError);
    results.errors.push(`SRD query failed: ${srdError.message}`);
    return results;
  }

  console.log(`[ShopStocker] Found ${srdItems?.length || 0} exact matches:`,
    srdItems?.map(i => i.name).slice(0, 10));

  // If no exact matches, try fuzzy matching for missing items
  const foundItems = srdItems || [];
  const foundNames = new Set(foundItems.map(i => i.name.toLowerCase()));
  const missingNames = selectedNames.filter(name =>
    !foundNames.has(name.toLowerCase())
  ).slice(0, 5); // Only try fuzzy for first 5 missing

  if (missingNames.length > 0 && foundItems.length < itemCount) {
    console.log('[ShopStocker] Trying fuzzy match for:', missingNames);

    for (const name of missingNames) {
      const srdItem = await findSrdItemByName(name, { excludeRare: true });
      if (srdItem && !foundNames.has(srdItem.name.toLowerCase())) {
        foundItems.push(srdItem);
        foundNames.add(srdItem.name.toLowerCase());
        console.log(`[ShopStocker] Fuzzy found: ${srdItem.name}`);
      }
    }
  }

  // Stock the found items (limit to itemCount)
  const finalItems = foundItems.slice(0, itemCount);

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
