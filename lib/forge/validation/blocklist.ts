// Blocklist and indicator patterns for entity scanning
// Used to filter out false positives and improve entity type guessing

/**
 * Terms that should never be detected as entities, even if capitalized.
 * Includes D&D terminology, game mechanics, and common fantasy words.
 */
export const IGNORED_TERMS = new Set([
  // D&D Mechanics
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
  'Armor Class',
  'Hit Points',
  'Hit Dice',
  'Spell Slots',
  'Proficiency Bonus',
  'Saving Throw',
  'Ability Check',
  'Skill Check',
  'Initiative',
  'Advantage',
  'Disadvantage',
  'Concentration',
  'Resistance',
  'Vulnerability',
  'Immunity',
  'Action',
  'Bonus Action',
  'Reaction',
  'Movement',
  'Opportunity Attack',
  'Ranged Attack',
  'Melee Attack',
  'Critical Hit',
  'Natural Twenty',
  'Spell Save',
  'Death Save',
  'Death Saving Throw',

  // D&D Classes
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
  'Artificer',
  'Blood Hunter',

  // D&D Races
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
  'Dragonborn',
  'Aasimar',
  'Genasi',
  'Goliath',
  'Tabaxi',
  'Kenku',
  'Firbolg',
  'Triton',
  'Yuan-ti',
  'Changeling',
  'Kalashtar',
  'Shifter',
  'Warforged',
  'Goblin',
  'Hobgoblin',
  'Bugbear',
  'Kobold',
  'Orc',
  'Lizardfolk',
  'Tortle',

  // Common monster types
  'Dragon',
  'Giant',
  'Undead',
  'Fiend',
  'Celestial',
  'Fey',
  'Elemental',
  'Construct',
  'Monstrosity',
  'Aberration',
  'Ooze',
  'Plant',
  'Beast',
  'Humanoid',

  // Equipment types
  'Longsword',
  'Shortsword',
  'Greatsword',
  'Rapier',
  'Scimitar',
  'Dagger',
  'Battleaxe',
  'Greataxe',
  'Handaxe',
  'Warhammer',
  'Maul',
  'Flail',
  'Morningstar',
  'Quarterstaff',
  'Spear',
  'Javelin',
  'Trident',
  'Pike',
  'Halberd',
  'Glaive',
  'Longbow',
  'Shortbow',
  'Crossbow',
  'Light Crossbow',
  'Heavy Crossbow',
  'Hand Crossbow',
  'Sling',
  'Blowgun',
  'Leather Armor',
  'Studded Leather',
  'Hide Armor',
  'Chain Shirt',
  'Scale Mail',
  'Breastplate',
  'Half Plate',
  'Ring Mail',
  'Chain Mail',
  'Splint Armor',
  'Plate Armor',
  'Padded Armor',

  // Magic schools and types
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
  'Arcane',
  'Divine',
  'Primal',
  'Psionic',

  // Conditions
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion',

  // Damage types
  'Bludgeoning',
  'Piercing',
  'Slashing',
  'Fire',
  'Cold',
  'Lightning',
  'Thunder',
  'Acid',
  'Poison',
  'Necrotic',
  'Radiant',
  'Force',
  'Psychic',

  // Alignments
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',

  // Common item properties
  'Finesse',
  'Versatile',
  'Two-Handed',
  'Light',
  'Heavy',
  'Reach',
  'Thrown',
  'Loading',
  'Ammunition',
  'Special',

  // Time references
  'Dawn',
  'Dusk',
  'Midnight',
  'Noon',
  'Morning',
  'Evening',
  'Night',
  'Day',
  'Week',
  'Month',
  'Year',
  'Century',
  'Age',
  'Era',

  // Directions
  'North',
  'South',
  'East',
  'West',
  'Northeast',
  'Northwest',
  'Southeast',
  'Southwest',

  // Common fantasy terms
  'Magic',
  'Magical',
  'Curse',
  'Cursed',
  'Blessing',
  'Blessed',
  'Holy',
  'Unholy',
  'Sacred',
  'Profane',
  'Enchanted',
  'Forged',
  'Crafted',
  'Created',
  'Imbued',
  'Mundane',
  'Ancient',
  'Lost',
  'Hidden',
  'Secret',
  'Forbidden',
  'Legendary',
  'Mythical',
  'Artifact',

  // Generic terms
  'Unknown',
  'None',
  'Other',
  'Various',
  'Multiple',
  'Several',
  'Many',
  'Few',
])

