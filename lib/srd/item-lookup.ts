import { createClient } from '@/lib/supabase/server';

// Re-export pure helper functions for backward compatibility
export { isLikelyShop, inferShopType, getSrdItemsForShopType } from './shop-helpers';

export interface SrdItemBasic {
  id: string;
  name: string;
  item_type: string;
  rarity: string | null;
  value_gp: number | null;
  weight: number | null;
}

// Rarities to exclude when looking for mundane items
const RARE_RARITIES = ['rare', 'very rare', 'legendary', 'artifact'];

/**
 * Find an SRD item by name (case-insensitive)
 * Prefers exact matches, then shortest fuzzy match (to avoid "Oil" matching "Oil of Etherealness")
 *
 * @param name - The item name to search for
 * @param options.excludeRare - If true, exclude rare, very rare, legendary, and artifact items
 */
export async function findSrdItemByName(
  name: string,
  options?: { excludeRare?: boolean }
): Promise<SrdItemBasic | null> {
  const supabase = await createClient();
  const excludeRare = options?.excludeRare ?? false;

  // Try exact match first (case-insensitive)
  let exactQuery = supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', name);

  if (excludeRare) {
    // Exclude rare+ items and magic item indicators
    exactQuery = exactQuery
      .not('rarity', 'in', `(${RARE_RARITIES.map(r => `"${r}"`).join(',')})`)
      .not('name', 'ilike', '%+1%')
      .not('name', 'ilike', '%+2%')
      .not('name', 'ilike', '%+3%');
  }

  const { data: exactMatch } = await exactQuery.limit(1).single();

  if (exactMatch) {
    console.log(`[SRD Lookup] Exact match for "${name}":`, exactMatch.name, `(${exactMatch.rarity})`);
    return exactMatch;
  }

  // Try fuzzy match (contains) - get multiple matches and prefer shortest name
  // This prevents "Oil" from matching "Oil of Etherealness" when "Oil (flask)" exists
  let fuzzyQuery = supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', `%${name}%`);

  if (excludeRare) {
    // Exclude rare+ items and magic item indicators
    fuzzyQuery = fuzzyQuery
      .not('rarity', 'in', `(${RARE_RARITIES.map(r => `"${r}"`).join(',')})`)
      .not('name', 'ilike', '%+1%')
      .not('name', 'ilike', '%+2%')
      .not('name', 'ilike', '%+3%')
      .not('name', 'ilike', '% of %'); // Exclude "X of Y" pattern (often magic items)
  }

  const { data: fuzzyMatches } = await fuzzyQuery.limit(20);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    // Sort by name length (prefer shorter/simpler matches) and return the best match
    // Also prefer items that start with the search term
    // Also prefer common/uncommon items over rare ones
    fuzzyMatches.sort((a, b) => {
      // Prefer items that start with the search term
      const aStartsWith = a.name.toLowerCase().startsWith(name.toLowerCase()) ? 0 : 1;
      const bStartsWith = b.name.toLowerCase().startsWith(name.toLowerCase()) ? 0 : 1;
      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

      // Prefer common/no rarity items
      const aIsCommon = !a.rarity || a.rarity === 'common' ? 0 : 1;
      const bIsCommon = !b.rarity || b.rarity === 'common' ? 0 : 1;
      if (aIsCommon !== bIsCommon) return aIsCommon - bIsCommon;

      // Prefer shorter names (simpler items)
      return a.name.length - b.name.length;
    });

    const selected = fuzzyMatches[0];
    console.log(`[SRD Lookup] Fuzzy match for "${name}":`, selected.name, `(${selected.rarity})`,
      `- had ${fuzzyMatches.length} candidates`);
    return selected;
  }

  console.log(`[SRD Lookup] No match found for "${name}" (excludeRare: ${excludeRare})`);
  return null;
}

