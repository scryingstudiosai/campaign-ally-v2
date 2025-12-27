// ============================================
// BRAIN/SOUL/VOICE TYPE SYSTEM
// Campaign Ally Living Entity Architecture
// ============================================

// === FACT SYSTEM ===
export type FactCategory =
  | 'lore'
  | 'plot'
  | 'mechanical'
  | 'secret'
  | 'flavor'
  | 'appearance'
  | 'personality'
  | 'backstory';

export type Visibility = 'public' | 'limited' | 'dm_only';
export type SourceType = 'generated' | 'manual' | 'session' | 'import';

export interface Fact {
  id: string;
  entity_id: string;
  campaign_id: string;
  content: string;
  category: FactCategory;
  visibility: Visibility;
  known_by: string[];
  is_current: boolean;
  established_at_session_id?: string;
  established_at_text?: string;
  superseded_at_session_id?: string;
  superseded_by_fact_id?: string;
  source_type: SourceType;
  source_entity_id?: string;
  created_at: string;
  updated_at: string;
}

// Factory function for creating facts
export function createFact(
  entityId: string,
  campaignId: string,
  content: string,
  category: FactCategory,
  options?: Partial<Fact>
): Omit<Fact, 'id' | 'created_at' | 'updated_at'> {
  return {
    entity_id: entityId,
    campaign_id: campaignId,
    content,
    category,
    visibility: 'dm_only',
    known_by: [],
    is_current: true,
    source_type: 'generated',
    ...options,
  };
}


// === RELATIONSHIP SYSTEM ===
export type RelationshipIntensity = 'low' | 'medium' | 'high';

export interface Relationship {
  id: string;
  campaign_id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;

  // Surface (visible based on visibility)
  surface_description?: string;
  intensity: RelationshipIntensity;
  visibility: Visibility;

  // Depth (DM secrets)
  deep_truth?: string;
  deep_truth_visibility: Visibility;
  tension?: string;
  potential_reveal?: string;

  // Temporal
  established_at_session_id?: string;
  ended_at_session_id?: string;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;

  // Joined data (when fetching)
  target_entity?: {
    id: string;
    name: string;
    entity_type: string;
  };
  source_entity?: {
    id: string;
    name: string;
    entity_type: string;
  };
}


// === BRAIN SYSTEM ===

// Base brain - all brains extend this
export interface BaseBrain {
  [key: string]: unknown;
}

// Default empty brain for entities without brain data
export const DEFAULT_BRAIN: BaseBrain = {};

// NPC Brain
export interface NpcBrain extends BaseBrain {
  desire: string;
  fear: string;
  leverage: string;
  line: string;
}

export const DEFAULT_NPC_BRAIN: NpcBrain = {
  desire: '',
  fear: '',
  leverage: '',
  line: '',
};

// Villain Brain (extends NPC)
export interface VillainBrain extends NpcBrain {
  scheme: string;
  scheme_phase: 'planning' | 'executing' | 'desperate';
  resources: string[];
  escape_plan: string;
  escalation: string;
}

export const DEFAULT_VILLAIN_BRAIN: VillainBrain = {
  ...DEFAULT_NPC_BRAIN,
  scheme: '',
  scheme_phase: 'planning',
  resources: [],
  escape_plan: '',
  escalation: '',
};

// Hero Brain (extends NPC)
export interface HeroBrain extends NpcBrain {
  limitation: string;
  support_role: string;
  availability: string;
}

export const DEFAULT_HERO_BRAIN: HeroBrain = {
  ...DEFAULT_NPC_BRAIN,
  limitation: '',
  support_role: '',
  availability: '',
};

// Location Sub-Types
export type LocationSubType =
  | 'region'      // Kingdoms, territories, wilderness areas
  | 'settlement'  // Cities, towns, villages
  | 'district'    // Neighborhoods, wards, quarters
  | 'building'    // Taverns, temples, shops, dungeons
  | 'room'        // Specific rooms, chambers, areas within buildings
  | 'landmark'    // Natural features, monuments, points of interest
  | 'dungeon';    // Adventure sites, ruins, lairs

// Location Brain - The "Purpose" of the place
export interface LocationInhabitant {
  name: string;
  role: string;
  hook?: string;
}

// Staff/owner reference in a location (DM-facing)
export interface LocationStaffMember {
  name: string;
  role: string;
  entity_id?: string;        // Reference to NPC entity if created
}