/**
 * Patterns that strongly indicate an NPC name.
 * Used both for detection and type guessing.
 */
export const NPC_INDICATORS = {
  // Titles that precede names
  titlePrefixes: [
    /^Lord\s+/i,
    /^Lady\s+/i,
    /^King\s+/i,
    /^Queen\s+/i,
    /^Prince\s+/i,
    /^Princess\s+/i,
    /^Duke\s+/i,
    /^Duchess\s+/i,
    /^Baron\s+/i,
    /^Baroness\s+/i,
    /^Count\s+/i,
    /^Countess\s+/i,
    /^Earl\s+/i,
    /^Marquis\s+/i,
    /^Marquess\s+/i,
    /^Viscount\s+/i,
    /^Sir\s+/i,
    /^Dame\s+/i,
    /^Master\s+/i,
    /^Mistress\s+/i,
    /^Captain\s+/i,
    /^Commander\s+/i,
    /^General\s+/i,
    /^Admiral\s+/i,
    /^Chief\s+/i,
    /^Doctor\s+/i,
    /^Professor\s+/i,
    /^Elder\s+/i,
    /^High\s+Priest/i,
    /^Priestess\s+/i,
    /^Archmage\s+/i,
    /^Archdruid\s+/i,
    /^Grand\s+Master\s+/i,
    /^Father\s+/i,
    /^Mother\s+/i,
    /^Brother\s+/i,
    /^Sister\s+/i,
    /^Saint\s+/i,
  ],

  // Epithets that follow names (e.g., "Vorn the Terrible")
  epithetPatterns: [
    /\s+the\s+[A-Z][a-z]+$/i,           // "the Terrible", "the Wise"
    /\s+of\s+the\s+[A-Z][a-z]+$/i,      // "of the Mists", "of the North"
    /\s+of\s+[A-Z][a-z]+$/i,            // "of Shadowdale", "of Waterdeep"
    /\s+[IVXLCDM]+$/,                    // Roman numerals: "III", "IV"
  ],

  // Context words that suggest a nearby name is an NPC
  contextWords: [
    'said',
    'spoke',
    'replied',
    'asked',
    'answered',
    'whispered',
    'shouted',
    'exclaimed',
    'nodded',
    'shook',
    'smiled',
    'frowned',
    'laughed',
    'sighed',
    'looked',
    'gazed',
    'glanced',
    'turned',
    'walked',
    'ran',
    'stood',
    'sat',
    'died',
    'killed',
    'murdered',
    'betrayed',
    'saved',
    'helped',
    'attacked',
    'defended',
  ],
}

/**
 * Patterns that strongly indicate a location name.
 * Used both for detection and type guessing.
 */
export const LOCATION_INDICATORS = {
  // Words commonly found in location names
  locationWords: [
    'mountains',
    'mountain',
    'mount',
    'peak',
    'summit',
    'ridge',
    'hills',
    'hill',
    'forest',
    'woods',
    'woodland',
    'grove',
    'thicket',
    'jungle',
    'lake',
    'river',
    'stream',
    'creek',
    'falls',
    'waterfall',
    'sea',
    'ocean',
    'bay',
    'gulf',
    'strait',
    'island',
    'isle',
    'archipelago',
    'peninsula',
    'coast',
    'shore',
    'beach',
    'castle',
    'fortress',
    'citadel',
    'stronghold',
    'keep',
    'tower',
    'spire',
    'palace',
    'manor',
    'estate',
    'city',
    'town',
    'village',
    'hamlet',
    'settlement',
    'outpost',
    'camp',
    'vale',
    'valley',
    'canyon',
    'gorge',
    'ravine',
    'plains',
    'prairie',
    'steppe',
    'tundra',
    'desert',
    'wasteland',
    'badlands',
    'swamp',
    'marsh',
    'bog',
    'fen',
    'mire',
    'wetlands',
    'port',
    'harbor',
    'haven',
    'dock',
    'pier',
    'hold',
    'hall',
    'temple',
    'shrine',
    'sanctum',
    'sanctuary',
    'monastery',
    'abbey',
    'cathedral',
    'chapel',
    'dungeon',
    'cavern',
    'cave',
    'grotto',
    'mines',
    'quarry',
    'pit',
    'chasm',
    'rift',
    'realm',
    'kingdom',
    'empire',
    'domain',
    'territory',
    'province',
    'region',
    'land',
    'lands',
    'road',
    'path',
    'trail',
    'way',
    'pass',
    'crossing',
    'bridge',
    'gate',
    'gates',
    'wall',
    'district',
    'quarter',
    'ward',
    'market',
    'square',
    'plaza',
    'inn',
    'tavern',
    'pub',
    'alehouse',
  ],

  // Context words that suggest a nearby name is a location
  contextWords: [
    'located',
    'situated',
    'found in',
    'lies in',
    'lies at',
    'stands in',
    'built in',
    'built on',
    'traveled to',
    'journeyed to',
    'arrived at',
    'arrived in',
    'departed from',
    'left from',
    'returned to',
    'heading to',
    'going to',
    'from the',
    'in the',
    'at the',
    'near the',
    'outside',
    'within',
    'beyond',
  ],
}

