/**
 * Pure helper functions for shop detection and item selection.
 * These don't require server-side imports and can be used in both client and server contexts.
 */

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
    weapons: [
      'Longsword', 'Greatsword', 'Rapier', 'Scimitar', 'Shortbow',
      'Longbow', 'Crossbow, Light', 'Crossbow, Heavy', 'Javelin', 'Spear',
      'Dagger', 'Shortsword', 'Handaxe', 'Battleaxe', 'Flail'
    ],
    weaponsmith: [
      'Longsword', 'Greatsword', 'Rapier', 'Scimitar', 'Shortbow',
      'Longbow', 'Crossbow, Light', 'Crossbow, Heavy', 'Javelin', 'Spear'
    ],
    armor: [
      'Chain Mail', 'Scale Mail', 'Plate', 'Leather Armor', 'Studded Leather Armor',
      'Shield', 'Half Plate', 'Breastplate', 'Ring Mail', 'Hide Armor'
    ],
    armorer: [
      'Chain Mail', 'Scale Mail', 'Plate', 'Leather Armor', 'Studded Leather Armor',
      'Shield', 'Half Plate', 'Breastplate', 'Ring Mail', 'Hide Armor'
    ],
    potions: [
      'Potion of Healing', 'Antitoxin', "Healer's Kit", 'Herbalism Kit',
      'Component Pouch', 'Vial', 'Holy Water'
    ],
    apothecary: [
      'Potion of Healing', 'Antitoxin', "Healer's Kit", 'Herbalism Kit',
      'Component Pouch', 'Vial', 'Holy Water'
    ],
    alchemist: [
      'Potion of Healing', "Alchemist's Fire", 'Acid', 'Antitoxin',
      'Oil', 'Holy Water', "Alchemist's Supplies", 'Vial'
    ],
    general: [
      'Backpack', 'Bedroll', 'Rope, Hempen (50 feet)', 'Torch',
      'Rations (1 day)', 'Waterskin', 'Tinderbox', 'Lantern, Hooded', 'Oil',
      'Crowbar', 'Hammer', 'Piton', 'Grappling Hook', 'Chain (10 feet)',
      'Chalk', 'Candle', 'Flask', 'Hunting Trap', 'Ink',
      'Mirror, Steel', 'Pole (10-foot)', 'Shovel', 'Signal Whistle',
      'Tent, Two-Person', 'Caltrops', 'Ball Bearings', 'Antitoxin'
    ],
    tavern: [
      'Rations (1 day)', 'Waterskin'
    ],
    magic: [
      'Potion of Healing', 'Component Pouch', 'Spellbook',
      'Arcane Focus', 'Crystal', 'Orb', 'Rod', 'Wand'
    ],
    jewelry: [
      'Fine Clothes', 'Signet Ring'
    ],
    jeweler: [
      'Fine Clothes', 'Signet Ring'
    ],
    fletcher: [
      'Shortbow', 'Longbow', 'Crossbow, Light', 'Crossbow, Heavy',
      'Arrows (20)', 'Crossbow Bolts (20)', 'Quiver'
    ],
    provisioner: [
      'Rations (1 day)', 'Waterskin', 'Tinderbox', 'Torch',
      'Rope, Hempen (50 feet)', 'Grappling Hook', 'Piton', 'Bedroll'
    ],
    clothing: [
      'Common Clothes', 'Fine Clothes', "Traveler's Clothes", 'Robes'
    ],
    mounts: [
      'Riding Horse', 'Draft Horse', 'Pony', 'Donkey', 'Mule',
      'Saddle, Riding', 'Saddle, Military', 'Saddlebags', 'Bit and Bridle',
      'Feed (per day)'
    ],
    stable: [
      'Riding Horse', 'Draft Horse', 'Pony', 'Donkey', 'Mule',
      'Saddle, Riding', 'Saddle, Military', 'Saddlebags', 'Bit and Bridle',
      'Feed (per day)'
    ],
    books: [
      'Book', 'Ink', 'Ink Pen', 'Paper (one sheet)', 'Parchment (one sheet)',
      'Sealing Wax', 'Spellbook'
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
 * Infer shop type from location name/sub_type/description
 */
export function inferShopType(location: { name?: string; sub_type?: string; description?: string }): string {
  const text = `${location.name || ''} ${location.sub_type || ''} ${location.description || ''}`.toLowerCase();

  // Order matters - check specific types first
  if (/blacksmith|weaponsmith|sword|blade/.test(text)) return 'weapons';
  if (/armou?rer|armor|mail|plate/.test(text)) return 'armor';
  if (/apothecary|alchemist|potion|herb|remedy|elixir/.test(text)) return 'potions';
  if (/magic|arcane|enchant|wizard|scroll|wand|mystic|curiosit/.test(text)) return 'magic';
  if (/jewel|gem|goldsmith|silver|ring|necklace/.test(text)) return 'jewelry';
  if (/tavern|inn|pub|ale\s*house/.test(text)) return 'tavern';
  if (/general\s*store|outfitter|supply|provisions|adventur|gear|trading\s*post|mercantile/.test(text)) return 'general';
  if (/leather|cloth|tailor|weaver/.test(text)) return 'clothing';
  if (/stable|horse|mount|livery/.test(text)) return 'mounts';
  if (/book|scroll|library|scribe/.test(text)) return 'books';
  if (/fletcher|bow|arrow/.test(text)) return 'fletcher';
  if (/forge|smithy/.test(text)) return 'blacksmith';

  return 'general'; // Default fallback
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
    'fletcher', 'bowyer', 'tanner', 'leatherworker', 'tailor', 'forge',
    'foundry', 'arcane', 'enchanter', 'scroll', 'potion', 'stable',
    'livery', 'scribe', 'bookshop', 'pub', 'ale house'
  ];

  const text = `${location.name || ''} ${location.sub_type || ''}`.toLowerCase();

  return shopKeywords.some(keyword => text.includes(keyword));
}
