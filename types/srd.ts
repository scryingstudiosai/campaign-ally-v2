// Game System Types
export type GameSystem = '5e_2014' | '5e_2024' | 'pf2e' | 'shadowdark' | 'custom';

export const GAME_SYSTEMS: { value: GameSystem; label: string }[] = [
  { value: '5e_2014', label: 'D&D 5e (2014)' },
  { value: '5e_2024', label: 'D&D 5e (2024)' },
  { value: 'pf2e', label: 'Pathfinder 2e' },
  { value: 'shadowdark', label: 'Shadowdark' },
  { value: 'custom', label: 'Custom / Other' },
];

// SRD Creature
export interface SrdCreature {
  id: string;
  slug: string;
  name: string;
  game_system: GameSystem;
  source: string;
  license: string;

  size?: string;
  creature_type?: string;
  subtype?: string;
  alignment?: string;

  cr?: string;
  cr_numeric?: number;
  xp_value?: number;
  ac?: number;
  ac_type?: string;
  hp?: number;
  hp_formula?: string;

  stats?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  };
  speeds?: Record<string, number>;
  saves?: Record<string, number>;
  skills?: Record<string, number>;

  damage_resistances?: string[];
  damage_immunities?: string[];
  damage_vulnerabilities?: string[];
  condition_immunities?: string[];

  senses?: Record<string, number | string>;
  languages?: string[];

  traits?: Array<{ name: string; description: string }>;
  actions?: Array<{ name: string; description: string }>;
  bonus_actions?: Array<{ name: string; description: string }>;
  reactions?: Array<{ name: string; description: string }>;
  legendary_actions?: Array<{ name: string; description: string }>;
  legendary_description?: string;

  description?: string;
  created_at?: string;
}

// SRD Item
export interface SrdItem {
  id: string;
  slug: string;
  name: string;
  game_system: GameSystem;
  source: string;
  license: string;

  item_type: string;
  subtype?: string;
  rarity?: string;
  requires_attunement?: boolean;
  attunement_requirements?: string;

  value_gp?: number;
  weight?: number;

  mechanics?: {
    damage?: string;
    damage_type?: string;
    properties?: string[];
    ac?: number;
    ac_bonus?: number;
    stealth_disadvantage?: boolean;
    str_minimum?: number;
    effect?: string;
    charges?: number;
    recharge?: string;
  };

  description?: string;
  created_at?: string;
}

// SRD Spell
export interface SrdSpell {
  id: string;
  slug: string;
  name: string;
  game_system: GameSystem;
  source: string;
  license: string;

  level: number;
  school?: string;
  ritual?: boolean;
  concentration?: boolean;

  casting_time?: string;
  range?: string;
  components?: {
    verbal?: boolean;
    somatic?: boolean;
    material?: string;
  };
  duration?: string;

  classes?: string[];

  description?: string;
  higher_levels?: string;
  mechanics?: {
    damage?: string;
    damage_type?: string;
    save?: string;
    save_effect?: string;
    healing?: string;
    area?: { type: string; size: number };
  };

  created_at?: string;
}