/**
 * Patterns that indicate faction/organization names.
 */
export const FACTION_INDICATORS = {
  // Words commonly found in faction names
  factionWords: [
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
    'circle',
    'council',
    'assembly',
    'consortium',
    'syndicate',
    'cartel',
    'army',
    'legion',
    'band',
    'company',
    'faction',
    'alliance',
    'coalition',
    'league',
    'union',
    'confederation',
    'pact',
    'covenant',
    'cabal',
    'coven',
    'conclave',
  ],

  // Context words
  contextWords: [
    'member of',
    'belongs to',
    'joined',
    'leader of',
    'leads the',
    'founded',
    'established',
    'represents',
    'allied with',
    'enemies of',
    'rivals of',
  ],
}

/**
 * Patterns that indicate item names.
 */
export const ITEM_INDICATORS = {
  // Words commonly found in item names
  itemWords: [
    'sword',
    'blade',
    'dagger',
    'knife',
    'axe',
    'hammer',
    'mace',
    'flail',
    'spear',
    'lance',
    'bow',
    'crossbow',
    'staff',
    'wand',
    'rod',
    'orb',
    'ring',
    'amulet',
    'necklace',
    'pendant',
    'bracelet',
    'bracer',
    'gauntlet',
    'glove',
    'helm',
    'helmet',
    'crown',
    'circlet',
    'mask',
    'cloak',
    'robe',
    'armor',
    'shield',
    'boots',
    'greaves',
    'belt',
    'sash',
    'tome',
    'book',
    'scroll',
    'grimoire',
    'codex',
    'gem',
    'jewel',
    'crystal',
    'stone',
    'potion',
    'elixir',
    'philter',
    'tincture',
    'artifact',
    'relic',
    'treasure',
    'hoard',
  ],

  // Context words
  contextWords: [
    'wielded',
    'wielding',
    'carried',
    'carrying',
    'worn',
    'wearing',
    'holds',
    'holding',
    'possesses',
    'possessing',
    'bears',
    'bearing',
    'forged',
    'crafted',
    'enchanted',
    'imbued',
    'created',
  ],
}

/**
 * Pre-computed lowercase set for case-insensitive lookups
 */
const IGNORED_TERMS_LOWER = new Set(
  Array.from(IGNORED_TERMS).map((t) => t.toLowerCase())
)

/**
 * Check if a term should be ignored (not detected as an entity).
 */
export function shouldIgnoreTerm(term: string): boolean {
  // Check exact match first (faster)
  if (IGNORED_TERMS.has(term)) return true

  // Check case-insensitive match
  return IGNORED_TERMS_LOWER.has(term.toLowerCase())
}

/**
 * Check if a name matches NPC patterns.
 */
export function matchesNpcPattern(name: string): boolean {
  // Check title prefixes
  if (NPC_INDICATORS.titlePrefixes.some(p => p.test(name))) {
    return true
  }

  // Check epithet patterns
  if (NPC_INDICATORS.epithetPatterns.some(p => p.test(name))) {
    return true
  }

  return false
}

/**
 * Check if a name matches location patterns.
 */
export function matchesLocationPattern(name: string): boolean {
  const lowerName = name.toLowerCase()
  return LOCATION_INDICATORS.locationWords.some(w => lowerName.includes(w))
}

/**
 * Check if a name matches faction patterns.
 */
export function matchesFactionPattern(name: string): boolean {
  const lowerName = name.toLowerCase()
  return FACTION_INDICATORS.factionWords.some(w => lowerName.includes(w))
}

/**
 * Check if a name matches item patterns.
 */
export function matchesItemPattern(name: string): boolean {
  const lowerName = name.toLowerCase()
  return ITEM_INDICATORS.itemWords.some(w => lowerName.includes(w))
}
