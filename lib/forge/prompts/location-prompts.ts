// Location Forge Prompt Constants
// Brain/Soul/Mechanics architecture for locations

export const LOCATION_BRAIN_PROMPT = `
## LOCATION OUTPUT STRUCTURE

You must return a JSON object with this EXACT structure:

{
  "name": "Location Name",
  "sub_type": "region|settlement|district|building|room|landmark|dungeon",

  "brain": {
    "purpose": "Why this place exists - its function in the world",
    "atmosphere": "Oppressive, Foreboding",
    "danger_level": "safe|low|moderate|high|deadly",
    "secret": "What's hidden here that players might discover",
    "history": "1-2 key events that shaped this place",
    "current_state": "What's happening here RIGHT NOW",
    "conflict": "The tension or problem that exists here",
    "opportunity": "What players can gain (allies, treasure, info, quests)",
    "contains": ["The Gilded Spire", "Shadowmarket", "Temple of Stars"],
    "inhabitants": [
      {
        "name": "Gareth the Keeper",
        "role": "Owner/Proprietor",
        "hook": "Owes a debt to the thieves' guild"
      },
      {
        "name": "Silent Mira",
        "role": "Regular patron",
        "hook": "Knows secret entrance to the catacombs"
      }
    ]
  },

  "soul": {
    "sights": ["Visual detail 1", "Visual detail 2", "Visual detail 3"],
    "sounds": ["Sound 1", "Sound 2"],
    "smells": ["Smell 1", "Smell 2"],
    "temperature": "Description of temperature/climate",
    "lighting": "Description of light conditions",
    "distinctive_feature": "The ONE memorable thing about this place",
    "mood": "The emotional tone players should feel"
  },

  "mechanics": {
    "size": "Rough dimensions or 'sprawling city' / 'cramped chamber'",
    "terrain": ["difficult terrain", "heavily obscured"],
    "hazards": [
      {
        "name": "Hazard Name",
        "description": "What it does",
        "dc": 15,
        "damage": "2d6 fire",
        "effect": "Additional effect"
      }
    ],
    "resources": ["What can be found here"],
    "encounters": [
      {
        "name": "Goblin Patrol",
        "likelihood": "common",
        "cr_range": "1/4 - 1"
      }
    ],
    "resting": {
      "safe_rest": true,
      "long_rest_available": true,
      "cost": "5 sp/night"
    }
  },

  "facts": [
    {"content": "Visual/sensory fact", "category": "appearance", "visibility": "public"},
    {"content": "What locals know", "category": "lore", "visibility": "public"},
    {"content": "Rumor or legend", "category": "lore", "visibility": "public"},
    {"content": "Hidden truth", "category": "secret", "visibility": "dm_only"}
  ],

  "read_aloud": "40-60 word atmospheric description to read when players arrive. Focus on the SENSES - what they see, hear, smell. End with something that invites interaction.",

  "dm_slug": "One-line reference: 'Abandoned dwarven mine, now goblin lair, hides entrance to Underdark'"
}

## LOCATION BRAIN GUIDELINES

### PURPOSE
Every location needs a reason to exist. Ask: "Why would someone come here?"
- A tavern provides rest, rumors, and contacts
- A dungeon holds treasure, prisoners, or ancient secrets
- A city district has its own economy and social structure

### ATMOSPHERE
Return 1-3 SHORT KEYWORDS only. NO sentences. Examples:
- "Oppressive, Foreboding" (dungeons, prisons)
- "Bustling, Chaotic" (markets, cities)
- "Serene, Sacred" (temples, ancient groves)
- "Decaying, Haunted" (ruins, graveyards)

### DANGER LEVEL
- Safe: No combat expected (friendly settlements)
- Low: Minor threats, easy encounters (outskirts, guarded areas)
- Moderate: Standard adventure difficulty (typical dungeon)
- High: Serious danger, resource drain (deep dungeons, war zones)
- Deadly: TPK possible, proceed with caution (dragon lairs, demon temples)

### SECRET
Every interesting location has something to discover:
- Hidden room, passage, or treasure
- True history vs. what people believe
- An NPC's real agenda
- A dormant threat about to awaken

### CONFLICT
Locations without conflict are boring. What tension exists?
- Factions competing for control
- A threat from outside or within
- Scarcity of resources
- Corruption or decay
- A mystery to solve

### CONTAINS (Sub-Locations)
List 3-5 evocative sub-location NAMES ONLY. No descriptions, no dashes.
- Good: ["The Gilded Spire", "Shadowmarket", "Temple of Stars"]
- Bad: ["The Gilded Spire - a tall tower", "Shadowmarket - underground bazaar"]
These become stub entities the DM can flesh out later.

### INHABITANTS (NPCs)
Generate 1-3 NPCs who inhabit or frequent this location. Each NPC needs:
- **name**: A memorable, flavorful name
- **role**: Their function (owner, guard, patron, servant, etc.)
- **hook**: One interesting detail that makes them useful to players (a secret, a connection, a skill, a problem)

Guidelines by location type:
- **Tavern/Inn**: Owner, notable regulars, mysterious stranger
- **Shop**: Proprietor, apprentice, unique customer
- **Temple**: High priest, acolyte with doubts, petitioner seeking help
- **Dungeon**: Prisoners, rival adventurers, creature that can parley
- **Settlement**: Leader, merchant, troublemaker
- **Wilderness**: Hermit, hunter, lost traveler

These NPCs become stub entities for the DM to flesh out later.
Do NOT include monsters or hostile creatures here - those go in encounters.
Focus on NPCs the party might TALK to.

## LOCATION SOUL GUIDELINES

The Soul makes locations MEMORABLE. Focus on sensory details that stick.

### THE DISTINCTIVE FEATURE
Every location needs ONE thing that makes it unique. When players think of this place, what image comes to mind?
- The tavern with the dragon skull mounted above the bar
- The library where books float between shelves
- The swamp where the trees have faces

### SENSORY LAYERS
Don't just describe what players SEE. Include:
- SOUNDS: Dripping water, distant screams, cheerful music, ominous silence
- SMELLS: Smoke, rot, flowers, cooking meat, old books, sea salt
- TEXTURES: Slimy walls, gritty sand, smooth marble, splintered wood
- TEMPERATURE: Oppressive heat, bone-chilling cold, humid, dry

## LOCATION MECHANICS GUIDELINES

### HAZARDS
Every dungeon or dangerous area should have at least one hazard:
- Environmental (lava, pit traps, poisonous gas)
- Magical (wild magic zones, cursed areas)
- Creature-based (spider webs, fungal spores)

Include DC for saves and damage/effects.

### ENCOUNTERS
For adventure sites, suggest who/what might be encountered:
- Common: Happens frequently (guards, wildlife)
- Uncommon: Occasional (patrols, predators)
- Rare: Special encounters (boss, unique creature)

### RESTING
Important for resource management:
- Can players safely short rest?
- Is long rest possible without interruption?
- Cost if it's an inn/tavern
`;

