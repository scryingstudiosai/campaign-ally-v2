// Entity mention scanners for post-generation text analysis

import {
  shouldIgnoreTerm,
  matchesNpcPattern,
  matchesLocationPattern,
  matchesFactionPattern,
  matchesItemPattern,
  NPC_INDICATORS,
  LOCATION_INDICATORS,
  FACTION_INDICATORS,
  ITEM_INDICATORS,
} from './blocklist'

export interface PotentialEntity {
  text: string
  startIndex: number
  endIndex: number
  context: string // Surrounding words for context
}

// Common words that should be skipped even if capitalized
const SKIP_WORDS = new Set([
  // Pronouns and articles
  'The',
  'This',
  'That',
  'They',
  'There',
  'These',
  'Those',
  'His',
  'Her',
  'Its',
  'Their',
  'He',
  'She',
  'It',
  'We',
  'You',
  'Who',
  'Whom',
  // Question words
  'When',
  'Where',
  'What',
  'Which',
  'Why',
  'How',
  // Conjunctions and transitions
  'However',
  'Although',
  'Because',
  'Therefore',
  'Furthermore',
  'Moreover',
  'Nevertheless',
  'Meanwhile',
  'Otherwise',
  'Despite',
  'Unless',
  'Whether',
  'Though',
  'Whereas',
  // Adverbs
  'Indeed',
  'Perhaps',
  'Certainly',
  'Probably',
  'Obviously',
  'Clearly',
  'Simply',
  'Actually',
  'Basically',
  'Essentially',
  'Generally',
  'Normally',
  'Usually',
  'Often',
  'Sometimes',
  'Always',
  'Never',
  'Suddenly',
  'Eventually',
  'Recently',
  'Formerly',
  'Previously',
  // Time words
  'Here',
  'Now',
  'Then',
  'Today',
  'Tomorrow',
  'Yesterday',
  'Later',
  'Soon',
  'Before',
  'After',
  'During',
  'While',
  'Until',
  'Since',
  'Once',
  'Twice',
  // Ordinals
  'First',
  'Second',
  'Third',
  'Finally',
  'Last',
  'Next',
  // Quantifiers
  'Another',
  'Other',
  'Each',
  'Every',
  'Both',
  'Either',
  'Neither',
  'Many',
  'Most',
  'Some',
  'Any',
  'All',
  'None',
  'Few',
  'Several',
  'Much',
  'More',
  'Less',
  'Least',
  // Degree words
  'Very',
  'Quite',
  'Rather',
  'Almost',
  'Nearly',
  'Hardly',
  'Barely',
  'Just',
  'Only',
  'Even',
  'Still',
  'Already',
  'Yet',
  // Basic words
  'Not',
  'No',
  'Yes',
  'And',
  'But',
  'Or',
  'For',
  'Nor',
  'So',
  // Prepositions
  'With',
  'Without',
  'Within',
  'Beyond',
  'Against',
  'Among',
  'Between',
  'Through',
  'Throughout',
  'Across',
  'Around',
  'About',
  'Above',
  'Below',
  'Under',
  'Over',
  'Behind',
  'Beside',
  'Inside',
  'Outside',
  'Into',
  'Onto',
  'Upon',
  'From',
  'Toward',
  'Towards',
  // D&D common terms that aren't entities
  'Attack',
  'Damage',
  'Armor',
  'Class',
  'Level',
  'Hit',
  'Points',
  'Spell',
  'Magic',
  'Magical',
  'Weapon',
  'Shield',
  'Sword',
  'Bow',
  'Arrow',
  'Staff',
  'Wand',
  'Ring',
  'Potion',
  'Scroll',
  'Gold',
  'Silver',
  'Copper',
  'Platinum',
  // Spell name components (to avoid detecting spells as entities)
  'Remove',
  'Detect',
  'Dispel',
  'Greater',
  'Lesser',
  'Mass',
  'True',
  'Minor',
  'Major',
])

// Known D&D spell names to ignore
const SPELL_NAMES = new Set([
  'Fireball',
  'Lightning Bolt',
  'Magic Missile',
  'Cure Wounds',
  'Healing Word',
  'Remove Curse',
  'Dispel Magic',
  'Detect Magic',
  'Identify',
  'Counterspell',
  'Shield',
  'Mage Armor',
  'Invisibility',
  'Fly',
  'Haste',
  'Slow',
  'Hold Person',
  'Charm Person',
  'Sleep',
  'Web',
  'Darkness',
  'Light',
  'Guidance',
  'Bless',
  'Bane',
  'Hunter Mark',
  'Hex',
  'Eldritch Blast',
  'Sacred Flame',
  'Toll Dead',
  'Vicious Mockery',
])

