import { createClient } from '@/lib/supabase/server';
import { findSrdItemByName } from '@/lib/srd/item-lookup';

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

  // 2. Stock SRD ITEMS
  for (const itemName of inventoryData.suggested_srd_stock || []) {
    try {
      const srdItem = await findSrdItemByName(itemName);

      if (!srdItem) {
        results.errors.push(`SRD item not found: ${itemName}`);
        continue;
      }

      // Determine quantity based on rarity/type
      const isCommonConsumable = ['potion', 'ammunition', 'rations', 'torch', 'oil', 'arrow', 'bolt'].some(
        (t) =>
          srdItem.item_type?.toLowerCase().includes(t) || itemName.toLowerCase().includes(t)
      );
      const quantity = isCommonConsumable ? randomInt(5, 15) : randomInt(1, 3);

      // Calculate shop price
      const basePrice = srdItem.value_gp || 0;
      const finalPrice = basePrice > 0 ? Math.ceil(basePrice * priceMultiplier) : null;

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
          results.errors.push(`Failed to add ${itemName}: ${invError.message}`);
        } else {
          results.srdItems++;
        }
      }
    } catch (err) {
      results.errors.push(`Error processing ${itemName}: ${String(err)}`);
    }
  }

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