export interface LocationBrain extends BaseBrain {
  purpose?: string;           // Why does this place exist? What function does it serve?
  atmosphere?: string;        // The overall mood/feeling (oppressive, welcoming, mysterious)
  danger_level?: 'safe' | 'low' | 'moderate' | 'high' | 'deadly';
  secret?: string;            // What's hidden here that players might discover?
  history?: string;           // Key historical events that shaped this place
  current_state?: string;     // What's happening here NOW? (under siege, thriving, abandoned)
  conflict?: string;          // What tension or problem exists here?
  opportunity?: string;       // What can players gain here? (allies, treasure, information)
  // Hierarchy
  parent_location_id?: string; // UUID of containing location
  contains?: string[];         // Names/types of sub-locations
  // NPCs (from generation)
  inhabitants?: LocationInhabitant[]; // NPCs found at this location (generation input)
  // NPCs (after stub creation)
  staff?: LocationStaffMember[];     // All staff/inhabitants with entity IDs
  owner?: LocationStaffMember;       // Primary owner/proprietor
  // Legacy fields
  mood?: string;
  law?: 'lawful' | 'neutral' | 'lawless';
  hidden_purpose?: string;
}

export const DEFAULT_LOCATION_BRAIN: LocationBrain = {
  danger_level: 'moderate',
};

// Key figure reference in a location
export interface LocationKeyFigure {
  name: string;
  role: string;
  entity_id?: string;        // Reference to NPC entity if created
}

// Location Soul - The "Texture" that makes it memorable
export interface LocationSoul {
  sights?: string[];          // Visual details players notice
  sounds?: string[];          // Ambient audio
  smells?: string[];          // Distinctive scents
  textures?: string[];        // What things feel like
  temperature?: string;       // Hot, cold, humid, etc.
  lighting?: string;          // Bright, dim, flickering, magical
  distinctive_feature?: string; // The ONE thing that makes this place unique
  mood?: string;              // Emotional tone (dread, wonder, melancholy)
  key_figures?: LocationKeyFigure[]; // Important NPCs found here
}

export const DEFAULT_LOCATION_SOUL: LocationSoul = {};

// Location Mechanics - Game-relevant details
export interface LocationMechanics {
  size?: string;              // Rough dimensions or area
  terrain?: string[];         // Terrain types (difficult, obscured, etc.)
  hazards?: Array<{
    name: string;
    description: string;
    dc?: number;
    damage?: string;
    effect?: string;
  }>;
  resources?: string[];       // What can be found/harvested here
  travel_time?: {
    from?: string;            // From where
    duration?: string;        // How long
    method?: string;          // On foot, by horse, by ship
  };
  encounters?: Array<{
    name: string;
    likelihood: 'common' | 'uncommon' | 'rare';
    cr_range?: string;
  }>;
  resting?: {
    safe_rest?: boolean;
    long_rest_available?: boolean;
    cost?: string;            // For inns
  };
  // Shop-related properties
  is_shop?: boolean;
  shop_type?: string;
  price_modifier?: number;
  // Tavern/Inn-related properties
  is_tavern?: boolean;
  establishment_quality?: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'aristocratic';
  lodging?: {
    available: boolean;
    rooms: Array<{
      type: string;
      price_per_night: number;
      description: string;
    }>;
  };
  menu?: {
    drinks: Array<{
      name: string;
      price: number;
      description: string;
    }>;
    meals: Array<{
      name: string;
      price: number;
      description: string;
    }>;
    specialty?: {
      name: string;
      price: number;
      description: string;
    };
  };
}

export const DEFAULT_LOCATION_MECHANICS: LocationMechanics = {};

// Item Mechanics - the "body" of the item (separable from lore for reskinning)
export interface ItemMechanics {
  base_item?: string;              // "longsword", "dagger", "plate armor"
  damage?: string;                 // "1d8 slashing"
  damage_type?: string;            // "slashing", "piercing", "radiant"
  bonus?: string;                  // "+1", "+2", "+3"
  properties?: string[];           // ["finesse", "light", "versatile (1d10)"]
  range?: string;                  // "20/60" for thrown/ranged
  ac_bonus?: number;               // For armor/shields
  charges?: {
    current?: number;
    max: number;
    recharge?: string;             // "dawn", "long rest", "never"
  };
  abilities?: Array<{
    name: string;
    description: string;
    cost?: string;                 // "1 charge", "bonus action", "1/day"
    duration?: string;             // "1 minute", "until dispelled"
  }>;
  attunement?: boolean;
  attunement_requirements?: string; // "a creature of good alignment"
  spell_save_dc?: number;          // For items that force saves
  spell_attack_bonus?: number;     // For wands/staves
}

