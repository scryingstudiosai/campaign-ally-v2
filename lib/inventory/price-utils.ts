/**
 * Price estimation utilities for D&D 5e items
 * Used when SRD items don't have value_gp populated
 */

// Common item prices from D&D 5e PHB (in gold pieces)
export const COMMON_ITEM_PRICES: Record<string, number> = {
  // Potions
  'potion of healing': 50,
  'potion of greater healing': 150,
  'potion of superior healing': 450,
  'potion of supreme healing': 1350,
  'potion of climbing': 75,
  'potion of animal friendship': 200,
  'potion of water breathing': 180,
  'potion of invisibility': 180,

  // Basic Weapons
  'club': 0.1,
  'dagger': 2,
  'greatclub': 0.2,
  'handaxe': 5,
  'javelin': 0.5,
  'light hammer': 2,
  'mace': 5,
  'quarterstaff': 0.2,
  'sickle': 1,
  'spear': 1,
  'crossbow, light': 25,
  'dart': 0.05,
  'shortbow': 25,
  'sling': 0.1,
  'battleaxe': 10,
  'flail': 10,
  'glaive': 20,
  'greataxe': 30,
  'greatsword': 50,
  'halberd': 20,
  'lance': 10,
  'longsword': 15,
  'maul': 10,
  'morningstar': 15,
  'pike': 5,
  'rapier': 25,
  'scimitar': 25,
  'shortsword': 10,
  'trident': 5,
  'war pick': 5,
  'warhammer': 15,
  'whip': 2,
  'crossbow, hand': 75,
  'crossbow, heavy': 50,
  'longbow': 50,
  'blowgun': 10,
  'net': 1,

  // Armor
  'padded': 5,
  'leather': 10,
  'studded leather': 45,
  'hide': 10,
  'chain shirt': 50,
  'scale mail': 50,
  'breastplate': 400,
  'half plate': 750,
  'ring mail': 30,
  'chain mail': 75,
  'splint': 200,
  'plate': 1500,
  'shield': 10,

  // Adventuring Gear
  'rope, hempen (50 feet)': 1,
  'rope, silk (50 feet)': 10,
  'torch': 0.01,
  'lantern, bullseye': 10,
  'lantern, hooded': 5,
  'oil (flask)': 0.1,
  'tinderbox': 0.5,
  'rations (1 day)': 0.5,
  'waterskin': 0.2,
  'backpack': 2,
  'bedroll': 1,
  'blanket': 0.5,
  'candle': 0.01,
  'crowbar': 2,
  'grappling hook': 2,
  'hammer': 1,
  'holy symbol': 5,
  'ink (1 ounce bottle)': 10,
  'ladder (10-foot)': 0.1,
  'lock': 10,
  'manacles': 2,
  'mirror, steel': 5,
  'paper (one sheet)': 0.2,
  'piton': 0.05,
  'pole (10-foot)': 0.05,
  'pot, iron': 2,
  'pouch': 0.5,
  'quiver': 1,
  'sack': 0.01,
  'sealing wax': 0.5,
  'signet ring': 5,
  'spellbook': 50,
  'tent, two-person': 2,
  'thieves\' tools': 25,
  'whetstone': 0.01,

  // Ammunition
  'arrows (20)': 1,
  'bolts (20)': 1,
  'bullets, sling (20)': 0.04,
  'needles, blowgun (50)': 1,
};

// Price ranges by rarity (D&D 5e DMG suggested prices)
export const RARITY_PRICE_RANGES: Record<string, { min: number; max: number; typical: number }> = {
  common: { min: 50, max: 100, typical: 75 },
  uncommon: { min: 101, max: 500, typical: 300 },
  rare: { min: 501, max: 5000, typical: 2500 },
  'very rare': { min: 5001, max: 50000, typical: 25000 },
  legendary: { min: 50001, max: 200000, typical: 100000 },
  artifact: { min: 200001, max: 1000000, typical: 500000 },
};

// Base prices by item type for mundane items
export const ITEM_TYPE_BASE_PRICES: Record<string, number> = {
  weapon: 10,
  armor: 25,
  potion: 50,
  scroll: 25,
  wand: 100,
  rod: 200,
  staff: 150,
  ring: 100,
  wondrous: 100,
  ammunition: 1,
  adventuring_gear: 1,
  tool: 5,
  mount: 50,
  vehicle: 100,
};

/**
 * Get the estimated price for an item
 * Priority: explicit price > common item lookup > rarity-based > type-based
 */
export function getItemPrice(
  name: string,
  valueGp: number | null | undefined,
  rarity: string | null | undefined,
  itemType: string | null | undefined,
  priceModifier: number = 1
): number | null {
  // If we have an explicit price, use it
  if (valueGp != null && valueGp > 0) {
    return Math.round(valueGp * priceModifier);
  }

  // Look up common items by name (case-insensitive)
  const normalizedName = name.toLowerCase().trim();
  const commonPrice = COMMON_ITEM_PRICES[normalizedName];
  if (commonPrice != null) {
    return Math.round(commonPrice * priceModifier);
  }

  // Check for partial matches (e.g., "Longsword +1" matches "longsword")
  for (const [itemName, price] of Object.entries(COMMON_ITEM_PRICES)) {
    if (normalizedName.includes(itemName) || itemName.includes(normalizedName)) {
      // For magic items, use the base mundane price as a starting point
      // but the rarity-based pricing will take precedence below
      if (rarity && rarity !== 'common') {
        break; // Let rarity-based pricing handle magic items
      }
      return Math.round(price * priceModifier);
    }
  }

  // For magic items, use rarity-based pricing
  if (rarity && rarity !== 'common') {
    const normalizedRarity = rarity.toLowerCase();
    const rarityPricing = RARITY_PRICE_RANGES[normalizedRarity];
    if (rarityPricing) {
      return Math.round(rarityPricing.typical * priceModifier);
    }
  }

  // Fall back to item type base pricing
  if (itemType) {
    const normalizedType = itemType.toLowerCase();
    for (const [type, basePrice] of Object.entries(ITEM_TYPE_BASE_PRICES)) {
      if (normalizedType.includes(type)) {
        return Math.round(basePrice * priceModifier);
      }
    }
  }

  // If we still can't determine a price, return null
  return null;
}

/**
 * Format a price for display
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'Price not set';
  if (price === 0) return 'Free';
  if (price < 1) {
    // Convert to copper or silver
    const copper = Math.round(price * 100);
    if (copper < 10) return `${copper} cp`;
    const silver = Math.round(price * 10);
    return `${silver} sp`;
  }
  return `${price.toLocaleString()} gp`;
}
