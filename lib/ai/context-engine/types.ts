export type ForgeProfile =
  | 'npc'
  | 'encounter'
  | 'quest'
  | 'location'
  | 'item'
  | 'creature'
  | 'faction';

export type ContextLayer =
  | 'codex' // Campaign DNA (tone, setting, rules)
  | 'party' // Party status, composition, weaknesses
  | 'session' // Current session state
  | 'location' // Current/relevant locations
  | 'factions' // Faction relationships & goals
  | 'history' // Semantic search results (RAG)
  | 'threads' // Active story threads/clocks
  | 'relationships' // Graph-traversed connections
  | 'tactical'; // Combat-specific context

export interface ContextProfile {
  name: ForgeProfile;
  tokenBudget: number;
  weights: Partial<Record<ContextLayer, number>>;
  requiredLayers: ContextLayer[];
  priorityOrder: ContextLayer[];
}

export interface ContextSourceReference {
  id: string;
  type: 'entity' | 'session_event' | 'thread' | 'codex' | 'relationship';
  name: string;
  entityType?: string;
  relevance: number; // 0-1 similarity/importance score
}

export interface LayerResult {
  layer: ContextLayer;
  content: string;
  tokens: number;
  sources: ContextSourceReference[];
  metadata?: Record<string, unknown>;
}

export interface StoryThreadContext {
  id: string;
  title: string;
  description?: string;
  priority: string;
  clockProgress?: number; // 0-100
  consequence?: string;
  isUrgent: boolean;
}

export interface AssembledContext {
  // The formatted prompt string ready for injection
  promptText: string;

  // Token usage breakdown
  tokenUsage: {
    total: number;
    budget: number;
    byLayer: Partial<Record<ContextLayer, number>>;
  };

  // Debug information (for "Why did AI suggest this?" UI)
  sources: ContextSourceReference[];

  // Active threads that influenced generation
  activeThreads: StoryThreadContext[];

  // Warnings for the DM (e.g., "Party has low WIS saves")
  warnings: string[];

  // Suggested hooks based on context
  suggestedHooks: string[];

  // Profile used
  profile: ForgeProfile;
}

export interface ContextEngineOptions {
  campaignId: string;
  query: string;
  profile: ForgeProfile;

  // Optional filters/overrides
  currentLocationId?: string;
  currentSessionId?: string;
  includeEntityIds?: string[];
  excludeEntityIds?: string[];

  // Search settings
  semanticThreshold?: number;
  maxSemanticResults?: number;

  // Debug mode returns extra info
  debug?: boolean;
}
