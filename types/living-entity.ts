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
  // Legacy fields
  mood?: string;
  law?: 'lawful' | 'neutral' | 'lawless';
  hidden_purpose?: string;
}

export const DEFAULT_LOCATION_BRAIN: LocationBrain = {
  danger_level: 'moderate',
};

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

// Encounter Brain
export interface EncounterBrain extends BaseBrain {
  objective: string;
  twist?: string;
  flee_condition: string;
  failure_consequence: string;
}

export const DEFAULT_ENCOUNTER_BRAIN: EncounterBrain = {
  objective: '',
  flee_condition: '',
  failure_consequence: '',
};

// Quest Brain
export interface QuestBrain extends BaseBrain {
  stakes: string;
  complications: string[];
  moral_tension?: string;
  time_pressure?: string;
}

export const DEFAULT_QUEST_BRAIN: QuestBrain = {
  stakes: '',
  complications: [],
};

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
export type EntityType = 'npc' | 'item' | 'location' | 'faction' | 'encounter' | 'quest';
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

// NPC-specific forge output with legacy fields for backward compatibility
export interface NpcForgeOutput {
  name: string;
  sub_type: EntitySubType;

  // Brain
  brain: NpcBrain | VillainBrain | HeroBrain;

  // Voice
  voice: Voice;

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
  loot?: string[];

  tags: string[];
}
