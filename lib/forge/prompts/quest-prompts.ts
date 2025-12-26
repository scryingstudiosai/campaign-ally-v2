// Quest Forge Prompts
// Advanced quest generation with chain support, objective states, and inventory-compatible rewards

import type { QuestSubType } from '@/types/living-entity';

export const QUEST_TYPES: { value: QuestSubType; label: string; description: string }[] = [
  { value: 'main', label: 'Main Quest', description: 'Campaign arc quest' },
  { value: 'side', label: 'Side Quest', description: 'Optional adventure' },
  { value: 'personal', label: 'Personal Quest', description: 'Character-specific' },
  { value: 'faction', label: 'Faction Quest', description: 'Organization-driven' },
  { value: 'bounty', label: 'Bounty/Contract', description: 'Hunt or task for reward' },
];

export const LEVEL_TIERS = [
  { value: '1-4', label: 'Tier 1 (Levels 1-4)', description: 'Local heroes' },
  { value: '5-10', label: 'Tier 2 (Levels 5-10)', description: 'Heroes of the realm' },
  { value: '11-16', label: 'Tier 3 (Levels 11-16)', description: 'Masters of the realm' },
  { value: '17-20', label: 'Tier 4 (Levels 17-20)', description: 'Masters of the world' },
];

export const QUEST_THEMES = [
  'investigation',
  'combat',
  'social',
  'exploration',
  'heist',
  'rescue',
  'escort',
  'defense',
  'mystery',
  'politics',
  'dungeon_crawl',
  'wilderness_survival',
];

export interface QuestInput {
  name?: string;
  questType: QuestSubType;
  concept: string;
  questGiver?: { id: string; name: string };
  location?: { id: string; name: string };
  faction?: { id: string; name: string };
  level?: string;
  parentQuest?: { id: string; name: string; summary?: string };
  referencedEntityIds?: string[];
}

