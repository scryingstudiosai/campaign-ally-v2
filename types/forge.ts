// Forge Foundation Types
// Shared TypeScript interfaces for all forge systems

export type EntityType = 'npc' | 'location' | 'item' | 'faction' | 'quest' | 'encounter' | 'creature' | 'other'

export type ForgeType = 'npc' | 'item' | 'location' | 'monster' | 'faction' | 'quest' | 'encounter' | 'creature'

export type ForgeStatus =
  | 'idle'
  | 'validating'
  | 'generating'
  | 'scanning'
  | 'review'
  | 'saving'
  | 'saved'
  | 'error'

// A "Discovery" is something the AI invented that doesn't exist in Memory
export interface Discovery {
  id: string
  text: string // The text found (e.g., "Silverbrook")
  suggestedType: EntityType // What type of entity it might be
  context: string // Surrounding text for context
  status: 'pending' | 'create_stub' | 'link_existing' | 'ignore'
  linkedEntityId?: string // If user chooses to link to existing
}

// A "Conflict" is a validation issue that needs resolution
export interface Conflict {
  id: string
  type:
    | 'duplicate_name' // Entity with same name exists
    | 'role_conflict' // Role already filled (e.g., guild leader)
    | 'lore_contradiction' // Conflicts with codex
    | 'deceased_entity' // Name matches someone who died
    | 'location_missing' // Referenced location doesn't exist
  description: string
  severity: 'error' | 'warning' // Errors block, warnings don't
  existingEntityId?: string
  existingEntityName?: string
  suggestions: string[] // Suggested resolutions
  resolution:
    | 'pending'
    | 'keep_new'
    | 'keep_existing'
    | 'merge'
    | 'rename'
    | 'ignore'
}

// Result of pre-generation validation
export interface PreValidationResult {
  canProceed: boolean // False if blocking errors exist
  conflicts: Conflict[]
  warnings: string[]
}

// Result of post-generation scanning
export interface ScanResult {
  discoveries: Discovery[]
  conflicts: Conflict[]
  canonScore: 'high' | 'medium' | 'low'
  // Entities found in text that already exist (will be blue links)
  existingEntityMentions: Array<{
    id: string
    name: string
    type: EntityType
    startIndex: number
    endIndex: number
  }>
}

// History log entry for provenance tracking
export interface HistoryEntry {
  event:
    | 'forged'
    | 'created_by'
    | 'looted_from'
    | 'given_to'
    | 'sold_to'
    | 'stolen_by'
    | 'found_at'
    | 'edited'
    | 'stub_created'
    | 'srd_imported'
  entityId?: string
  entityName?: string
  session?: string
  note?: string
  timestamp: string
}

// The complete forge state
export interface ForgeState<TInput, TOutput> {
  status: ForgeStatus
  input: TInput | null
  output: TOutput | null
  preValidation: PreValidationResult | null
  scanResult: ScanResult | null
  error: string | null
}

// Input types for different forges (extend as needed)
export interface BaseForgeInput {
  name?: string
  location?: string
  [key: string]: unknown
}

export interface NPCForgeInput extends BaseForgeInput {
  role?: string
  faction?: string
  race?: string
  gender?: string
}

export interface ItemForgeInput extends BaseForgeInput {
  itemType?: string
  rarity?: string
  ownerId?: string
  locationId?: string
}

export interface LocationForgeInput extends BaseForgeInput {
  locationType?: string
  parentLocation?: string
}

export interface FactionForgeInput extends BaseForgeInput {
  factionType?: string
  influence?: string
  wealth?: string
}