export const DEFAULT_ITEM_MECHANICS: ItemMechanics = {
  properties: [],
  attunement: false,
};

// Item Brain - the "soul" of the item (lore, separate from mechanics)
export interface ItemBrain extends BaseBrain {
  origin?: string;           // Who made it and why
  history?: string;          // Notable events, previous owners
  secret?: string;           // Hidden properties or true purpose
  trigger?: string;          // What activates special abilities
  hunger?: string;           // If sentient, what does it crave?
  cost?: string;             // The catch or drawback for using it
  sentience_level?: 'none' | 'dormant' | 'awakened' | 'dominant';
  // Legacy field for backward compatibility
  history_weight?: string;
  // NOTE: mechanics is NOT here - it's a sibling field on the entity
}

export const DEFAULT_ITEM_BRAIN: ItemBrain = {
  sentience_level: 'none',
};

// Faction Sub-Types
export type FactionSubType =
  | 'guild'
  | 'military'
  | 'religious'
  | 'criminal'
  | 'political'
  | 'merchant'
  | 'cult'
  | 'noble_house'
  | 'secret_society';

// Faction Brain - DM-facing logic
export interface FactionBrain extends BaseBrain {
  purpose?: string;        // Why this faction exists
  goals?: string;          // Long-term ambitions
  current_agenda?: string; // What they're doing RIGHT NOW
  methods?: string;        // How they operate (subtle, violent, bureaucratic)
  secret?: string;         // DM Only - hidden truth
  weakness?: string;       // How they can be undermined
  hierarchy?: string;      // Leadership structure description
  key_members?: string[];  // Names of leaders (become NPC stubs)
}

export const DEFAULT_FACTION_BRAIN: FactionBrain = {};

// Faction Soul - Player-facing identity
export interface FactionSoul {
  motto?: string;          // Their slogan or creed
  symbol?: string;         // Visual description of crest/emblem
  reputation?: string;     // How the public perceives them
  colors?: string[];       // Faction colors (e.g., "Crimson", "Gold")
  culture?: string;        // Values, traditions, rituals, vibe
  greeting?: string;       // How members greet each other
}

export const DEFAULT_FACTION_SOUL: FactionSoul = {};

// Faction Mechanics - Game stats and benefits
export interface FactionMechanics {
  influence?: 'negligible' | 'low' | 'moderate' | 'high' | 'dominant';
  wealth?: 'destitute' | 'poor' | 'moderate' | 'wealthy' | 'vast';
  military?: 'none' | 'militia' | 'guards' | 'army' | 'elite_forces';
  reach?: 'local' | 'regional' | 'national' | 'continental' | 'global';
  stability?: 'crumbling' | 'unstable' | 'stable' | 'thriving' | 'unshakeable';
  territory?: string[];    // Locations they control (become Location stubs)
  resources?: string[];    // Assets they control (ships, castles, artifacts)
  benefits?: string[];     // What players get for joining (renown rewards)
  requirements?: string;   // How to join / requirements for membership
}

export const DEFAULT_FACTION_MECHANICS: FactionMechanics = {};

// Encounter Sub-Types
export type EncounterSubType =
  | 'combat'
  | 'boss'
  | 'ambush'
  | 'defense'
  | 'chase'
  | 'stealth'
  | 'puzzle'
  | 'social'
  | 'exploration'
  | 'trap'
  | 'complex_trap'
  | 'skill_challenge';

// Encounter Brain - DM-facing logic
export interface EncounterBrain extends BaseBrain {
  purpose?: string;            // Why this encounter exists (story beat)
  objective?: string;          // What players need to accomplish
  tactics?: string;            // How enemies behave/fight
  trigger?: string;            // What initiates the encounter
  secret?: string;             // Hidden twist (DM only)
  scaling?: string;            // How to adjust difficulty
  failure_consequence?: string; // What happens if players lose/flee
  resolution?: string;         // Possible outcomes
  solution?: string;           // Answer key for puzzles/traps/skill challenges (DM only)
}

