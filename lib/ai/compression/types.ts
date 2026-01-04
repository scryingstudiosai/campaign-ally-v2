/**
 * Compression Passes Types
 * Types for rolling summaries and campaign compression
 */

// Session Summary - compressed version of a single session
export interface SessionSummary {
  id: string;
  campaign_id: string;
  session_id: string;
  session_number: number;
  summary: string;
  key_events: string[];
  npcs_involved: string[];
  locations_visited: string[];
  items_acquired: string[];
  threads_advanced: string[];
  threads_resolved: string[];
  party_decisions: string[];
  cliffhanger?: string;
  word_count: number;
  compression_ratio: number;
  created_at: string;
  updated_at: string;
}

// Arc Summary - compressed version of multiple sessions (story arc)
export interface ArcSummary {
  id: string;
  campaign_id: string;
  arc_name: string;
  arc_number: number;
  session_range: { start: number; end: number };
  summary: string;
  major_events: string[];
  character_arcs: Array<{
    character_name: string;
    development: string;
  }>;
  faction_changes: Array<{
    faction_name: string;
    change: string;
  }>;
  world_changes: string[];
  unresolved_threads: string[];
  word_count: number;
  compression_ratio: number;
  created_at: string;
  updated_at: string;
}

// Campaign Brief - highly compressed overview of entire campaign
export interface CampaignBrief {
  id: string;
  campaign_id: string;
  brief: string;
  current_arc: string;
  party_status: string;
  major_npcs: Array<{
    name: string;
    role: string;
    relationship: string;
  }>;
  key_locations: Array<{
    name: string;
    significance: string;
  }>;
  active_threads: Array<{
    title: string;
    status: string;
  }>;
  campaign_themes: string[];
  total_sessions: number;
  word_count: number;
  compression_ratio: number;
  created_at: string;
  updated_at: string;
}

// Entity History - compressed history of a specific entity (NPC, location, etc.)
export interface EntityHistory {
  id: string;
  campaign_id: string;
  entity_type: 'npc' | 'location' | 'faction' | 'item';
  entity_id: string;
  entity_name: string;
  history: string;
  key_appearances: Array<{
    session_number: number;
    event: string;
  }>;
  relationship_changes: Array<{
    session_number: number;
    change: string;
  }>;
  current_status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

// Compression Job - tracks compression tasks
export interface CompressionJob {
  id: string;
  campaign_id: string;
  job_type: 'session' | 'arc' | 'brief' | 'entity';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  target_id?: string;
  input_tokens: number;
  output_tokens: number;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// Input types for compression
export interface SessionCompressionInput {
  campaignId: string;
  sessionId: string;
  sessionNumber: number;
  events: Array<{
    id: string;
    event_type: string;
    title: string;
    description: string;
    created_at: string;
  }>;
  forceRegenerate?: boolean;
}

export interface ArcCompressionInput {
  campaignId: string;
  arcName: string;
  arcNumber: number;
  sessionSummaries: SessionSummary[];
  forceRegenerate?: boolean;
}

export interface BriefCompressionInput {
  campaignId: string;
  arcSummaries: ArcSummary[];
  currentSessionNumber: number;
  forceRegenerate?: boolean;
}

export interface EntityHistoryInput {
  campaignId: string;
  entityType: 'npc' | 'location' | 'faction' | 'item';
  entityId: string;
  entityName: string;
  mentions: Array<{
    session_number: number;
    context: string;
  }>;
  forceRegenerate?: boolean;
}

// Response types
export interface CompressionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokens_used?: number;
}

// Chronicle display types
export interface ChronicleEntry {
  type: 'session' | 'arc' | 'brief';
  id: string;
  title: string;
  summary: string;
  date: string;
  metadata: {
    word_count: number;
    compression_ratio?: number;
    session_number?: number;
    arc_number?: number;
  };
}

export interface CampaignChronicle {
  campaignId: string;
  campaignName: string;
  brief?: CampaignBrief;
  arcs: ArcSummary[];
  sessions: SessionSummary[];
  entityHistories: EntityHistory[];
  lastUpdated: string;
}