export function extractProperNouns(
  text: string,
  excludeEntityName?: string
): PotentialEntity[] {
  // Clean the text first - remove excessive whitespace/newlines
  const cleanedText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()

  const results: PotentialEntity[] = []
  const excludeLower = excludeEntityName?.toLowerCase()

  // DEBUG: Log exclusion
  console.log('extractProperNouns - excludeEntityName:', excludeEntityName)
  console.log('extractProperNouns - excludeLower:', excludeLower)

  // Detect sentence starters (words at the start of sentences that are just capitalized, not proper nouns)
  const sentenceStartPattern = /(?:^|[.!?]\s+)([A-Z][a-z]+)/g
  const sentenceStarters = new Set<string>()
  let starterMatch
  while ((starterMatch = sentenceStartPattern.exec(cleanedText)) !== null) {
    sentenceStarters.add(starterMatch[1].toLowerCase())
  }
  console.log('Detected sentence starters:', Array.from(sentenceStarters))

  // Pattern 1: Quoted text (high confidence entity names)
  const quotedPattern = /"([A-Z][^"]+)"/g

  let match
  while ((match = quotedPattern.exec(cleanedText)) !== null) {
    const matchText = match[1].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Get surrounding context (50 chars on each side)
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 2: Titled names with comprehensive title list
  // Handles: "General Valthor", "Sir Garren of Greystone", "High Priest Morven", "Admiral Blackwood"
  const titledNamePattern = /\b(?:General|Admiral|Captain|Commander|Warlord|King|Queen|Prince|Princess|Lord|Lady|Duke|Duchess|Baron|Baroness|Count|Countess|Earl|Marquis|Viscount|Sir|Dame|Master|Mistress|Elder|Archmage|High Priest|High Priestess|Father|Mother|Brother|Sister|Chief|Emperor|Empress|Grand Master)\s+[A-Z][a-z]+(?:\s+(?:the|of|de|von|van)\s+(?:the\s+)?[A-Z][a-z]+)*(?:\s+[IVXLCDM]+)?/gi

  while ((match = titledNamePattern.exec(cleanedText)) !== null) {
    const matchText = match[0].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue
    if (excludeLower && matchText.toLowerCase().includes(excludeLower)) continue

    // Skip blocklisted terms
    if (shouldIgnoreTerm(matchText)) continue

    // Get surrounding context
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 3: Names with epithets (e.g., "Elara the Cunning", "Vorn the Terrible")
  const epithetPattern = /\b[A-Z][a-z]+\s+the\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g

  while ((match = epithetPattern.exec(cleanedText)) !== null) {
    const matchText = match[0].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue
    if (excludeLower && matchText.toLowerCase().includes(excludeLower)) continue

    // Skip blocklisted terms
    if (shouldIgnoreTerm(matchText)) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Get surrounding context
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 3b: Names with "of" patterns (e.g., "Mirella of the Mists", "Duke of Blackmoor")
  const ofPattern = /\b[A-Z][a-z]+\s+of\s+(?:the\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g

  while ((match = ofPattern.exec(cleanedText)) !== null) {
    const matchText = match[0].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue
    if (excludeLower && matchText.toLowerCase().includes(excludeLower)) continue

    // Skip blocklisted terms
    if (shouldIgnoreTerm(matchText)) continue

    // Get surrounding context
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 3c: Location patterns like "the Shattered Keep", "the Silent Glade"
  const locationPattern = /\bthe\s+[A-Z][a-z]+\s+(?:Keep|Glade|Forest|Mountain|Valley|Plains|Depths|Heights|Spire|Tower|Gate|Bridge|Pass|Wastes|Wilds|Reaches|Shores|Isles?|Bay|Harbor|Port|Falls|Springs|Caverns?|Mines?|Halls?|Tomb|Crypt|Sanctum|Citadel|Fortress|Castle|Palace|Temple|Shrine|Academy|Library|Archive|Pit|Chasm)\b/gi

  while ((match = locationPattern.exec(cleanedText)) !== null) {
    const matchText = match[0].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Get surrounding context
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 3d: "city/kingdom/realm of X" patterns (location indicators)
  const placeOfPattern = /\b(?:city|town|village|kingdom|realm|fortress|castle|tower|vault|temple|shrine|forest|mountain|cave|dungeon|keep|citadel|ruins)\s+of\s+(?:the\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi

  while ((match = placeOfPattern.exec(cleanedText)) !== null) {
    // Extract just the place name (after "of")
    const fullMatch = match[0].trim()
    const ofIndex = fullMatch.toLowerCase().indexOf(' of ')
    if (ofIndex !== -1) {
      const placeName = fullMatch.substring(ofIndex + 4).replace(/^the\s+/i, '').trim()

      // Skip if it's the entity being created
      if (excludeLower && placeName.toLowerCase() === excludeLower) continue

      // Get surrounding context
      const contextStart = Math.max(0, match.index - 50)
      const contextEnd = Math.min(cleanedText.length, match.index + fullMatch.length + 50)
      const context = cleanedText.substring(contextStart, contextEnd)

      results.push({
        text: placeName,
        startIndex: match.index + ofIndex + 4,
        endIndex: match.index + fullMatch.length,
        context,
      })
    }
  }

  // Pattern 4: Multi-word proper nouns (e.g., "The Drowned Rat", "Iron Fist Guild")
  // Matches: "The X Y", "X Y Z", etc. where words are capitalized
  const multiWordPattern = /(?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g

  while ((match = multiWordPattern.exec(cleanedText)) !== null) {
    const matchText = match[0].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Skip if it's just common words
    const words = matchText.split(/\s+/)
    const meaningfulWords = words.filter((w) => !SKIP_WORDS.has(w))
    if (meaningfulWords.length === 0) continue

    // Skip if too short
    if (matchText.length < 3) continue

    // Get surrounding context (50 chars on each side)
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 5: Single proper nouns - ONLY if they appear mid-sentence (not at start)
  // and are likely names (followed by verbs or specific patterns)
  // More restrictive to avoid false positives
  const singleWordPattern = /(?<=[\.\!\?]\s+[A-Z][a-z]+\s+)[A-Z][a-z]{2,}(?=[,\s\.\!\?\'\"])|(?<=[,;:]\s*)[A-Z][a-z]{2,}(?=[,\s\.\!\?\'\"])/g

  while ((match = singleWordPattern.exec(cleanedText)) !== null) {
    const matchText = match[0]

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Skip common words
    if (SKIP_WORDS.has(matchText)) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Skip if too short
    if (matchText.length < 4) continue // Slightly more restrictive for single words

    // Get surrounding context
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const context = cleanedText.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 6: Standalone capitalized names in NPC-indicating context
  // Captures names like "Tharivol", "Illara", "Elarion" when near NPC verbs
  const npcContextVerbs = [
    'forged by',
    'crafted by',
    'made by',
    'created by',
    'enchanted by',
    'blessed by',
    'cursed by',
    'owned by',
    'given by',
    'stolen from',
    'belonging to',
    'the smith',
    'the mage',
    'the wizard',
    'the sorcerer',
    'the priest',
    'the priestess',
    'the merchant',
    'the blacksmith',
    'known as',
    'called',
    'named',
  ]

  // Look for standalone names (at least 4 chars, capitalized) near NPC context
  const standaloneNamePattern = /\b[A-Z][a-z]{3,}\b/g

  while ((match = standaloneNamePattern.exec(cleanedText)) !== null) {
    const matchText = match[0]

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Skip common words
    if (SKIP_WORDS.has(matchText)) continue

    // Skip blocklisted terms
    if (shouldIgnoreTerm(matchText)) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Get surrounding context (100 chars on each side for better context matching)
    const contextStart = Math.max(0, match.index - 100)
    const contextEnd = Math.min(cleanedText.length, match.index + matchText.length + 100)
    const context = cleanedText.substring(contextStart, contextEnd).toLowerCase()

    // Only include if context contains NPC-indicating phrases
    const hasNpcContext = npcContextVerbs.some((verb) => context.includes(verb))
    if (!hasNpcContext) continue

    // Get shorter context for the result
    const shortContextStart = Math.max(0, match.index - 50)
    const shortContextEnd = Math.min(cleanedText.length, match.index + matchText.length + 50)
    const shortContext = cleanedText.substring(shortContextStart, shortContextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context: shortContext,
    })
  }

  // Deduplicate by text (case-insensitive) and filter out blocklisted terms
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = r.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)

    // Skip if it's a sentence starter AND in blocklist (case-insensitive)
    if (sentenceStarters.has(key) && shouldIgnoreTerm(r.text)) {
      console.log(`Filtering sentence starter in blocklist: "${r.text}"`)
      return false
    }

    // Skip if single word and in blocklist (case-insensitive)
    if (!r.text.includes(' ') && shouldIgnoreTerm(r.text)) {
      console.log(`Filtering single word in blocklist: "${r.text}"`)
      return false
    }

    return true
  })
}

// Guess what type of entity a discovered name might be based on context
export function guessEntityType(
  text: string,
  context: string
): 'npc' | 'location' | 'item' | 'faction' | 'quest' | 'other' {
  const lowerContext = context.toLowerCase()
  const lowerText = text.toLowerCase()

  // First, check if it's a known spell (should be ignored/other)
  if (SPELL_NAMES.has(text)) {
    return 'other'
  }

  // Check if it's a blocklisted term
  if (shouldIgnoreTerm(text)) {
    return 'other'
  }

  // Check name structure first (strongest indicators)

  // Titles strongly indicate NPC
  if (/^(?:General|Admiral|Captain|Commander|Warlord|King|Queen|Prince|Princess|Lord|Lady|Duke|Duchess|Baron|Baroness|Count|Countess|Sir|Dame|Master|Mistress|Elder|Archmage|High Priest|Father|Mother|Brother|Sister|Chief|Emperor|Empress)/i.test(text)) {
    return 'npc'
  }

  // "Name the Epithet" pattern strongly indicates NPC
  if (/^[A-Z][a-z]+\s+the\s+[A-Z]/i.test(text)) {
    return 'npc'
  }

  // "The Adjective Noun" where Noun is a location word strongly indicates location
  if (/^the\s+[A-Z][a-z]+\s+(?:Keep|Glade|Forest|Mountain|Valley|Tower|Gate|Temple|Shrine|Citadel|Fortress|Castle|Palace|Falls|Depths|Spire|Hall|Tomb|Crypt|Sanctum)/i.test(text)) {
    return 'location'
  }

  // Use blocklist pattern matchers for strong indicators in the name itself
  // NPC patterns (titles, epithets)
  if (matchesNpcPattern(text)) {
    return 'npc'
  }

  // Location patterns (words like "Castle", "Forest", etc. in the name)
  if (matchesLocationPattern(text)) {
    return 'location'
  }

  // Faction patterns (words like "Guild", "Order", etc. in the name)
  if (matchesFactionPattern(text)) {
    return 'faction'
  }

  // Item patterns (words like "Sword", "Ring", etc. in the name)
  if (matchesItemPattern(text)) {
    return 'item'
  }

  // Check context for location indicators (before NPC context - more specific)
  const locationContextIndicators = [
    'city of', 'town of', 'village of', 'kingdom of', 'realm of',
    'in the', 'at the', 'traveled to', 'arrived at', 'from the',
    'located in', 'hidden in', 'beneath', 'within the walls of',
    'the ruins of', 'the gates of', 'the streets of'
  ]
  if (locationContextIndicators.some((w) => lowerContext.includes(w))) {
    return 'location'
  }

  // Check context for NPC creation/interaction indicators
  const npcContextIndicators = [
    'crafted by', 'forged by', 'made by', 'created by', 'wielded by',
    'carried by', 'owned by', 'belonged to', 'said', 'spoke', 'told',
    'the hero', 'the villain', 'the smith', 'the mage', 'the warrior',
    'assassin', 'blacksmith', 'merchant', 'guard', 'soldier',
    'killed', 'murdered', 'betrayed', 'saved', 'helped'
  ]
  if (npcContextIndicators.some((w) => lowerContext.includes(w))) {
    return 'npc'
  }

  // Check context for clues - use the comprehensive indicator lists
  // Location context
  if (LOCATION_INDICATORS.contextWords.some((w) => lowerContext.includes(w))) {
    return 'location'
  }

  // Faction context
  if (FACTION_INDICATORS.contextWords.some((w) => lowerContext.includes(w))) {
    return 'faction'
  }
  if (FACTION_INDICATORS.factionWords.some((w) => lowerContext.includes(w))) {
    return 'faction'
  }

  // Item context
  if (ITEM_INDICATORS.contextWords.some((w) => lowerContext.includes(w))) {
    return 'item'
  }

  // NPC context (action verbs suggest a person)
  if (NPC_INDICATORS.contextWords.some((w) => lowerContext.includes(w))) {
    return 'npc'
  }

  // Quest indicators in context
  const questWords = [
    'quest',
    'mission',
    'task',
    'objective',
    'goal',
    'prophecy',
    'legend',
    'rumor',
    'bounty',
  ]
  if (questWords.some((w) => lowerContext.includes(w))) {
    return 'quest'
  }

  // Check if the text itself looks like a person's name (first + last name pattern)
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(text)) {
    return 'npc'
  }

  // Default to NPC for unknown proper nouns (most common entity type in D&D)
  return 'npc'
}