export const DEFAULT_ENCOUNTER_BRAIN: EncounterBrain = {};

// Encounter Soul - Player-facing atmosphere
export interface EncounterSoul {
  read_aloud?: string;         // Atmospheric description to read aloud
  sights?: string[];           // Visual details
  sounds?: string[];           // Audio atmosphere
  tension?: string;            // The mood/stakes
  environmental_features?: string[]; // Interactive terrain elements
}

export const DEFAULT_ENCOUNTER_SOUL: EncounterSoul = {};

// Encounter Phase - Dynamic combat stages
export interface EncounterPhase {
  trigger: string;             // "Round 3" or "Boss at 50% HP"
  description: string;         // What changes
}

// Encounter Creature Reference
export interface EncounterCreature {
  name: string;                // Creature name (prefer SRD names)
  count: number;               // How many
  role?: string;               // minion, brute, controller, boss, etc.
  notes?: string;              // Special behavior or modifications
}

// SRD Match info for auto-linking
export interface SrdCreatureMatch {
  id: string;
  name: string;
  cr: string;
  hp: number;
  ac: number;
  creature_type: string;
  confidence: number;
}

// Extended creature with SRD match info (for UI display)
export interface EncounterCreatureWithSrd extends EncounterCreature {
  srd_match?: SrdCreatureMatch | null;
  srd_status: 'srd_linked' | 'custom' | 'pending';
}

// Encounter Reward Item
export interface EncounterRewardItem {
  name: string;
  type?: string;               // weapon, armor, consumable, treasure, etc.
}

// Encounter Rewards
export interface EncounterRewards {
  xp?: number;
  gold?: number;
  items?: EncounterRewardItem[];
  story?: string;              // Narrative rewards (info, allies, reputation)
}

// Encounter Mechanics - Game stats
export interface EncounterMechanics {
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  party_size?: number;
  party_level?: string;        // "3-5" range or single number
  creatures?: EncounterCreature[];
  terrain?: string[];          // Terrain features
  hazards?: string[];          // Environmental dangers
  duration?: string;           // Expected real-time length
  phases?: EncounterPhase[];   // Dynamic combat stages
}

export const DEFAULT_ENCOUNTER_MECHANICS: EncounterMechanics = {};

// Quest Sub-Types
export type QuestSubType =
  | 'main'
  | 'side'
  | 'personal'
  | 'faction'
  | 'bounty';

// Quest Objective State
export type QuestObjectiveState = 'active' | 'locked' | 'completed' | 'failed';
export type QuestObjectiveType = 'required' | 'optional' | 'hidden';

// Quest Objective
export interface QuestObjective {
  id: string;
  title: string;
  description: string;
  type: QuestObjectiveType;
  state: QuestObjectiveState;
  unlock_condition?: string;
  parent_id?: string | null;
  hints?: string[];
}

// Quest Soul - Player-facing information
export interface QuestSoul {
  title?: string;
  hook?: string;
  summary?: string;
  stakes?: string;
  timeline?: 'immediate' | 'days' | 'weeks' | 'no_pressure';
}

export const DEFAULT_QUEST_SOUL: QuestSoul = {};

// Quest Brain - DM-only information
export interface QuestBrain extends BaseBrain {
  background?: string;
  twists?: string[];
  secret?: string;
  failure_consequences?: string;
  success_variations?: string[];
  dm_notes?: string;
  // Legacy fields for backward compatibility
  stakes?: string;
  complications?: string[];
  moral_tension?: string;
  time_pressure?: string;
}

export const DEFAULT_QUEST_BRAIN: QuestBrain = {};

// Quest Reward Item
export interface QuestRewardItem {
  name: string;
  type?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary';
  description?: string;
}

// Quest Reputation Change
export interface QuestReputationChange {
  faction: string;
  change: string;
}

// Quest Rewards
export interface QuestRewards {
  xp?: number;
  gold?: number | string;
  items?: QuestRewardItem[];
  reputation?: QuestReputationChange[];
  special?: string;
}

export const DEFAULT_QUEST_REWARDS: QuestRewards = {};

// Quest Chain
export interface QuestChain {
  arc_id?: string | null;           // UUID of the first quest in the chain (anchor)
  arc_name?: string | null;          // Overarching story arc name - NEVER changes for sequels
  chain_position?: string | null;    // "Part 2 of 3"
  total_parts?: number | null;       // Estimated total parts (can be updated)
  previous_quest?: string | null;    // Name of the previous quest
  previous_quest_id?: string | null; // UUID of the previous quest
  next_quest_hook?: string | null;   // Teaser for next part
}

