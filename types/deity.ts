// Deity ranks representing divine power hierarchy
export type DeityRank =
  | 'greater_deity'      // Cosmic power (Pelor, Tiamat)
  | 'intermediate_deity' // Regional/domain focused (Helm, Sune)
  | 'lesser_deity'       // Limited portfolio (Shaundakul)
  | 'demigod'            // Mortal-born or diminished
  | 'quasi_deity'        // Worshipped beings (Demon lords, Archfey)
  | 'dead_god'           // Slain or forgotten
  | 'primordial'         // Pre-deity elemental beings
  | 'ascended';          // Mortals who became gods

export const DEITY_RANKS: { value: DeityRank; label: string; description: string }[] = [
  { value: 'greater_deity', label: 'Greater Deity', description: 'Cosmic powers with vast influence' },
  { value: 'intermediate_deity', label: 'Intermediate Deity', description: 'Regional or domain-focused gods' },
  { value: 'lesser_deity', label: 'Lesser Deity', description: 'Gods with limited portfolios' },
  { value: 'demigod', label: 'Demigod', description: 'Mortal-born or diminished divine beings' },
  { value: 'quasi_deity', label: 'Quasi-Deity', description: 'Powerful beings worshipped as gods' },
  { value: 'dead_god', label: 'Dead God', description: 'Slain or forgotten deities' },
  { value: 'primordial', label: 'Primordial', description: 'Pre-deity elemental beings' },
  { value: 'ascended', label: 'Ascended', description: 'Mortals who achieved godhood' },
];

// How actively the deity interacts with the mortal world
export type DivineDistance =
  | 'distant'           // Gods don't interfere
  | 'symbolic'          // Signs and omens only
  | 'interventionist';  // Direct divine action

export const DIVINE_DISTANCES: { value: DivineDistance; label: string; description: string }[] = [
  { value: 'distant', label: 'Distant', description: 'Rarely interferes in mortal affairs' },
  { value: 'symbolic', label: 'Symbolic', description: 'Communicates through signs and omens' },
  { value: 'interventionist', label: 'Interventionist', description: 'Actively involves in mortal affairs' },
];

// Standard D&D domains
export const DEITY_DOMAINS = [
  'Light', 'Life', 'Death', 'War', 'Nature', 'Tempest',
  'Knowledge', 'Trickery', 'Forge', 'Grave', 'Order', 'Peace',
  'Twilight', 'Arcana', 'Blood', 'Madness', 'Time', 'Luck',
] as const;

export type DeityDomain = typeof DEITY_DOMAINS[number];

// Standard alignments
export const DEITY_ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
] as const;

export type DeityAlignment = typeof DEITY_ALIGNMENTS[number];

// Deity's domains, symbol, and religious trappings
export interface DeityPortfolio {
  domains: string[];           // Light, Life, War, Death, etc.
  alignment: string;           // Lawful Good, Chaotic Neutral, etc.
  symbol: string;              // "Golden sun rising from broken sword"
  favored_weapon?: string;     // "Longsword"
  holy_day?: string;           // "Summer Solstice"
  sacred_colors: string[];     // ["Gold", "White"]
  sacred_animal?: string;      // "Phoenix"
}

// Divine signals - how the deity communicates with mortals
export interface DivineSignals {
  distance: DivineDistance;
  omens: {
    watching: string[];        // Subtle signs deity is observing
    pleased: string[];         // Signs of divine favor
    angry: string[];           // Signs of divine displeasure
  };
  boons: {
    trigger: string;           // "When a follower risks their life for another"
    effect: string;            // "Advantage on next death save"
  }[];
  curses: {
    trigger: string;           // "When a follower breaks an oath"
    effect: string;            // "Sunlight burns for 1d4 damage"
  }[];
}

// How worship is conducted
export interface DeityWorship {
  followers: string;           // Who worships them
  clergy_title: string;        // "Dawnbringer", "Sunpriest"
  temple_style: string;        // Description of temples
  rituals: string[];           // Common worship practices
  offerings: string[];         // What pleases the god
  taboos: string[];            // What offends them
}

// Speakable prayers for players
export interface DeityPrayers {
  invocation: string;          // "By the light of the Reborn Sun..."
  blessing: string;            // "May Solarius guide your path"
  oath: string;                // "I swear by the Dawn..."
}

// Soul - Player-facing knowledge about the deity
export interface DeitySoul {
  titles: string[];            // "The Morninglord", "He Who Rose"
  portfolio: DeityPortfolio;
  manifestation: string;       // How they appear to mortals
  personality: string;         // Divine temperament
  voice: string;               // How they communicate
  tenets: string[];            // 3-5 core commandments
  prayers: DeityPrayers;
  worship: DeityWorship;
}

// Brain - DM-only truth about the deity
export interface DeityBrain {
  true_nature: string;         // What the god is REALLY like
  divine_agenda: string;       // What they're working toward
  secrets: string;             // Hidden truths
  divine_signals: DivineSignals;
  conflicts: string;           // Rivalries with other gods
  weaknesses: string;          // How to oppose them
  hooks: string[];             // Adventure hooks involving this deity
}

// Mechanics - Game system information
export interface DeityMechanics {
  cleric_domains: string[];    // 5e domain options
  channel_divinity?: string;   // Special ability description
  sacred_spells: string[];     // Associated spells
  suggested_classes: string[]; // Cleric, Paladin, Warlock, etc.
}

// Discovery - Related entities to create
export interface DeityDiscovery {
  id: string;
  name: string;
  entity_type: 'npc' | 'location' | 'faction' | 'item' | 'event' | 'deity';
  brief: string;
  connection: string;
  status?: 'pending' | 'saved' | 'ignored';
}

// Full deity entity structure
export interface DeityEntity {
  id: string;
  campaign_id: string;
  entity_type: 'deity';
  sub_type: DeityRank;
  name: string;
  status: 'active' | 'stub' | 'archived';

  // Structured content
  soul: DeitySoul;
  brain: DeityBrain;
  mechanics: DeityMechanics;

  // Standard fields
  created_at: string;
  updated_at: string;
}

// Generation response from API
export interface DeityGeneration {
  name: string;
  rank: DeityRank;
  soul: DeitySoul;
  brain: DeityBrain;
  mechanics: DeityMechanics;
  discoveries: DeityDiscovery[];
}