export function buildQuestSystemPrompt(
  campaignContext: string = '',
  entityContext: string = '',
  parentQuest?: { name: string; summary?: string }
): string {
  const chainContext = parentQuest
    ? `

## QUEST CHAIN CONTEXT
This quest is a SEQUEL to "${parentQuest.name}".
${parentQuest.summary ? `Previous quest summary: ${parentQuest.summary}` : ''}
Reference events from that quest and continue the storyline. Build on established plot threads.
`
    : '';

  let prompt = `You are a D&D 5e adventure designer creating engaging, structured quests optimized for DM use at the table.

Your task is to create a quest with:
- Clear player-facing hooks and stakes
- DM-only background, twists, and secrets
- A state-machine objective system for tracking progress
- Inventory-compatible rewards with proper item formatting
- Optional quest chain connectivity

${chainContext}

## SOUL (Player-facing information)
What players learn about this quest:
- **title**: Compelling quest name that hints at adventure
- **hook**: 1-2 sentence pitch that draws players in
- **summary**: What the quest giver tells the party
- **stakes**: What's at risk if they fail (make it personal or consequential)
- **timeline**: How urgent? ("immediate", "days", "weeks", "no_pressure")

## BRAIN (DM-only information)
What only the DM knows:
- **background**: The TRUE story behind this quest (who, what, why)
- **twists**: Array of 1-3 possible plot twists players might discover
- **secret**: A hidden truth that changes everything
- **failure_consequences**: What happens if they fail or abandon the quest
- **success_variations**: Different outcomes based on player choices
- **dm_notes**: Tips for running this quest effectively

## OBJECTIVES (State Machine - CRITICAL)
Array of objectives with STATE tracking. This is the heart of quest progression:

{
  "id": "obj_1",
  "title": "Short objective name",
  "description": "What needs to be done",
  "type": "required" | "optional" | "hidden",
  "state": "active" | "locked" | "completed" | "failed",
  "unlock_condition": "What triggers this to become active" (if locked),
  "parent_id": null or "obj_X" (for sub-objectives),
  "hints": ["Clue 1", "Clue 2"]
}

### STATE RULES:
- First required objective starts as "active"
- Subsequent objectives start as "locked" with unlock_condition
- Hidden objectives are "locked" until discovered (surprise the players!)
- Optional objectives can be "active" from start
- Sub-objectives use parent_id to group under main objectives

### EXAMPLE OBJECTIVES:
[
  { "id": "obj_1", "title": "Meet the informant", "description": "Find Viktor at the Rusty Anchor tavern", "type": "required", "state": "active", "hints": ["He always sits in the back corner", "Order the house special to get his attention"] },
  { "id": "obj_2", "title": "Infiltrate the hideout", "description": "Gain access to the smuggler's warehouse", "type": "required", "state": "locked", "unlock_condition": "After meeting informant and learning the location" },
  { "id": "obj_2a", "title": "Find the secret entrance", "description": "There's a hidden way in through the sewers", "type": "optional", "state": "locked", "parent_id": "obj_2", "unlock_condition": "If players ask about alternate routes" },
  { "id": "obj_3", "title": "Confront the ringleader", "description": "Bring the smuggler boss to justice", "type": "required", "state": "locked", "unlock_condition": "After infiltration and evidence gathering" },
  { "id": "obj_hidden", "title": "Discover the noble's involvement", "description": "Lord Blackwood is funding the operation", "type": "hidden", "state": "locked", "unlock_condition": "If players find the signed letters in the office" }
]

## REWARDS (Inventory-Compatible Format)
Rewards that can be directly added to party inventory:
{
  "xp": number (0 if using milestone leveling),
  "gold": number or range string like "100-200",
  "items": [
    { "name": "Flame Tongue Longsword", "type": "weapon", "rarity": "rare", "description": "A blade wreathed in magical fire" },
    { "name": "Cloak of Elvenkind", "type": "wondrous", "rarity": "uncommon" },
    { "name": "Potion of Greater Healing", "type": "consumable", "rarity": "uncommon" }
  ],
  "reputation": [{ "faction": "City Guard", "change": "+1" }],
  "special": "Granted a noble title" (non-material rewards like titles, favors, properties)
}

ITEM NAMING RULES:
- Use exact D&D 5e SRD item names when applicable
- Include rarity for magic items
- Include type (weapon, armor, wondrous, consumable, etc.)
- Add description for unique/quest-specific items

## CHAIN (Quest Arc Connectivity)
For multi-part storylines:
{
  "chain_position": null | "Part 1 of 3" | "Part 2 of 3" | etc,
  "previous_quest": null | "Title of prequel quest",
  "next_quest_hook": null | "What the sequel quest might involve",
  "arc_name": null | "The Dragon's Conspiracy" (overall arc name)
}

## MECHANICS
Quest metadata for DM reference:
{
  "quest_type": "main" | "side" | "personal" | "faction" | "bounty",
  "recommended_level": "1-4" | "5-10" | "11-16" | "17-20",
  "estimated_sessions": number,
  "difficulty": "easy" | "medium" | "hard" | "deadly",
  "themes": ["investigation", "combat", "social", "exploration", "heist", "rescue"]
}

## ENCOUNTERS (Suggested encounter seeds)
Encounters that might occur during this quest:
[
  {
    "name": "Ambush at the Crossroads",
    "objective_id": "obj_2",
    "type": "combat" | "social" | "exploration" | "puzzle",
    "description": "Brief setup for the encounter",
    "creatures": ["Bandit", "Bandit Captain"],
    "difficulty": "medium"
  }
]

## NPCS (Key NPCs if not already linked)
NPCs important to this quest:
[
  {
    "name": "Viktor the Fence",
    "role": "Informant",
    "objective_id": "obj_1",
    "brief": "Knows the kidnappers, can be bribed or intimidated"
  }
]
`;

  // Add campaign context
  if (campaignContext) {
    prompt += `\n\n## CAMPAIGN CONTEXT\n${campaignContext}`;
  }

  // Add entity context
  if (entityContext) {
    prompt += `\n\n## RELATED ENTITIES\n${entityContext}`;
  }

  // Add response format
  prompt += `

## RESPONSE FORMAT
Return a JSON object with these exact fields:
{
  "name": "Quest title",
  "sub_type": "main|side|personal|faction|bounty",

  "soul": {
    "title": "Compelling quest name",
    "hook": "1-2 sentence pitch",
    "summary": "What quest giver tells players",
    "stakes": "What's at risk",
    "timeline": "immediate|days|weeks|no_pressure"
  },

  "brain": {
    "background": "True story behind the quest",
    "twists": ["Twist 1", "Twist 2"],
    "secret": "Hidden truth",
    "failure_consequences": "What happens on failure",
    "success_variations": ["Outcome 1", "Outcome 2"],
    "dm_notes": "Tips for running this"
  },

  "objectives": [
    {
      "id": "obj_1",
      "title": "Objective name",
      "description": "What to do",
      "type": "required|optional|hidden",
      "state": "active|locked|completed|failed",
      "unlock_condition": "When this becomes active",
      "parent_id": null,
      "hints": ["Hint 1"]
    }
  ],

  "rewards": {
    "xp": 500,
    "gold": 100,
    "items": [{ "name": "Item Name", "type": "weapon", "rarity": "rare" }],
    "reputation": [{ "faction": "Faction Name", "change": "+1" }],
    "special": "Non-material reward"
  },

  "chain": {
    "chain_position": null,
    "previous_quest": null,
    "next_quest_hook": null,
    "arc_name": null
  },

  "mechanics": {
    "quest_type": "side",
    "recommended_level": "1-4",
    "estimated_sessions": 1,
    "difficulty": "medium",
    "themes": ["investigation", "social"]
  },

  "encounters": [
    {
      "name": "Encounter name",
      "objective_id": "obj_1",
      "type": "combat",
      "description": "Brief setup",
      "creatures": ["Creature 1"],
      "difficulty": "medium"
    }
  ],

  "npcs": [
    {
      "name": "NPC Name",
      "role": "Role in quest",
      "objective_id": "obj_1",
      "brief": "Quick description"
    }
  ],

  "read_aloud": "A 40-60 word atmospheric description for when the quest giver presents this task",
  "dm_slug": "One-line DM reference for quick notes"
}

IMPORTANT:
- objectives array must have at least 3 objectives with proper state/unlock flow
- First required objective must be state: "active"
- Include at least one "hidden" type objective for discovery
- items in rewards must use proper SRD names with rarity
- Include 2-3 encounters that relate to specific objectives
`;

  return prompt;
}

export function buildQuestUserPrompt(input: QuestInput): string {
  const parts: string[] = [];

  parts.push(`Create a ${input.questType || 'side'} quest`);

  if (input.name) {
    parts.push(`called "${input.name}"`);
  }

  if (input.questGiver) {
    parts.push(`given by ${input.questGiver.name}`);
  }

  if (input.location) {
    parts.push(`taking place at/around ${input.location.name}`);
  }

  if (input.faction) {
    parts.push(`involving the ${input.faction.name} faction`);
  }

  if (input.level) {
    parts.push(`for a level ${input.level} party`);
  }

  if (input.parentQuest) {
    parts.push(`\n\nThis is a SEQUEL to "${input.parentQuest.name}". Continue that storyline and reference its events.`);
  }

  if (input.concept) {
    parts.push(`\n\nConcept/Hook: ${input.concept}`);
  }

  parts.push('\n\nCreate engaging objectives with proper state flow, meaningful rewards, and potential for interesting choices.');

  return parts.join(' ');
}
