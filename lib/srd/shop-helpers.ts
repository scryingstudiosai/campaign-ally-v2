/**
 * Pure helper functions for shop detection and item selection.
 * These don't require server-side imports and can be used in both client and server contexts.
 */

// Comprehensive list of general store items - using EXACT SRD names
export const GENERAL_STORE_ITEMS = [
  // Adventuring Gear - Core
  'Backpack',
  'Bedroll',
  'Blanket',
  'Candle',
  'Chest',
  'Crowbar',
  'Flask',
  'Grappling Hook',
  'Lamp',
  'Lantern, Bullseye',
  'Lantern, Hooded',
  'Lock',
  'Manacles',
  'Mess Kit',
  'Mirror, Steel',
  'Oil (flask)',
  'Piton',
  'Pole (10-foot)',
  'Pot, Iron',
  'Pouch',
  'Rations (1 day)',
  'Rope, Hempen (50 feet)',
  'Rope, Silk (50 feet)',
  'Sack',
  'Shovel',
  'Signal Whistle',
  'Spyglass',
  'Tent, Two-Person',
  'Tinderbox',
  'Torch',
  'Waterskin',
  // Adventuring Gear - Special
  'Acid (vial)',
  "Alchemist's Fire (flask)",
  'Antitoxin (vial)',
  'Ball Bearings (bag of 1,000)',
  'Caltrops (bag of 20)',
  'Chain (10 feet)',
  'Chalk (1 piece)',
  "Climber's Kit",
  'Component Pouch',
  "Healer's Kit",
  'Holy Water (flask)',
  'Hunting Trap',
  'Ink (1 ounce bottle)',
  'Ladder (10-foot)',
  "Pick, Miner's",
  'Quiver',
  "Scale, Merchant's",
  'Vial',
  // Kits and Tools
  "Thieves' Tools",
  "Carpenter's Tools",
  "Cook's Utensils",
  'Herbalism Kit',
  "Mason's Tools",
  "Smith's Tools",
  "Tinker's Tools",
];

export const WEAPON_SHOP_ITEMS = [
  // Simple Melee
  'Club',
  'Dagger',
  'Greatclub',
  'Handaxe',
  'Javelin',
  'Light Hammer',
  'Mace',
  'Quarterstaff',
  'Sickle',
  'Spear',
  // Simple Ranged
  'Crossbow, Light',
  'Dart',
  'Shortbow',
  'Sling',
  // Martial Melee
  'Battleaxe',
  'Flail',
  'Glaive',
  'Greataxe',
  'Greatsword',
  'Halberd',
  'Lance',
  'Longsword',
  'Maul',
  'Morningstar',
  'Pike',
  'Rapier',
  'Scimitar',
  'Shortsword',
  'Trident',
  'War Pick',
  'Warhammer',
  'Whip',
  // Martial Ranged
  'Blowgun',
  'Crossbow, Hand',
  'Crossbow, Heavy',
  'Longbow',
  'Net',
  // Ammunition
  'Arrows (20)',
  'Blowgun Needles (50)',
  'Crossbow Bolts (20)',
  'Sling Bullets (20)',
];

export const ARMOR_SHOP_ITEMS = [
  // Light Armor
  'Padded Armor',
  'Leather Armor',
  'Studded Leather Armor',
  // Medium Armor
  'Hide Armor',
  'Chain Shirt',
  'Scale Mail',
  'Breastplate',
  'Half Plate Armor',
  // Heavy Armor
  'Ring Mail',
  'Chain Mail',
  'Splint Armor',
  'Plate Armor',
  // Shield
  'Shield',
];

export const POTION_SHOP_ITEMS = [
  'Potion of Healing',
  'Antitoxin (vial)',
  'Holy Water (flask)',
  "Alchemist's Fire (flask)",
  'Acid (vial)',
  'Oil (flask)',
  "Healer's Kit",
  'Herbalism Kit',
  'Component Pouch',
  'Vial',
];

export const MAGIC_SHOP_ITEMS = [
  'Potion of Healing',
  'Component Pouch',
  'Spellbook',
  'Arcane Focus, Crystal',
  'Arcane Focus, Orb',
  'Arcane Focus, Rod',
  'Arcane Focus, Staff',
  'Arcane Focus, Wand',
  'Druidic Focus, Sprig of Mistletoe',
  'Druidic Focus, Totem',
  'Druidic Focus, Wooden Staff',
  'Druidic Focus, Yew Wand',
  'Holy Symbol, Amulet',
  'Holy Symbol, Emblem',
  'Holy Symbol, Reliquary',
];

export const STABLE_ITEMS = [
  'Riding Horse',
  'Draft Horse',
  'Warhorse',
  'Pony',
  'Donkey',
  'Mule',
  'Saddle, Riding',
  'Saddle, Military',
  'Saddle, Exotic',
  'Saddlebags',
  'Bit and Bridle',
  'Feed (per day)',
  'Barding, Chain',
  'Barding, Leather',
  'Barding, Plate',
];

/**
 * Get default SRD items for a shop type
 */
export function getSrdItemsForShopType(shopType: string): string[] {
  const normalizedType = shopType.toLowerCase();

  const shopInventories: Record<string, string[]> = {
    blacksmith: WEAPON_SHOP_ITEMS.slice(0, 15),
    weapons: WEAPON_SHOP_ITEMS,
    weaponsmith: WEAPON_SHOP_ITEMS.slice(0, 20),
    armor: ARMOR_SHOP_ITEMS,
    armorer: ARMOR_SHOP_ITEMS,
    potions: POTION_SHOP_ITEMS,
    apothecary: POTION_SHOP_ITEMS,
    alchemist: POTION_SHOP_ITEMS,
    general: GENERAL_STORE_ITEMS,
    tavern: ['Rations (1 day)', 'Waterskin', 'Torch', 'Candle'],
    magic: MAGIC_SHOP_ITEMS,
    jewelry: ['Fine Clothes', 'Signet Ring'],
    jeweler: ['Fine Clothes', 'Signet Ring'],
    fletcher: [
      'Shortbow', 'Longbow', 'Crossbow, Light', 'Crossbow, Heavy',
      'Arrows (20)', 'Crossbow Bolts (20)', 'Quiver'
    ],
    provisioner: GENERAL_STORE_ITEMS.slice(0, 20),
    clothing: ['Common Clothes', 'Fine Clothes', "Traveler's Clothes", 'Robes', 'Costume Clothes'],
    mounts: STABLE_ITEMS,
    stable: STABLE_ITEMS,
    books: [
      'Book', 'Ink (1 ounce bottle)', 'Ink Pen', 'Paper (one sheet)',
      'Parchment (one sheet)', 'Sealing Wax', 'Spellbook'
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
