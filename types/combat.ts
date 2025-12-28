export type CombatantType = 'player' | 'npc' | 'monster' | 'ally';

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion'
  | 'frightened' | 'grappled' | 'incapacitated' | 'invisible'
  | 'paralyzed' | 'petrified' | 'poisoned' | 'prone'
  | 'restrained' | 'stunned' | 'unconscious'
  | 'concentrating' | 'hidden' | 'dodging' | 'raging';

export interface Combatant {
  id: string;                    // Unique combat ID (e.g., "goblin-1", "goblin-2")
  entityId?: string;             // Link to campaign entity (if exists)
  srdId?: string;                // Link to SRD creature (if standard monster)
  name: string;
  displayName?: string;          // For numbered creatures: "Goblin 1"
  type: CombatantType;
  initiative: number;
  initiativeModifier: number;    // For re-rolls

  // Health
  hp: number;
  maxHp: number;
  tempHp: number;

  // Defense
  ac: number;

  // Status
  conditions: Condition[];
  deathSaves?: {
    successes: number;
    failures: number;
  };

  // Display
  isActive: boolean;             // Current turn
  isVisible: boolean;            // Fog of war for players
  isDefeated: boolean;           // HP <= 0

  // Reference Data
  statBlock?: Record<string, unknown>;  // Full stat block JSON
  imageUrl?: string;
  notes?: string;                // DM notes for this combatant
}

export interface CombatState {
  id: string;                    // UUID for this combat instance
  sessionId: string;
  encounterId?: string;          // Link to encounter entity that started this

  isActive: boolean;
  round: number;
  turnIndex: number;

  combatants: Combatant[];

  // Combat Log
  combatLog: CombatLogEntry[];

  // Timestamps
  startedAt: string;
  endedAt?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  type: 'damage' | 'healing' | 'condition' | 'death_save' | 'turn_start' | 'turn_end' | 'custom';
  actorId?: string;
  targetId?: string;
  value?: number;
  description: string;
}

export interface EncounterCreature {
  srdId?: string;
  entityId?: string;
  name: string;
  count: number;
  hpFormula?: string;            // e.g., "2d6+2"
}
