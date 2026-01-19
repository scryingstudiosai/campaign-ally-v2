// Event sub-types
export type EventSubType =
  | 'historical_event'  // Major past occurrence
  | 'recent_event'      // Current news/happenings
  | 'legend'            // Mythical/uncertain history
  | 'prophecy'          // Future predictions
  | 'rumor'             // Unverified information
  | 'war'               // Military conflict
  | 'catastrophe'       // Disasters
  | 'founding'          // Creation of something
  | 'death'             // Significant deaths
  | 'treaty'            // Agreements/pacts
  | 'discovery'         // Knowledge found
  | 'miracle';          // Divine intervention

export const EVENT_SUB_TYPES: { value: EventSubType; label: string; icon: string; description: string }[] = [
  { value: 'historical_event', label: 'Historical Event', icon: '📜', description: 'A major past occurrence' },
  { value: 'recent_event', label: 'Recent Event', icon: '📰', description: 'Current news or happenings' },
  { value: 'legend', label: 'Legend', icon: '🐉', description: 'Mythical or uncertain history' },
  { value: 'prophecy', label: 'Prophecy', icon: '🔮', description: 'Predictions of the future' },
  { value: 'rumor', label: 'Rumor', icon: '🍺', description: 'Unverified information' },
  { value: 'war', label: 'War', icon: '⚔️', description: 'Military conflict' },
  { value: 'catastrophe', label: 'Catastrophe', icon: '🌋', description: 'Disasters and calamities' },
  { value: 'founding', label: 'Founding', icon: '🏰', description: 'Creation or establishment' },
  { value: 'death', label: 'Significant Death', icon: '💀', description: 'Death of important figures' },
  { value: 'treaty', label: 'Treaty', icon: '📋', description: 'Agreements and pacts' },
  { value: 'discovery', label: 'Discovery', icon: '🔍', description: 'Knowledge or places found' },
  { value: 'miracle', label: 'Miracle', icon: '✨', description: 'Divine intervention' },
];

// Lore Drop structure
export interface LoreDrop {
  id: string;
  trigger: string;              // "At The Scar" or "Talking to Elder Mira"
  delivery: string;             // "History DC 14" or "Freely given" or "Overheard in tavern"
  dc?: number;                  // Skill check DC if applicable
  text: string;                 // The actual revelation
  reveal_level: 'public' | 'partial' | 'dm_truth';
  used?: boolean;               // Track if revealed in session
}

// Event Soul (Player-facing knowledge states)
export interface EventSoul {
  common_knowledge: string;     // What everyone knows (may be incomplete/wrong)
  scholarly_account: string;    // What sages and books say
  folklore: string;             // Myths, legends, exaggerations
  propaganda?: string;          // What powers want people to believe
}

// Event Brain (DM-only truth)
export interface EventBrain {
  true_history: string;         // What ACTUALLY happened
  hidden_causes: string;        // Secret motivations and reasons
  consequences: string;         // How it affects the present
  secrets: string;              // Things no one knows
  reveal_triggers: string[];    // How truth becomes known
  hooks: string[];              // Ways to bring into play
}

// Event Mechanics
export interface EventMechanics {
  date_display: string;         // "500 years ago" or "3rd of Highsun, 1492"
  duration?: string;            // "3 days", "A century", "Ongoing"
  affected_regions: string[];   // Where this matters
  current_evidence: string;     // What players can find today
  lore_drops: LoreDrop[];       // Actionable play snippets
}

// Full Event Entity
export interface EventEntity {
  id: string;
  campaign_id: string;
  entity_type: 'event';
  sub_type: EventSubType;
  name: string;
  status: 'active' | 'stub' | 'archived';

  // Timeline fields (columns)
  event_sort: number;
  event_era: string;
  event_ongoing: boolean;

  // Structured content
  soul: EventSoul;
  brain: EventBrain;
  mechanics: EventMechanics;

  // Standard fields
  created_at: string;
  updated_at: string;
}

// Generated lore response structure
export interface GeneratedLore {
  name: string;
  sub_type: EventSubType;
  event_sort: number;
  event_era: string | null;
  event_ongoing: boolean;
  soul: EventSoul;
  brain: EventBrain;
  mechanics: EventMechanics;
  discoveries: {
    npcs?: string[];
    locations?: string[];
    items?: string[];
    events?: string[];
  };
}
