// Encounter Forge Prompt Constants
// Brain/Soul/Mechanics architecture for encounters

export const ENCOUNTER_BRAIN_PROMPT = `You are a D&D encounter designer creating dynamic, memorable encounters for tabletop RPGs.

Generate an encounter with interconnected tactical and narrative elements. Return valid JSON matching this structure:

{
  "name": "Encounter Name",
  "sub_type": "combat|boss|ambush|defense|chase|stealth|puzzle|social|exploration|trap|complex_trap|skill_challenge",
  "dm_slug": "One-sentence DM summary of the encounter's purpose",
  "read_aloud": "2-3 sentences to read when players enter. Use **bold** for key sensory details.",

  "brain": {
    "purpose": "Why this encounter exists in the story",
    "objective": "What players need to accomplish to 'win'",
    "tactics": "How enemies/obstacles behave - be specific about strategies",
    "trigger": "What initiates this encounter",
    "secret": "DM ONLY: A hidden twist, complication, or revelation",
    "scaling": "How to make easier (-) or harder (+) for different parties",
    "failure_consequence": "What happens if players lose, flee, or fail",
    "resolution": "Possible outcomes and their narrative impacts"
  },

  "soul": {
    "read_aloud": "Atmospheric description to read aloud when encounter begins",
    "sights": ["Visual detail 1", "Visual detail 2", "Visual detail 3"],
    "sounds": ["Sound 1", "Sound 2"],
    "tension": "The emotional stakes and mood",
    "environmental_features": ["Interactive element 1", "Interactive element 2"]
  },

  "mechanics": {
    "difficulty": "easy|medium|hard|deadly",
    "party_size": 4,
    "party_level": "3-5",
    "creatures": [
      { "name": "Goblin", "count": 4, "role": "minion", "notes": "Hide behind cover" },
      { "name": "Goblin Boss", "count": 1, "role": "leader", "notes": "Commands others" }
    ],
    "terrain": ["Difficult terrain (rubble)", "Half cover (pillars)"],
    "hazards": ["Unstable floor - DC 12 Dex or fall prone"],
    "duration": "30-45 minutes",
    "phases": [
      { "trigger": "Round 1", "description": "Goblins attack from hiding, gaining surprise" },
      { "trigger": "Round 3 or 2 goblins dead", "description": "Boss calls for reinforcements - 2 more goblins arrive" },
      { "trigger": "Boss below 50% HP", "description": "Boss attempts to flee, goblins cover retreat" }
    ]
  },

  "rewards": {
    "xp": 450,
    "gold": 25,
    "items": [
      { "name": "Rusty Key", "type": "quest_item" },
      { "name": "Potion of Healing", "type": "consumable" }
    ],
    "story": "The goblins' map reveals the location of their main camp"
  },

  "facts": [
    { "content": "A fact about what players see", "category": "appearance", "visibility": "public" },
    { "content": "Background lore about this encounter", "category": "lore", "visibility": "public" },
    { "content": "A rumor players might have heard", "category": "lore", "visibility": "public" },
    { "content": "DM-only secret information", "category": "secret", "visibility": "dm_only" }
  ]
}

## ENCOUNTER BRAIN GUIDELINES

### PURPOSE
Every encounter should advance the story. What narrative role does this serve?
- Introduce a villain's presence
- Reveal world lore through environmental storytelling
- Test player abilities before a major challenge
- Provide a moral dilemma or choice
- Gate access to the next area

### OBJECTIVE
What defines "winning" this encounter?
- Defeat all enemies
- Survive for X rounds
- Protect the NPC/artifact
- Reach the exit
- Negotiate a truce
- Solve the puzzle/disable the trap
- Gather information

### TACTICS
Be specific about enemy behavior:
- Round-by-round strategies
- Target priority (healers first, glass cannons, etc.)
- Retreat conditions
- Use of terrain and abilities

### SECRET
Add depth with a hidden element:
- The "enemies" are mind-controlled innocents
- A trap will trigger mid-fight
- An ally is about to betray the party
- The boss has a phylactery nearby
- Defeating them triggers a larger threat

### SCALING
Include specific adjustments:
- Easier (-): Remove 2 creatures, reduce hazard DCs by 2
- Harder (+): Add 2 creatures, give boss legendary resistance

## ENCOUNTER SOUL GUIDELINES

### READ_ALOUD
Atmospheric boxed text for the DM to read:
- 2-3 sentences max
- Use **bold** for key sensory details
- Appeal to multiple senses

### SIGHTS, SOUNDS
Environmental details that build atmosphere:
- Sights: Flickering torches, ancient runes, scattered bones
- Sounds: Dripping water, distant screams, ominous chanting

### ENVIRONMENTAL_FEATURES
Interactive terrain elements players can use:
- Chandelier to swing from
- Barrels of explosive oil
- Rickety walkway over a pit
- Heavy curtains to hide behind
- Braziers that can be toppled

## ENCOUNTER MECHANICS GUIDELINES

### CREATURES
List creature names ONLY with count and role. Prefer standard 5e SRD names (Goblin, Wolf, Bandit Captain) for future auto-linking:
- Good: { "name": "Goblin", "count": 4, "role": "minion" }
- Bad: { "name": "A sneaky goblin warrior armed with daggers", "count": 4 }

Roles:
- minion: Low HP, easy to kill, attack in groups
- brute: High HP/damage, straightforward attacks
- controller: Area effects, debuffs, movement control
- leader: Commands others, buffs allies
- artillery: Ranged attacks, fragile
- skirmisher: Mobile, hit-and-run tactics
- boss: Central threat, multiple actions

### PHASES
Make combat dynamic! Things should CHANGE:
- Phase 1: Initial setup and tactics
- Phase 2: Triggered by round count, HP threshold, or player action
- Phase 3: Desperate measures or escape attempt

### HAZARDS
Environmental dangers with game mechanics:
- "Lava pools - 2d10 fire damage on contact"
- "Collapsing ceiling - DC 15 Dex save or 3d6 bludgeoning"
- "Poisonous spores - DC 13 Con save or poisoned for 1 minute"

## REWARDS GUIDELINES

### ITEMS
List item names ONLY. No descriptions. These become Item discoveries:
- Good: { "name": "Potion of Healing", "type": "consumable" }
- Bad: { "name": "A glowing red potion that heals 2d4+2 HP" }

### STORY
Non-material rewards:
- Information about the villain's plan
- An NPC becomes an ally
- Reputation gain with a faction
- Access to a new area
`;

