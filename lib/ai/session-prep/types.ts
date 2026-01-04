export type SuggestionType =
  | 'urgent_thread' // Story thread about to trigger
  | 'location_npcs' // NPCs in current/planned location
  | 'unresolved_hook' // Plot hooks to address
  | 'faction_movement' // Faction reactions/plans
  | 'encounter_rec' // Encounter recommendations
  | 'party_status' // Party resource warnings
  | 'recap' // "Previously on..." summary
  | 'callback' // Opportunity to reference past events
  | 'relationship' // NPC relationship developments
  | 'world_event'; // World events happening in background

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PrepSuggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;

  // What triggered this suggestion
  source: {
    type: 'thread' | 'entity' | 'session' | 'party' | 'ai';
    id?: string;
    name?: string;
  };

  // Actionable details
  details?: {
    npcs?: string[];
    locations?: string[];
    items?: string[];
    mechanics?: string;
  };

  // For the DM
  dmNotes?: string;
  suggestedReadAloud?: string;

  // Tracking
  dismissed?: boolean;
  usedInSession?: boolean;
}

export interface SessionPrepReport {
  campaignId: string;
  sessionNumber?: number;
  generatedAt: Date;

  // The suggestions grouped by priority
  critical: PrepSuggestion[];
  high: PrepSuggestion[];
  medium: PrepSuggestion[];
  low: PrepSuggestion[];

  // Summary stats
  stats: {
    totalSuggestions: number;
    urgentThreads: number;
    activeNpcs: number;
    partyHealthPercent: number;
    daysUntilNextDeadline?: number;
  };

  // AI-generated content
  recap?: string;
  openingScene?: string;
}

export interface PrepGeneratorOptions {
  campaignId: string;
  plannedLocationId?: string;
  sessionGoals?: string[];
  includeRecap?: boolean;
  includeOpeningScene?: boolean;
  maxSuggestions?: number;
}

export interface BlockOption {
  title: string;
  approach: 'Combat' | 'Social' | 'Mystery' | 'Exploration';
  summary: string;
  blocks: Array<{
    type: 'scene' | 'encounter' | 'quest';
    title: string;
    content: Record<string, unknown>;
  }>;
}
