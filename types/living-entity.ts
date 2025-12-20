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

// Location Brain
export interface LocationBrain extends BaseBrain {
  mood: string;
  danger_level: 'safe' | 'cautious' | 'dangerous' | 'deadly';
  law: 'lawful' | 'neutral' | 'lawless';
  hidden_purpose?: string;
}

export const DEFAULT_LOCATION_BRAIN: LocationBrain = {
  mood: '',
  danger_level: 'safe',
  law: 'neutral',
};

// Item Brain
export interface ItemBrain extends BaseBrain {
  hunger?: string;
  trigger?: string;
  curse?: string;
  history_weight: string;
}

export const DEFAULT_ITEM_BRAIN: ItemBrain = {
  history_weight: '',
};

// Faction Brain
export interface FactionBrain extends BaseBrain {
  goal: string;
  methods: string;
  obstacle: string;
  party_hook: string;
  public_face: string;
}

export const DEFAULT_FACTION_BRAIN: FactionBrain = {
  goal: '',
  methods: '',
  obstacle: '',
  party_hook: '',
  public_face: '',
};

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
  return 'mood' in brain && 'danger_level' in brain;
}

export function isItemBrain(brain: BaseBrain): brain is ItemBrain {
  return 'history_weight' in brain;
}

export function isFactionBrain(brain: BaseBrain): brain is FactionBrain {
  return 'goal' in brain && 'methods' in brain && 'party_hook' in brain;
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
