export type SessionStatus = 'planning' | 'active' | 'review' | 'archived';

export type SessionEventType =
  | 'note' | 'narrative' | 'dialogue'
  | 'combat_start' | 'combat_end' | 'initiative'
  | 'attack' | 'damage' | 'healing' | 'death'
  | 'skill_check' | 'saving_throw' | 'spell_cast'
  | 'item_used' | 'item_acquired' | 'item_given' | 'gold_changed'
  | 'quest_updated' | 'discovery' | 'relationship'
  | 'rest' | 'level_up' | 'custom';

export interface Session {
  id: string;
  campaign_id: string;
  name: string;
  session_number?: number;
  session_date: string;
  status: SessionStatus;
  prep_content: TiptapContent;
  live_log: SessionEvent[];
  active_encounter_id?: string;
  active_scene_location_id?: string;
  starting_location_id?: string;
  active_quest_ids?: string[];
  summary?: string;
  ai_summary?: AISummary;
  next_session_hook?: string;
  highlights?: SessionHighlight[];
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  campaign_id: string;
  timestamp: string;
  session_time_offset?: number;
  event_type: SessionEventType;
  actor_entity_id?: string;
  target_entity_id?: string;
  related_entity_ids?: string[];
  title?: string;
  description?: string;
  payload?: Record<string, unknown>;
  is_private?: boolean;
  is_highlighted?: boolean;
  created_at: string;
}

export interface CombatState {
  id: string;
  session_id: string;
  encounter_id?: string;
  is_active: boolean;
  current_round: number;
  current_turn_index: number;
  initiative_order: InitiativeEntry[];
  combat_log: CombatLogEntry[];
  started_at: string;
  ended_at?: string;
}

export interface InitiativeEntry {
  id: string;
  entity_id?: string;
  name: string;
  initiative: number;
  hp_current: number;
  hp_max: number;
  ac: number;
  is_player: boolean;
  is_ally: boolean;
  conditions: string[];
  notes?: string;
  is_dead: boolean;
  is_hidden: boolean;
}

export interface CombatLogEntry {
  round: number;
  turn: number;
  actor: string;
  action: string;
  result?: string;
  timestamp: string;
}

export interface SessionHighlight {
  event_id: string;
  title: string;
  timestamp: string;
}

export interface AISummary {
  narrative_summary: string;
  key_events: string[];
  npcs_encountered: string[];
  locations_visited: string[];
  items_acquired: string[];
  quests_progressed: string[];
  consequences: string[];
  suggested_hooks: string[];
}

export interface TiptapContent {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
}
