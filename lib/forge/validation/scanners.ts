// Entity mention scanners for post-generation text analysis

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
  const results: PotentialEntity[] = []
  const excludeLower = excludeEntityName?.toLowerCase()

  // Pattern 1: Quoted text (high confidence entity names)
  const quotedPattern = /"([A-Z][^"]+)"/g

  let match
  while ((match = quotedPattern.exec(text)) !== null) {
    const matchText = match[1].trim()

    // Skip if it's the entity being created
    if (excludeLower && matchText.toLowerCase() === excludeLower) continue

    // Skip known spell names
    if (SPELL_NAMES.has(matchText)) continue

    // Get surrounding context (50 chars on each side)
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(text.length, match.index + matchText.length + 50)
    const context = text.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 2: Multi-word proper nouns (e.g., "The Drowned Rat", "Iron Fist Guild")
  // Matches: "The X Y", "X Y Z", etc. where words are capitalized
  const multiWordPattern = /(?:The\s+)?[A-Z][a-z]+(?:\s+(?:of|the|and|de|von|van)\s+)?(?:\s*[A-Z][a-z]+)+/g

  while ((match = multiWordPattern.exec(text)) !== null) {
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
    const contextEnd = Math.min(text.length, match.index + matchText.length + 50)
    const context = text.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Pattern 3: Single proper nouns - ONLY if they appear mid-sentence (not at start)
  // and are likely names (followed by verbs or specific patterns)
  // More restrictive to avoid false positives
  const singleWordPattern = /(?<=[\.\!\?]\s+[A-Z][a-z]+\s+)[A-Z][a-z]{2,}(?=[,\s\.\!\?\'\"])|(?<=[,;:]\s*)[A-Z][a-z]{2,}(?=[,\s\.\!\?\'\"])/g

  while ((match = singleWordPattern.exec(text)) !== null) {
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
    const contextEnd = Math.min(text.length, match.index + matchText.length + 50)
    const context = text.substring(contextStart, contextEnd)

    results.push({
      text: matchText,
      startIndex: match.index,
      endIndex: match.index + matchText.length,
      context,
    })
  }

  // Deduplicate by text (case-insensitive)
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = r.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
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

  // Check if text itself contains title patterns (strong NPC indicator)
  const npcTitlePatterns = [
    /^lord\s+/i,
    /^lady\s+/i,
    /^king\s+/i,
    /^queen\s+/i,
    /^prince\s+/i,
    /^princess\s+/i,
    /^duke\s+/i,
    /^duchess\s+/i,
    /^baron\s+/i,
    /^baroness\s+/i,
    /^count\s+/i,
    /^countess\s+/i,
    /^sir\s+/i,
    /^dame\s+/i,
    /^master\s+/i,
    /^mistress\s+/i,
    /^captain\s+/i,
    /^commander\s+/i,
    /^chief\s+/i,
    /^doctor\s+/i,
    /^professor\s+/i,
    /^elder\s+/i,
    /^high\s+priest/i,
    /^archmage\s+/i,
  ]
  if (npcTitlePatterns.some((p) => p.test(text))) {
    return 'npc'
  }

  // Check for "the [Title]" pattern (e.g., "Vorn the Terrible", "Mirella of the Mists")
  if (/\s+the\s+[A-Z]/i.test(text) || /\s+of\s+the\s+/i.test(text)) {
    return 'npc'
  }

  // Location indicators - check if the text itself contains location words
  const locationInNameWords = [
    'mountains',
    'mountain',
    'forest',
    'woods',
    'lake',
    'river',
    'sea',
    'ocean',
    'island',
    'castle',
    'tower',
    'fortress',
    'citadel',
    'city',
    'town',
    'village',
    'vale',
    'valley',
    'plains',
    'desert',
    'swamp',
    'marsh',
    'bay',
    'port',
    'harbor',
    'keep',
    'hold',
    'hall',
    'palace',
    'temple',
    'shrine',
    'sanctum',
    'dungeon',
    'cavern',
    'cave',
    'mines',
    'realm',
    'kingdom',
    'empire',
  ]
  if (locationInNameWords.some((w) => lowerText.includes(w))) {
    return 'location'
  }

  // Location indicators in context
  const locationWords = [
    'tavern',
    'inn',
    'city',
    'village',
    'town',
    'forest',
    'mountain',
    'river',
    'lake',
    'ocean',
    'sea',
    'island',
    'castle',
    'tower',
    'dungeon',
    'cave',
    'temple',
    'shrine',
    'market',
    'district',
    'quarter',
    'street',
    'road',
    'path',
    'bridge',
    'gate',
    'wall',
    'kingdom',
    'realm',
    'land',
    'region',
    'province',
    'territory',
    'located',
    'situated',
    'found in',
    'lies in',
    'stands in',
  ]
  if (locationWords.some((w) => lowerContext.includes(w))) {
    return 'location'
  }

  // Item indicators
  const itemWords = [
    'sword',
    'blade',
    'ring',
    'amulet',
    'necklace',
    'potion',
    'elixir',
    'staff',
    'wand',
    'weapon',
    'armor',
    'shield',
    'helm',
    'boots',
    'gloves',
    'cloak',
    'robe',
    'artifact',
    'relic',
    'treasure',
    'gem',
    'jewel',
    'crystal',
    'orb',
    'tome',
    'book',
    'scroll',
    'wielded',
    'carried',
    'worn',
    'holds',
    'possesses',
  ]
  if (itemWords.some((w) => lowerContext.includes(w))) {
    return 'item'
  }

  // Faction indicators
  const factionWords = [
    'guild',
    'order',
    'brotherhood',
    'sisterhood',
    'clan',
    'tribe',
    'house',
    'family',
    'organization',
    'society',
    'cult',
    'church',
    'temple',
    'army',
    'legion',
    'band',
    'group',
    'faction',
    'alliance',
    'council',
    'member of',
    'belongs to',
    'joined',
    'leader of',
  ]
  if (factionWords.some((w) => lowerContext.includes(w))) {
    return 'faction'
  }

  // Quest indicators
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

  // NPC name patterns in context (titles, etc.)
  const npcContextPatterns = [
    /lord\s+/i,
    /lady\s+/i,
    /king\s+/i,
    /queen\s+/i,
    /prince\s+/i,
    /princess\s+/i,
    /duke\s+/i,
    /duchess\s+/i,
    /baron\s+/i,
    /baroness\s+/i,
    /count\s+/i,
    /countess\s+/i,
    /sir\s+/i,
    /dame\s+/i,
    /master\s+/i,
    /mistress\s+/i,
    /captain\s+/i,
    /commander\s+/i,
    /chief\s+/i,
  ]
  if (npcContextPatterns.some((p) => p.test(lowerContext))) {
    return 'npc'
  }

  // Check if the text itself looks like a person's name (first + last name pattern)
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(text)) {
    return 'npc'
  }

  // Default to NPC for unknown proper nouns
  return 'npc'
}
