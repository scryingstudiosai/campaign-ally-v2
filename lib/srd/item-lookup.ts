import { createClient } from '@/lib/supabase/server';

export interface SrdItemBasic {
  id: string;
  name: string;
  item_type: string;
  rarity: string | null;
  value_gp: number | null;
  weight: number | null;
}

/**
 * Find an SRD item by name (case-insensitive)
 */
export async function findSrdItemByName(name: string): Promise<SrdItemBasic | null> {
  const supabase = await createClient();

  // Try exact match first (case-insensitive)
  const { data: exactMatch } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', name)
    .limit(1)
    .single();

  if (exactMatch) return exactMatch;

  // Try fuzzy match (contains)
  const { data: fuzzyMatch } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  return fuzzyMatch || null;
}

/**
 * Get default SRD items for a shop type
 */
export function getSrdItemsForShopType(shopType: string): string[] {
  const normalizedType = shopType.toLowerCase();

  const shopInventories: Record<string, string[]> = {
    blacksmith: [
      'Longsword', 'Shortsword', 'Dagger', 'Handaxe', 'Greataxe',
      'Chain Mail', 'Scale Mail', 'Shield', 'Warhammer', 'Mace'
    ],
    weaponsmith: [
      'Longsword', 'Greatsword', 'Rapier', 'Scimitar', 'Shortbow',
      'Longbow', 'Crossbow, Light', 'Crossbow, Heavy', 'Javelin', 'Spear'
    ],
    armorer: [
      'Chain Mail', 'Scale Mail', 'Plate', 'Leather', 'Studded Leather',
      'Shield', 'Half Plate', 'Breastplate', 'Ring Mail', 'Hide'
    ],
    apothecary: [
      'Potion of Healing', 'Antitoxin', "Healer's Kit", 'Herbalism Kit',
      'Component Pouch', 'Vial'
    ],
    alchemist: [
      'Potion of Healing', "Alchemist's Fire", 'Acid', 'Antitoxin',
      'Oil', 'Holy Water', "Alchemist's Supplies"
    ],
    general: [
      'Backpack', 'Bedroll', 'Rope, Hempen (50 feet)', 'Torch',
      'Rations (1 day)', 'Waterskin', 'Tinderbox', 'Lantern, Hooded', 'Oil'
    ],
    tavern: [
      'Rations (1 day)', 'Waterskin', 'Wine, Common', 'Ale'
    ],
    magic: [
      'Potion of Healing', 'Component Pouch', 'Spellbook',
      'Arcane Focus', 'Crystal', 'Orb'
    ],
    jeweler: [
      'Ring', 'Amulet', 'Fine Clothes', 'Signet Ring'
    ],
    fletcher: [
      'Shortbow', 'Longbow', 'Crossbow, Light', 'Crossbow, Heavy',
      'Arrows (20)', 'Crossbow Bolts (20)', 'Quiver'
    ],
    provisioner: [
      'Rations (1 day)', 'Waterskin', 'Tinderbox', 'Torch',
      'Rope, Hempen (50 feet)', 'Grappling Hook', 'Piton'
    ],
  };

  // Find matching shop type
  for (const [key, items] of Object.entries(shopInventories)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return items;
    }
  }

  // Default to general store items
  return shopInventories.general;
}

/**
 * Infer shop type from location name/sub_type
 */
export function inferShopType(location: { name?: string; sub_type?: string }): string {
  const text = `${location.name || ''} ${location.sub_type || ''}`.toLowerCase();

  if (text.includes('blacksmith') || text.includes('forge') || text.includes('smith')) return 'blacksmith';
  if (text.includes('apothecary') || text.includes('potion') || text.includes('herb')) return 'apothecary';
  if (text.includes('alchemist')) return 'alchemist';
  if (text.includes('armor')) return 'armorer';
  if (text.includes('weapon')) return 'weaponsmith';
  if (text.includes('magic') || text.includes('arcane') || text.includes('wizard')) return 'magic';
  if (text.includes('jewel') || text.includes('gem')) return 'jeweler';
  if (text.includes('tavern') || text.includes('inn') || text.includes('pub')) return 'tavern';
  if (text.includes('fletcher') || text.includes('bow') || text.includes('arrow')) return 'fletcher';
  if (text.includes('provision') || text.includes('supply') || text.includes('outfitter')) return 'provisioner';

  return 'general';
}

/**
 * Check if a location is likely a shop based on keywords
 */
export function isLikelyShop(location: { name?: string; sub_type?: string; mechanics?: Record<string, unknown> }): boolean {
  // If explicitly marked as shop
  if (location.mechanics?.is_shop) return true;

  const shopKeywords = [
    'shop', 'store', 'merchant', 'market', 'tavern', 'inn', 'smithy',
    'blacksmith', 'apothecary', 'armorer', 'weaponsmith', 'general store',
    'magic shop', 'alchemist', 'herbalist', 'jeweler', 'trader', 'vendor',
    'emporium', 'bazaar', 'trading post', 'provisioner', 'outfitter',
    'fletcher', 'bowyer', 'tanner', 'leatherworker', 'tailor'
  ];

  const text = `${location.name || ''} ${location.sub_type || ''}`.toLowerCase();

  return shopKeywords.some(keyword => text.includes(keyword));
}