export const DEFAULT_QUEST_CHAIN: QuestChain = {};

// Quest Encounter Seed
export interface QuestEncounterSeed {
  name: string;
  objective_id?: string;
  type: 'combat' | 'social' | 'exploration' | 'puzzle';
  description: string;
  creatures?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly';
}

// Quest NPC Seed
export interface QuestNpcSeed {
  name: string;
  role: string;
  objective_id?: string;
  brief: string;
}

// Quest Mechanics
export interface QuestMechanics {
  quest_type?: QuestSubType;
  recommended_level?: string;
  estimated_sessions?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly';
  themes?: string[];
}

export const DEFAULT_QUEST_MECHANICS: QuestMechanics = {};

// Creature Sub-Types
export type CreatureSubType =
  | 'aberration'
  | 'beast'
  | 'celestial'
  | 'construct'
  | 'dragon'
  | 'elemental'
  | 'fey'
  | 'fiend'
  | 'giant'
  | 'humanoid'
  | 'monstrosity'
  | 'ooze'
  | 'plant'
  | 'swarm'
  | 'undead';

// Creature Brain - DM-facing tactical info
export interface CreatureBrain extends BaseBrain {
  tactics?: string;              // How it fights, prioritizes targets, retreats
  weaknesses?: string;           // Exploitable vulnerabilities beyond damage types
  motivations?: string;          // Why it's here, what it wants
  lair_description?: string;     // If CR 5+, describe its lair
  lair_actions?: string[];       // If CR 10+, array of lair actions
  legendary_actions?: Array<{
    name: string;
    cost: number;
    description: string;
  }>;
  regional_effects?: string[];   // If legendary, effects on surrounding area
  plot_hooks?: string[];         // Ways to involve this creature in stories
  secret?: string;               // Hidden fact about this creature (DM only)
}

export const DEFAULT_CREATURE_BRAIN: CreatureBrain = {};

// Creature Soul - Player-facing flavor
export interface CreatureSoul {
  vivid_description?: string;    // 2-3 sentences players hear when encountering
  distinctive_features?: string[]; // Unique physical traits
  behavior?: string;             // How it acts, hunts, defends territory
  habitat?: string;              // Where it lives and why
  ecology?: string;              // Role in ecosystem, diet, predators/prey
  social_structure?: 'solitary' | 'pair' | 'pack' | 'swarm' | 'hive' | 'colony';
  sounds?: string;               // What noises it makes
  signs_of_presence?: string;    // Tracks, marks, smells that indicate nearby
}

export const DEFAULT_CREATURE_SOUL: CreatureSoul = {};

// Creature Mechanics - Full D&D stat block
export interface CreatureMechanics {
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  type?: string;                 // Creature type with optional tags
  alignment?: string;
  ac?: number;
  ac_type?: string;              // Natural armor, leather armor, etc.
  hp?: number;
  hit_dice?: string;             // e.g., "8d10 + 24"
  speeds?: {
    walk?: number;
    fly?: number;
    swim?: number;
    burrow?: number;
    climb?: number;
    hover?: boolean;
  };
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saving_throws?: Array<{ ability: string; modifier: number }>;
  skills?: Array<{ name: string; modifier: number }>;
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  senses?: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    passive_perception?: number;
  };
  languages?: string[];
  cr?: string;
  xp?: number;
  special_abilities?: Array<{ name: string; description: string }>;
  actions?: Array<{ name: string; description: string }>;
  bonus_actions?: Array<{ name: string; description: string }>;
  reactions?: Array<{ name: string; description: string }>;
  legendary_actions_list?: Array<{ name: string; cost?: number; description: string }>;
  mythic_actions?: Array<{ name: string; description: string }>;
  lair_actions?: Array<{ description: string }>;
}

export const DEFAULT_CREATURE_MECHANICS: CreatureMechanics = {
  size: 'Medium',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
};

// Creature Treasure - Loot for inventory system
export interface CreatureTreasure {
  treasure_description?: string;  // Narrative description
  treasure_items?: string[];      // Item names for inventory linking
}

export const DEFAULT_CREATURE_TREASURE: CreatureTreasure = {};

