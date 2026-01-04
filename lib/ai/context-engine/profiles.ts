import { ContextProfile, ForgeProfile } from './types';

/**
 * Each Forge cares about different context.
 * These profiles define what to prioritize and how much budget to allocate.
 */
export const FORGE_PROFILES: Record<ForgeProfile, ContextProfile> = {
  npc: {
    name: 'npc',
    tokenBudget: 1500,
    weights: {
      codex: 0.15, // Tone matters for personality
      party: 0.15, // Reputation affects NPC attitude
      location: 0.2, // NPCs belong to places
      factions: 0.25, // Faction membership is key
      history: 0.15, // Past interactions
      threads: 0.1, // Relevant plot hooks
    },
    requiredLayers: ['codex', 'factions'],
    priorityOrder: ['factions', 'location', 'codex', 'party', 'history', 'threads'],
  },

  encounter: {
    name: 'encounter',
    tokenBudget: 1500,
    weights: {
      codex: 0.1, // Tone for encounter style
      party: 0.3, // Weaknesses to exploit!
      location: 0.15, // Terrain matters
      history: 0.2, // Bring back old enemies
      threads: 0.2, // Advance plot through combat
      tactical: 0.05, // Combat-specific tips
    },
    requiredLayers: ['party'],
    priorityOrder: ['party', 'threads', 'history', 'location', 'codex', 'tactical'],
  },

  quest: {
    name: 'quest',
    tokenBudget: 2000,
    weights: {
      codex: 0.15, // Themes drive quests
      party: 0.1, // Party goals
      factions: 0.2, // Faction conflicts = quests
      history: 0.15, // Build on past events
      threads: 0.3, // Resolve or advance threads!
      relationships: 0.1, // NPC connections
    },
    requiredLayers: ['threads', 'factions'],
    priorityOrder: ['threads', 'factions', 'history', 'codex', 'relationships', 'party'],
  },

  location: {
    name: 'location',
    tokenBudget: 1500,
    weights: {
      codex: 0.25, // Setting defines places
      factions: 0.25, // Who controls this area?
      history: 0.2, // What happened here?
      threads: 0.15, // Plot-relevant locations
      relationships: 0.15, // Connected NPCs/places
    },
    requiredLayers: ['codex'],
    priorityOrder: ['codex', 'factions', 'history', 'threads', 'relationships'],
  },

  item: {
    name: 'item',
    tokenBudget: 1000,
    weights: {
      codex: 0.2, // Magic level, themes
      party: 0.35, // What do they NEED?
      location: 0.15, // Where is it from?
      history: 0.2, // Legendary items have history
      threads: 0.1, // Quest rewards
    },
    requiredLayers: ['party'],
    priorityOrder: ['party', 'codex', 'history', 'location', 'threads'],
  },

  creature: {
    name: 'creature',
    tokenBudget: 1200,
    weights: {
      codex: 0.2, // What creatures fit the world?
      party: 0.25, // Appropriate challenge
      location: 0.25, // Habitat matters
      history: 0.15, // Recurring creatures
      factions: 0.15, // Faction pets/guardians
    },
    requiredLayers: ['party', 'location'],
    priorityOrder: ['location', 'party', 'codex', 'factions', 'history'],
  },

  faction: {
    name: 'faction',
    tokenBudget: 1500,
    weights: {
      codex: 0.2, // World politics
      party: 0.15, // Party reputation
      factions: 0.25, // Faction relationships
      history: 0.2, // Past faction events
      threads: 0.2, // Faction-driven plots
    },
    requiredLayers: ['codex'],
    priorityOrder: ['factions', 'threads', 'codex', 'history', 'party'],
  },
};

export function getProfile(forge: ForgeProfile): ContextProfile {
  return FORGE_PROFILES[forge] || FORGE_PROFILES.npc;
}
