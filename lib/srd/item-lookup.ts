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

/**
 * Find an SRD item by name (case-insensitive)
 * Prefers exact matches, then shortest fuzzy match (to avoid "Oil" matching "Oil of Etherealness")
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

  // Try fuzzy match (contains) - get multiple matches and prefer shortest name
  // This prevents "Oil" from matching "Oil of Etherealness" when "Oil (flask)" exists
  const { data: fuzzyMatches } = await supabase
    .from('srd_items')
    .select('id, name, item_type, rarity, value_gp, weight')
    .ilike('name', `%${name}%`)
    .limit(10);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    // Sort by name length (prefer shorter/simpler matches) and return the best match
    // Also prefer items that start with the search term
    fuzzyMatches.sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(name.toLowerCase()) ? 0 : 1;
      const bStartsWith = b.name.toLowerCase().startsWith(name.toLowerCase()) ? 0 : 1;
      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
      return a.name.length - b.name.length;
    });
    return fuzzyMatches[0];
  }

  return null;
}