// Union type for all brains
export type AnyBrain =
  | NpcBrain
  | VillainBrain
  | HeroBrain
  | LocationBrain
  | ItemBrain
  | FactionBrain
  | EncounterBrain
  | QuestBrain
  | CreatureBrain
  | BaseBrain;

// Type guards
export function isNpcBrain(brain: BaseBrain): brain is NpcBrain {
  return 'desire' in brain && 'fear' in brain && 'leverage' in brain && 'line' in brain;
}

export function isVillainBrain(brain: BaseBrain): brain is VillainBrain {
  return isNpcBrain(brain) && 'scheme' in brain && 'escape_plan' in brain;
}

export function isHeroBrain(brain: BaseBrain): brain is HeroBrain {
  return isNpcBrain(brain) && 'limitation' in brain && 'support_role' in brain;
}

export function isLocationBrain(brain: BaseBrain): brain is LocationBrain {
  return 'purpose' in brain || 'atmosphere' in brain || 'danger_level' in brain || 'contains' in brain;
}

export function isItemBrain(brain: BaseBrain): brain is ItemBrain {
  return 'sentience_level' in brain || 'origin' in brain || 'history_weight' in brain;
}

export function isFactionBrain(brain: BaseBrain): brain is FactionBrain {
  return 'purpose' in brain || 'goals' in brain || 'hierarchy' in brain || 'key_members' in brain;
}

export function isCreatureBrain(brain: BaseBrain): brain is CreatureBrain {
  return 'tactics' in brain || 'weaknesses' in brain || 'lair_description' in brain || 'legendary_actions' in brain;
}

// Get default brain for entity type
export function getDefaultBrain(entityType: EntityType, subType?: EntitySubType): AnyBrain {
  if (entityType === 'npc') {
    if (subType === 'villain') return { ...DEFAULT_VILLAIN_BRAIN };
    if (subType === 'hero') return { ...DEFAULT_HERO_BRAIN };
    return { ...DEFAULT_NPC_BRAIN };
  }
  if (entityType === 'location') return { ...DEFAULT_LOCATION_BRAIN };
  if (entityType === 'item') return { ...DEFAULT_ITEM_BRAIN };
  if (entityType === 'faction') return { ...DEFAULT_FACTION_BRAIN };
  if (entityType === 'encounter') return { ...DEFAULT_ENCOUNTER_BRAIN };
  if (entityType === 'quest') return { ...DEFAULT_QUEST_BRAIN };
  if (entityType === 'creature') return { ...DEFAULT_CREATURE_BRAIN };
  return { ...DEFAULT_BRAIN };
}


// === VOICE SYSTEM ===
export type VoiceEnergy = 'subdued' | 'measured' | 'animated' | 'manic';
export type VoiceVocabulary = 'simple' | 'educated' | 'archaic' | 'technical' | 'street';

export interface Voice {
  style: string[];
  speech_patterns: string[];
  catchphrase?: string;
  energy: VoiceEnergy;
  vocabulary: VoiceVocabulary;
  tells?: string[];
}

export const DEFAULT_VOICE: Voice = {
  style: [],
  speech_patterns: [],
  energy: 'measured',
  vocabulary: 'simple',
};

// Helper to safely get voice with defaults
export function getVoiceWithDefaults(voice?: Partial<Voice>): Voice {
  return {
    ...DEFAULT_VOICE,
    ...voice,
    style: voice?.style || [],
    speech_patterns: voice?.speech_patterns || [],
    tells: voice?.tells || [],
  };
}

// Item Voice - ONLY for sentient items
export interface ItemVoice {
  personality?: string;           // How it presents itself
  style?: string[];               // Communication style (whispers, booming, etc.)
  desires?: string;               // What it pushes the wielder toward
  communication?: 'telepathic' | 'verbal' | 'empathic' | 'visions';
}

export const DEFAULT_ITEM_VOICE: ItemVoice = {};

// Type guard for sentient items
export function isSentientItem(brain: ItemBrain | null | undefined): boolean {
  return brain?.sentience_level !== undefined && brain.sentience_level !== 'none';
}


// === SESSION SYSTEM ===
export type SessionStatus = 'planned' | 'active' | 'completed';

export interface Session {
  id: string;
  campaign_id: string;
  order_index: number;
  title?: string;
  summary?: string;
  session_date?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}