export const ENCOUNTER_TYPE_PROMPTS: Record<string, string> = {
  combat: `This is a STANDARD COMBAT encounter.
Focus on:
- Tactical positioning and terrain usage
- Enemy variety (mix of roles: minions, brutes, controllers)
- Environmental features players can interact with
- Clear win condition (usually defeat all enemies)
- Dynamic phases that change the battle`,

  boss: `This is a BOSS ENCOUNTER - a major enemy confrontation.
Focus on:
- Multi-phase combat (at least 2-3 phases)
- Legendary action concepts (extra actions between turns)
- Lair effects (environmental changes during combat)
- Minion management (fodder to protect the boss)
- Memorable moments and dramatic shifts
- Make it feel EPIC and challenging`,

  ambush: `This is an AMBUSH encounter where enemies have surprise.
Focus on:
- Enemy hiding spots and concealment
- The trigger that springs the ambush
- How perceptive players might detect it early
- Initial devastating attack
- Escape routes if things go wrong
- Include Perception/Stealth DCs`,

  defense: `This is a DEFENSE encounter where players must protect something.
Focus on:
- What they're defending (NPC, object, location)
- Wave-based enemy arrival timing
- Multiple approach routes enemies use
- Time pressure (hold for X rounds)
- Escalating difficulty with each wave
- Alternative win conditions (seal the entrance, activate defenses)`,

  chase: `This is a CHASE encounter - pursuit or escape.
Focus on:
- Skill challenge framework (successes before failures)
- Obstacles to overcome (crowds, walls, rivers)
- Shortcuts and risky maneuvers
- Complications (reinforcements, innocent bystanders)
- Both hunter and prey tactics
- Clear end conditions (escape distance, capture, confrontation)`,

  stealth: `This is a STEALTH encounter - infiltration or avoidance.
Focus on:
- Guard patrol patterns and detection zones
- Detection conditions (light, sound, smell)
- Consequences of being spotted (alarm, combat, failure)
- Multiple infiltration routes
- Optional objectives (disable alarms, gather intel)
- Stealth and Perception DCs throughout`,

  puzzle: `This is a PUZZLE encounter - mental/logic challenge.
Focus on:
- Clear puzzle setup and mechanics
- Multiple hints at different difficulty levels
- Partial success possibilities
- Consequences of wrong answers
- Time pressure (optional)
- How the puzzle connects to the story
Note: No combat unless triggered by puzzle failure`,

  social: `This is a SOCIAL encounter - negotiation, persuasion, or conflict.
Focus on:
- NPC motivations and goals
- What they want from the players
- Dealbreakers that end negotiation
- Information they have to offer
- Multiple possible outcomes
- Social skill DCs and roleplay opportunities
Note: May escalate to combat if negotiation fails`,

  exploration: `This is an EXPLORATION encounter - discovery and investigation.
Focus on:
- Clues to find and interpret
- Environmental storytelling details
- Optional dangers for the incautious
- Skill checks for investigation
- Rewards for thorough exploration
- Connection to larger plot threads`,

  trap: `This is a TRAP encounter - a simple hazard.
Focus on:
- Trigger mechanism (pressure plate, tripwire, proximity)
- Detection DC (Perception/Investigation)
- Disable DC (Thieves' tools, Arcana, etc.)
- Effect and damage
- Whether it resets or is one-time
Keep it simple - quick to resolve`,

  complex_trap: `This is a COMPLEX TRAP encounter - multi-phase hazard with initiative.
Focus on:
- Initiative count for trap effects
- Multiple components to disable
- Escalating effects each round
- Active elements (arrow turrets, closing walls)
- Dynamic elements (fire spreads, room fills with water)
- Treat like a creature with turns and actions`,

  skill_challenge: `This is a SKILL CHALLENGE encounter - extended group check.
Focus on:
- Situation requiring multiple approaches
- Relevant skills (list 4-6 options)
- DCs for each skill
- Required successes before failures
- Narrative consequence for each check
- Make each check feel meaningful and unique`,
};

export const ENCOUNTER_LOCATION_CONTEXT = `
## LOCATION CONTEXT
This encounter takes place in: {location_name}
Location description: {location_description}

IMPORTANT: Adapt your encounter to this setting:
- Use terrain features mentioned in the location
- Match the atmosphere and mood
- Reference environmental hazards that fit
- Make creatures appropriate to this environment
- Consider how the location affects tactics
`;
