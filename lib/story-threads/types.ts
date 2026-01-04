export const THREAD_TYPES = [
  { value: 'consequence', label: 'Consequence', description: 'Something that will happen if ignored' },
  { value: 'promise', label: 'Promise', description: 'A commitment the party made' },
  { value: 'debt', label: 'Debt', description: 'Something owed (money, favor, etc.)' },
  { value: 'secret', label: 'Secret', description: 'Hidden information that may be revealed' },
  { value: 'prophecy', label: 'Prophecy', description: 'A foretold event' },
  { value: 'quest_hook', label: 'Quest Hook', description: 'An opportunity that may expire' },
  { value: 'relationship', label: 'Relationship', description: 'A bond that needs attention' },
] as const

export const PRIORITY_LEVELS = [
  { value: 'critical', label: 'Critical', color: 'red', description: 'Immediate attention needed' },
  { value: 'high', label: 'High', color: 'orange', description: 'Important, act soon' },
  { value: 'medium', label: 'Medium', color: 'yellow', description: 'Should address eventually' },
  { value: 'low', label: 'Low', color: 'blue', description: 'When convenient' },
  { value: 'background', label: 'Background', color: 'gray', description: 'Simmering in the background' },
] as const

export const CLOCK_TYPES = [
  { value: 'none', label: 'No Clock', description: 'No time pressure' },
  { value: 'sessions', label: 'Sessions', description: 'Advances each session' },
  { value: 'days', label: 'In-Game Days', description: 'Advances with in-game time' },
  { value: 'events', label: 'Events', description: 'Advances on specific triggers' },
  { value: 'manual', label: 'Manual', description: 'You control when it advances' },
] as const

export const TRIGGER_TYPES = [
  { value: 'none', label: 'No Trigger', description: 'Only clock-based' },
  { value: 'location', label: 'Location', description: 'When party visits a place' },
  { value: 'entity_interaction', label: 'Entity Interaction', description: 'When party interacts with someone/something' },
  { value: 'time', label: 'Time-Based', description: 'At a specific in-game time' },
  { value: 'event', label: 'Event', description: 'When something specific happens' },
  { value: 'manual', label: 'Manual', description: 'When you decide' },
] as const

export const STAKE_TYPES = [
  { value: 'social', label: 'Social', description: 'Reputation, relationships' },
  { value: 'economic', label: 'Economic', description: 'Money, resources, trade' },
  { value: 'political', label: 'Political', description: 'Power, influence, alliances' },
  { value: 'physical', label: 'Physical', description: 'Safety, health, combat' },
  { value: 'magical', label: 'Magical', description: 'Curses, enchantments, artifacts' },
  { value: 'existential', label: 'Existential', description: 'World-changing, catastrophic' },
] as const

export const RESOLUTION_TYPES = [
  { value: 'resolved', label: 'Resolved', color: 'green', description: 'Party successfully addressed it' },
  { value: 'failed', label: 'Failed/Ignored', color: 'red', description: 'Party ignored it or failed' },
  { value: 'dormant', label: 'Dormant', color: 'gray', description: 'On hold, may return later' },
] as const

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'failed', label: 'Failed' },
  { value: 'dormant', label: 'Dormant' },
] as const

export interface StoryThread {
  id: string
  campaign_id: string
  title: string
  description?: string
  status: 'active' | 'resolved' | 'failed' | 'dormant'
  priority: 'critical' | 'high' | 'medium' | 'low' | 'background'
  thread_type: string

  // Clock
  clock_type?: string
  clock_max?: number
  clock_current?: number
  clock_started_at?: string

  // Trigger
  trigger_type?: string
  trigger_location_id?: string
  trigger_entity_ids?: string[]
  trigger_conditions?: Record<string, unknown>

  // Stakes & Consequences
  stake_type?: string
  consequence_if_ignored?: string
  consequence_if_resolved?: string

  // Resolution
  resolution_type?: 'resolved' | 'failed' | 'dormant'
  resolution_notes?: string
  applied_consequence?: string
  resolved_at?: string

  // Relations
  related_entity_ids?: string[]
  related_quest_id?: string
  source_session_id?: string

  // Computed (from API)
  clock_percentage?: number
  is_urgent?: boolean
  is_triggered?: boolean

  // Timestamps
  created_at: string
  updated_at?: string
}