// === ENTITY TYPES ===
export type EntityType = 'npc' | 'item' | 'location' | 'faction' | 'encounter' | 'quest' | 'creature';
export type EntitySubType = 'standard' | 'villain' | 'hero' | 'shop' | 'tavern' | 'temple' | 'dungeon' | 'nation' | 'city' | 'building' | string;
export type EntityStatus = 'active' | 'inactive' | 'dead' | 'destroyed' | 'archived' | 'stub';


// === LIVING ENTITY (Complete) ===
export interface LivingEntity {
  // Identity
  id: string;
  campaign_id: string;
  entity_type: EntityType;
  sub_type?: EntitySubType;
  name: string;

  // The Brain (JSONB)
  brain: AnyBrain;

  // The Voice (JSONB)
  voice: Voice;

  // Quick Access
  read_aloud?: string;
  dm_slug?: string;

  // The Memory (loaded separately from facts table)
  facts?: Fact[];

  // Relationships (loaded separately from relationships table)
  relationships?: Relationship[];

  // Legacy attributes (backward compatibility)
  attributes?: Record<string, unknown>;

  // Metadata
  status: EntityStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Helper to safely access brain with type narrowing
export function getEntityBrain<T extends AnyBrain>(
  entity: LivingEntity,
  defaultBrain: T
): T {
  if (!entity.brain || Object.keys(entity.brain).length === 0) {
    return defaultBrain;
  }
  return entity.brain as T;
}

// Helper to safely access voice
export function getEntityVoice(entity: LivingEntity): Voice {
  return getVoiceWithDefaults(entity.voice);
}


// === FORGE OUTPUT TYPES ===
// These are used by forges to structure AI output before saving

export interface ForgeFactOutput {
  content: string;
  category: FactCategory;
  visibility: Visibility;
}

export interface ForgeOutput {
  name: string;
  sub_type?: EntitySubType;
  brain: AnyBrain;
  voice: Voice;
  facts: ForgeFactOutput[];
  read_aloud: string;
  dm_slug: string;
  tags: string[];
}

// NPC Combat Role
export type NpcCombatRole = 'non-combatant' | 'minion' | 'elite' | 'villain' | 'hero';

// NPC Mechanics - Full D&D 5e stat block for combat-capable NPCs
export interface NpcMechanics {
  combat_role: NpcCombatRole;
  cr?: string;
  xp?: number;
  ac: number;
  ac_type?: string;
  hp: number;
  hit_dice?: string;
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    burrow?: number;
    climb?: number;
  };
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saving_throws?: Array<{ ability: string; modifier: number }>;
  skills?: Array<{ name: string; modifier: number }>;
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  senses?: {
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
    passive_perception?: number;
  };
  languages?: string[];
  special_abilities?: Array<{ name: string; description: string }>;
  actions?: Array<{ name: string; description: string }>;
  bonus_actions?: Array<{ name: string; description: string }>;
  reactions?: Array<{ name: string; description: string }>;
  legendary_actions?: Array<{ name: string; description: string; cost?: number }>;
  srd_base?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const DEFAULT_NPC_MECHANICS: NpcMechanics = {
  combat_role: 'non-combatant',
  ac: 10,
  hp: 4,
  speed: { walk: 30 },
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
};

// NPC-specific forge output with legacy fields for backward compatibility
export interface NpcForgeOutput {
  name: string;
  sub_type: EntitySubType;

  // Brain
  brain: NpcBrain | VillainBrain | HeroBrain;

  // Voice
  voice: Voice;

  // Mechanics (full stat block)
  mechanics?: NpcMechanics;

  // Facts (will be saved to facts table)
  facts: ForgeFactOutput[];

  // Quick access
  read_aloud: string;
  dm_slug: string;

  // Legacy fields (for backward compatibility with existing UI)
  appearance: string;
  personality: string;
  motivation: string;
  secret: string;
  plotHook: string;
  voiceAndMannerisms: string;
  connectionHooks: string[];
  combatStats?: {
    armorClass: number;
    hitPoints: number;
    primaryWeapon: string;
    combatStyle: string;
  };
  // Structured loot format (new) or legacy string array
  loot?: LootItem[] | string[];

  tags: string[];
}

// Structured loot item for inventory integration
export interface LootItem {
  name: string;
  quantity: number;
  description?: string; // For custom/unique items
}
