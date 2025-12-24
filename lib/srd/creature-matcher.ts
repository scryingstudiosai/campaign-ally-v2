// SRD Creature Matcher
// Matches creature names from generated encounters to SRD creatures

import { createClient } from '@/lib/supabase/client'

export interface SrdCreatureMatch {
  id: string
  slug: string
  name: string
  cr: string
  cr_numeric: number | null
  hp: number
  ac: number
  creature_type: string
  size: string
  confidence: number
}

/**
 * Match a single creature name to the SRD database
 * Returns the best match with confidence score, or null if no match
 */
export async function matchCreatureToSrd(
  creatureName: string,
  gameSystem: string = '5e_2014'
): Promise<SrdCreatureMatch | null> {
  const supabase = createClient()

  // Clean the name for matching - remove parentheticals, numbers, etc.
  const cleanName = creatureName
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove parentheticals like "(wounded)"
    .replace(/\d+x?\s*/g, '')   // Remove numbers like "3x" or "2 "
    .replace(/[^a-z\s'-]/g, '') // Keep letters, spaces, hyphens, apostrophes
    .trim()

  if (!cleanName) return null

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('srd_creatures')
    .select('id, slug, name, cr, cr_numeric, hp, ac, creature_type, size')
    .eq('game_system', gameSystem)
    .ilike('name', cleanName)
    .limit(1)
    .single()

  if (exactMatch) {
    return { ...exactMatch, confidence: 1.0 }
  }

  // Try fuzzy match (contains)
  const { data: fuzzyMatches } = await supabase
    .from('srd_creatures')
    .select('id, slug, name, cr, cr_numeric, hp, ac, creature_type, size')
    .eq('game_system', gameSystem)
    .ilike('name', `%${cleanName}%`)
    .limit(5)

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    // Find best match by name similarity
    const scoredMatches = fuzzyMatches.map(match => ({
      ...match,
      confidence: nameSimilarity(cleanName, match.name.toLowerCase())
    }))

    // Sort by confidence descending
    scoredMatches.sort((a, b) => b.confidence - a.confidence)

    const bestMatch = scoredMatches[0]
    if (bestMatch.confidence > 0.6) {
      return bestMatch
    }
  }

  // Try reverse contains (creature name in search term)
  // This handles cases like "Goblin Boss" containing "Goblin"
  const words = cleanName.split(/\s+/)
  for (const word of words) {
    if (word.length < 3) continue // Skip short words

    const { data: wordMatches } = await supabase
      .from('srd_creatures')
      .select('id, slug, name, cr, cr_numeric, hp, ac, creature_type, size')
      .eq('game_system', gameSystem)
      .ilike('name', word)
      .limit(1)

    if (wordMatches && wordMatches.length > 0) {
      const match = wordMatches[0]
      const confidence = nameSimilarity(cleanName, match.name.toLowerCase())
      if (confidence > 0.5) {
        return { ...match, confidence }
      }
    }
  }

  return null
}

/**
 * Simple word-based similarity score
 * Returns a value between 0 and 1
 */
function nameSimilarity(a: string, b: string): number {
  // Normalize strings
  const aNorm = a.toLowerCase().trim()
  const bNorm = b.toLowerCase().trim()

  // Exact match
  if (aNorm === bNorm) return 1.0

  // Check if one contains the other
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
    const shorter = aNorm.length < bNorm.length ? aNorm : bNorm
    const longer = aNorm.length >= bNorm.length ? aNorm : bNorm
    return shorter.length / longer.length
  }

  // Jaccard similarity on words
  const aWordsArr = aNorm.split(/\s+/)
  const bWordsArr = bNorm.split(/\s+/)
  const bWordsSet = new Set(bWordsArr)

  const intersection = aWordsArr.filter(x => bWordsSet.has(x))
  const allWords = aWordsArr.concat(bWordsArr)
  const unionSet = new Set(allWords)

  return intersection.length / unionSet.size
}

/**
 * Match multiple creature names to SRD in parallel
 * Returns a Map of creature name -> match (or null)
 */
export async function matchCreaturesToSrd(
  creatureNames: string[],
  gameSystem: string = '5e_2014'
): Promise<Map<string, SrdCreatureMatch | null>> {
  const results = new Map<string, SrdCreatureMatch | null>()

  // Deduplicate names (case-insensitive)
  const uniqueNames = Array.from(new Set(creatureNames.map(n => n.toLowerCase())))
  const nameMap = new Map(creatureNames.map(n => [n.toLowerCase(), n]))

  // Match in parallel
  await Promise.all(
    uniqueNames.map(async (lowerName) => {
      const originalName = nameMap.get(lowerName) || lowerName
      const match = await matchCreatureToSrd(originalName, gameSystem)
      results.set(originalName, match)
    })
  )

  return results
}

/**
 * Check if a creature name is likely a generic/custom creature (not in SRD)
 * This helps with UI hints
 */
export function isLikelyCustomCreature(name: string): boolean {
  const lowerName = name.toLowerCase()

  // Common custom creature patterns
  const customPatterns = [
    /captain/i,
    /boss/i,
    /chief/i,
    /leader/i,
    /king/i,
    /queen/i,
    /lord/i,
    /lady/i,
    /the\s+/i,  // Named creatures like "The Thornfang"
    /elder/i,
    /ancient/i,
    /young/i,
    /corrupted/i,
    /cursed/i,
    /undead/i,
  ]

  // If it matches a custom pattern, it might still be in SRD (like "Young Dragon")
  // but this is a hint for UI purposes
  return customPatterns.some(pattern => pattern.test(lowerName))
}
