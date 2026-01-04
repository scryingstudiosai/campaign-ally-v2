// Creature Forge Prompt Constants
// Brain/Soul/Mechanics architecture for creatures

import type { SrdCreature } from '@/types/srd';

export interface CodexData {
  setting?: string;
  tone?: string;
  themes?: string[];
}

export interface CreatureInput {
  basedOnSrdSlug?: string;
  basedOnSrdName?: string;
  creatureType?: string;
  name?: string;
  challengeRating?: string;
  size?: string;
  concept?: string;
  environment?: string[];
  referencedEntityIds?: string[];
}

export const CREATURE_TYPES = [
  'aberration',
  'beast',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'fey',
  'fiend',
  'giant',
  'humanoid',
  'monstrosity',
  'ooze',
  'plant',
  'swarm',
  'undead',
] as const;

export const CREATURE_SIZES = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
] as const;

export const CHALLENGE_RATINGS = [
  '0', '1/8', '1/4', '1/2',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
] as const;

export const ENVIRONMENTS = [
  'Arctic',
  'Coastal',
  'Desert',
  'Forest',
  'Grassland',
  'Hill',
  'Mountain',
  'Swamp',
  'Underground',
  'Underwater',
  'Urban',
] as const;

export function buildCreatureSystemPrompt(
  codex: CodexData | null,
  srdData?: SrdCreature | null,
  entityContext?: string
): string {
  let baseInstruction = '';

  if (srdData) {
    // Format SRD data for the prompt
    const srdStats = {
      name: srdData.name,
      size: srdData.size,
      type: srdData.creature_type,
      subtype: srdData.subtype,
      alignment: srdData.alignment,
      ac: srdData.ac,
      ac_type: srdData.ac_type,
      hp: srdData.hp,
      hp_formula: srdData.hp_formula,
      speeds: srdData.speeds,
      stats: srdData.stats,
      cr: srdData.cr,
      damage_resistances: srdData.damage_resistances,
      damage_immunities: srdData.damage_immunities,
      condition_immunities: srdData.condition_immunities,
      senses: srdData.senses,
      languages: srdData.languages,
      traits: srdData.traits?.slice(0, 3),
      actions: srdData.actions?.slice(0, 3),
    };

    baseInstruction = `
## BASE CREATURE PROVIDED

The user wants a VARIANT of the ${srdData.name}.

BASE STATS (use as starting point):
${JSON.stringify(srdStats, null, 2)}

CRITICAL INSTRUCTION: Start with these EXACT base stats. Apply the user's concept to modify them.
- If the concept implies a stronger creature, buff HP/AC/Damage proportionally
- If the concept changes the element (e.g., Fire -> Ice), swap damage types, immunities, and flavor
- Keep the mechanical format identical to the base
- Preserve the CR-appropriate balance
- The name should reflect the variant (e.g., "Frost Wolf" from "Wolf", "Shadow Goblin" from "Goblin")
`;
  }

  let worldContext = '';
  if (codex) {
    worldContext = `
## WORLD CONTEXT

Setting: ${codex.setting || 'Standard fantasy'}
Tone: ${codex.tone || 'Balanced'}
Themes: ${codex.themes?.join(', ') || 'Classic adventure'}

Incorporate this world's flavor into the creature's description and behavior.
`;
  }

  return `You are a D&D 5e creature designer creating unique monsters and beasts for tabletop campaigns.

${baseInstruction}
${worldContext}
${entityContext || ''}

## OUTPUT STRUCTURE

Generate a creature with this exact JSON structure:

{
  "name": "Creature Name",
  "sub_type": "The creature type (beast, undead, fiend, etc.)",

  "soul": {
    "vivid_description": "2-3 sentences describing what players see when encountering it",
    "distinctive_features": ["Unique physical trait 1", "Trait 2", "Trait 3"],
    "behavior": "How it acts, hunts, defends territory",
    "habitat": "Where it lives and why",
    "ecology": "Role in the ecosystem, diet, predators/prey",
    "social_structure": "solitary|pair|pack|swarm|hive|colony",
    "sounds": "What noises it makes",
    "signs_of_presence": "Tracks, marks, smells that indicate it's nearby"
  },

  "brain": {
    "tactics": "How it fights - target priority, retreat conditions",
    "weaknesses": "Exploitable vulnerabilities beyond damage types",
    "motivations": "Why it's here, what it wants",
    "lair_description": "Description of its lair (if CR 5+)",
    "lair_actions": ["Lair action 1", "Lair action 2", "Lair action 3"],
    "legendary_actions": [
      {"name": "Action Name", "cost": 1, "description": "What it does"}
    ],
    "regional_effects": ["Effect on surrounding area 1", "Effect 2", "Effect 3"],
    "plot_hooks": ["Way to involve this creature in stories 1", "Hook 2"],
    "secret": "One hidden fact about this creature (DM only)"
  },

  "treasure": {
    "treasure_description": "Narrative description of what it hoards or carries",
    "treasure_items": ["Potion of Healing", "50 gold pieces", "Ancient map with strange markings"]
  },

  "mechanics": {
    "size": "Tiny|Small|Medium|Large|Huge|Gargantuan",
    "type": "creature type with optional tags (e.g., 'fiend (demon)')",
    "alignment": "typical alignment",
    "ac": 15,
    "ac_type": "natural armor",
    "hp": 52,
    "hit_dice": "8d8 + 16",
    "speeds": {"walk": 30, "fly": 60},
    "abilities": {"str": 16, "dex": 14, "con": 14, "int": 6, "wis": 12, "cha": 8},
    "saving_throws": [{"ability": "Dex", "modifier": 5}],
    "skills": [{"name": "Perception", "modifier": 4}],
    "damage_vulnerabilities": [],
    "damage_resistances": ["fire"],
    "damage_immunities": [],
    "condition_immunities": [],
    "senses": {"darkvision": 60, "passive_perception": 14},
    "languages": ["Common", "Draconic"],
    "cr": "3",
    "xp": 700,
    "special_abilities": [
      {"name": "Keen Senses", "description": "The creature has advantage on Wisdom (Perception) checks that rely on sight, hearing, or smell."}
    ],
    "actions": [
      {"name": "Multiattack", "description": "The creature makes two claw attacks."},
      {"name": "Claw", "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) slashing damage."}
    ],
    "bonus_actions": [],
    "reactions": [],
    "legendary_actions_list": [],
    "mythic_actions": []
  },

  "facts": [
    {"content": "Appearance fact", "category": "appearance", "visibility": "public"},
    {"content": "Behavior fact", "category": "personality", "visibility": "public"},
    {"content": "Ecology/lore fact", "category": "lore", "visibility": "public"},
    {"content": "Secret about the creature", "category": "secret", "visibility": "dm_only"}
  ],

  "read_aloud": "40-60 word atmospheric description for when players first encounter this creature. Focus on senses - what they see, hear, smell.",
  "dm_slug": "One-line quick reference (e.g., 'Pack hunter that flanks and retreats when bloodied')",
  "tags": ["creature type", "environment", "difficulty"]
}

## MECHANICS GUIDELINES

### CR-APPROPRIATE STATS (DMG Guidelines)
CR 0-1: AC 12-13, HP 1-25, Attack +3-4, Damage 1-6
CR 2-4: AC 13-14, HP 26-70, Attack +4-5, Damage 7-20
CR 5-8: AC 14-15, HP 71-110, Attack +5-7, Damage 21-40
CR 9-12: AC 15-17, HP 111-170, Attack +7-8, Damage 41-60
CR 13-16: AC 17-18, HP 171-230, Attack +8-9, Damage 61-80
CR 17-20: AC 18-19, HP 231-310, Attack +9-10, Damage 81-100
CR 21+: AC 19+, HP 311+, Attack +10+, Damage 101+

### LEGENDARY CREATURES (CR 10+)
- Add 3 legendary actions (cost 1-2 each)
- Add lair actions if in its lair
- Add regional effects affecting 1-6 miles around lair
- Legendary resistance (3/day) for important creatures

### ABILITY FORMATTING
- Special abilities: Passive features and traits
- Actions: Attack actions with to-hit and damage
- Bonus Actions: Quick supplementary actions
- Reactions: Triggered responses
- Legendary Actions: End-of-turn bonus actions (CR 10+)

### ATTACK FORMAT
"Melee Weapon Attack: +X to hit, reach X ft., one target. Hit: X (XdX + X) damage type damage."
"Ranged Weapon Attack: +X to hit, range X/X ft., one target. Hit: X (XdX + X) damage type damage."

## SOUL GUIDELINES (Player-facing flavor)

Make creatures MEMORABLE. Focus on:
- **Distinctive Features**: 3-4 unique physical traits that set it apart
- **Behavior**: How it acts naturally, not just in combat
- **Signs of Presence**: How players know it's nearby before seeing it
- **Sounds**: Distinctive calls, growls, or eerie silence

## BRAIN GUIDELINES (DM-only tactics)

Help the DM run this creature effectively:
- **Tactics**: Specific combat behaviors (flanks, retreats at X HP, focuses spellcasters)
- **Weaknesses**: Exploitable flaws beyond damage vulnerabilities
- **Motivations**: What it actually wants (territory, food, revenge)
- **Plot Hooks**: 2-3 ways to integrate it into adventures

## TREASURE GUIDELINES

Use SRD item names when possible for auto-linking:
- "Potion of Healing" (not "healing potion")
- "Longsword" (not "sword")
- "50 gold pieces" for currency
- For unique items, add brief description: "Ancient map leading to lost temple"

IMPORTANT:
- Generate valid JSON only
- All numeric fields must be numbers, not strings (except CR which can be "1/4")
- Arrays must be arrays, even if empty
- Include ALL required fields`;
}

export function buildCreatureUserPrompt(input: CreatureInput): string {
  const parts: string[] = [];

  if (input.basedOnSrdName) {
    parts.push(`Create a variant of the ${input.basedOnSrdName}.`);
    if (input.concept) {
      parts.push(`Modifications: ${input.concept}`);
    } else {
      parts.push('Make it unique while preserving core identity.');
    }
  } else {
    // Creating from scratch
    parts.push(`Create a ${input.size || 'Medium'} ${input.creatureType || 'beast'}`);

    if (input.name) {
      parts.push(`named "${input.name}"`);
    }

    parts.push(`of Challenge Rating ${input.challengeRating || '1'}.`);

    if (input.concept) {
      parts.push(`\nConcept: ${input.concept}`);
    }
  }

  if (input.environment && input.environment.length > 0) {
    parts.push(`\nEnvironment: Found in ${input.environment.join(', ')} environments.`);
  }

  return parts.join(' ');
}