export const REGION_PROMPT = `
## REGION-SPECIFIC GUIDELINES

Regions are large areas: kingdoms, territories, wilderness expanses.

Focus on:
- Political structure (who rules, what factions compete)
- Geography (terrain types, climate, natural resources)
- Culture (customs, religion, economy)
- Threats (monsters, enemy nations, natural disasters)
- Notable settlements and landmarks within

Contains: List 3-5 notable settlement or landmark NAMES within this region. Names only, no descriptions.
`;

export const SETTLEMENT_PROMPT = `
## SETTLEMENT-SPECIFIC GUIDELINES

Settlements are population centers: cities, towns, villages.

Focus on:
- Government (who's in charge, how stable)
- Economy (what do they produce, trade, need)
- Culture (festivals, customs, social structure)
- Districts (different neighborhoods with character)
- Key NPCs (leaders, merchants, quest-givers)
- Current events (what's happening now)

Size guidelines:
- Village: 20-1,000 people
- Town: 1,000-8,000 people
- City: 8,000-25,000 people
- Metropolis: 25,000+ people

Contains: List 3-5 district, building, or landmark NAMES. Names only, no descriptions.
`;

export const DISTRICT_PROMPT = `
## DISTRICT-SPECIFIC GUIDELINES

Districts are neighborhoods within larger settlements.

Focus on:
- Character (wealthy, poor, industrial, religious, entertainment)
- Key establishments (taverns, shops, temples, guildhalls)
- Local color (what makes this area distinct from others)
- Who lives/works here
- Day vs night atmosphere

Contains: List 2-4 building or location NAMES within the district. Names only, no descriptions.
`;

export const BUILDING_PROMPT = `
## BUILDING-SPECIFIC GUIDELINES

Buildings are specific structures: taverns, temples, shops, homes, dungeons.

Focus on:
- Purpose (what happens here)
- Proprietor/Owner (who runs it, their personality)
- Patrons/Visitors (who comes here, why)
- Distinctive features (what makes this building unique)
- Services/Goods (what can players get here)
- Secrets (what's hidden in the back room, basement, attic)

Contains: List room or area NAMES within (for larger buildings). Names only, no descriptions.
`;

export const ROOM_PROMPT = `
## ROOM-SPECIFIC GUIDELINES

Rooms are specific areas within a building or dungeon.

Focus on:
- Purpose (what is/was this room for)
- Contents (furniture, items, features)
- Sensory details (lighting, sounds, smells)
- Threats or opportunities (traps, treasure, clues)
- Exits and connections to other areas

For dungeon rooms, always include potential hazards or encounters.
`;

export const LANDMARK_PROMPT = `
## LANDMARK-SPECIFIC GUIDELINES

Landmarks are notable points of interest: monuments, natural features, ruins.

Focus on:
- Visual impact (what makes it stand out)
- History or legend (why is it significant)
- Current use (pilgrimage site, navigation point, meeting place)
- Mystery or rumor (what stories do locals tell)
- What can be found/discovered here

Landmarks should be memorable enough to reference in player navigation.
`;

export const DUNGEON_PROMPT = `
## DUNGEON-SPECIFIC GUIDELINES

Dungeons are adventure sites: ruins, lairs, caves, tombs.

Focus on:
- Original purpose (what was it built for)
- Current inhabitants (who/what lives here now)
- Layout hints (levels, wings, key areas)
- Treasure (what rewards await)
- Boss/Final threat (what guards the deepest area)
- History (why is it abandoned/dangerous now)

CRITICAL: Include multiple hazards and encounters.

Contains: List 3-5 key area or room NAMES within the dungeon. Names only, no descriptions.

### DUNGEON PACING
A good dungeon has rhythm:
- Entry area (easier, sets the tone)
- Exploration zones (medium difficulty, treasure, clues)
- Choke points (harder encounters, resource drain)
- Boss area (climactic challenge, major reward)

### HAZARD EXAMPLES
- Pit trap: DC 12 Perception to notice, DC 14 Dex save, 2d6 falling damage
- Poison gas: DC 13 Con save, 3d6 poison damage, half on success
- Collapsing ceiling: DC 15 Dex save, 4d6 bludgeoning, restrained on fail
- Arcane rune: DC 14 Int (Arcana) to identify, triggers when stepped on
`;
