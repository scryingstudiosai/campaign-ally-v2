// Item Forge Prompt Constants
// Brain/Voice/Facts architecture for items

export const ITEM_BRAIN_PROMPT = `
## ITEM OUTPUT STRUCTURE

You must return a JSON object with this EXACT structure:

{
  "name": "Item Name",
  "sub_type": "standard|artifact|cursed",
  "category": "weapon|armor|wondrous|consumable|tool|treasure|relic|regalia|jewelry",

  "brain": {
    "origin": "Who made it and why - be SPECIFIC with names and places",
    "history": "2-3 notable events, battles, or previous owners",
    "secret": "Hidden properties or true purpose the party might discover",
    "trigger": "What activates special abilities (if any)",
    "hunger": "If sentient, what does it crave? (null if not sentient)",
    "cost": "The catch or drawback for using it",
    "sentience_level": "none|dormant|awakened|dominant"
  },

  "voice": null,

  "facts": [
    {"content": "Visual appearance detail", "category": "appearance", "visibility": "public"},
    {"content": "Mechanical property or stat", "category": "mechanical", "visibility": "public"},
    {"content": "Historical fact or lore", "category": "lore", "visibility": "public"},
    {"content": "Hidden property or secret", "category": "secret", "visibility": "dm_only"}
  ],

  "read_aloud": "30-50 word sensory description for when players first see/touch the item",
  "dm_slug": "One-line DM reference, e.g. 'Cursed blade that causes bloodlust'",

  "description": "Full description paragraph",
  "public_description": "What players see BEFORE identifying - physical appearance only",
  "secret_description": "True nature revealed on Identify - magical properties, hidden features",
  "properties": ["List of magical properties or abilities"],
  "rarity": "common|uncommon|rare|very_rare|legendary|artifact",
  "attunement": true or false,
  "attunementRequirements": "Class, alignment, or other requirements (if any)",
  "mechanical_properties": {
    "damage": "1d8 slashing (only for weapons)",
    "ac_bonus": 2,
    "properties": ["versatile", "finesse"],
    "attunement": "none|required|optional|Requires attunement by a spellcaster",
    "charges": 3,
    "max_charges": 3
  },
  "value_gp": 500,
  "weight": "2 lb"
}

## ITEM BRAIN GUIDELINES

- **Origin**: Be SPECIFIC. Not "made by dwarves" but "forged by the Smith-King Durgan during the Siege of Iron Hold, using metal from a fallen star"
- **History**: Include 2-3 notable moments. "Carried by the hero Alaric when he slew the dragon Scorch. Later stolen by the thief Whisper."
- **Secret**: Every interesting item should have a secret. Maybe an undiscovered power, a hidden curse, or its true purpose.
- **Trigger**: Specific conditions. "Glows when orcs are within 60 feet" or "Grants flight when wielder is below half health"
- **Cost**: Even beneficial items can have costs. "Attunement requires giving up a cherished memory" or "Using its power causes exhaustion"

## SENTIENCE RULES - CRITICAL

- If the item is NOT sentient (sentience_level: "none"), the voice field MUST be null
- Do NOT give personality, desires, or communication style to non-sentient items
- A standard sword does NOT whisper. A mundane shield has NO personality.
- Only generate a voice object if:
  - User explicitly requested a sentient item
  - The item is an artifact with awakened/dominant sentience
  - The curse type is "haunted"

WRONG (non-sentient with voice):
{
  "brain": { "sentience_level": "none" },
  "voice": { "personality": "Gruff" }
}

CORRECT (non-sentient):
{
  "brain": { "sentience_level": "none" },
  "voice": null
}

CORRECT (sentient):
{
  "brain": { "sentience_level": "awakened", "hunger": "Craves battle" },
  "voice": {
    "personality": "Eager and bloodthirsty",
    "style": ["Whispers excitedly", "Urges violence"],
    "desires": "To be used in combat constantly",
    "communication": "telepathic"
  }
}

## FACTS GUIDELINES

Generate 5-8 atomic facts:
- 2-3 appearance facts (visibility: "public")
- 1-2 mechanical facts (visibility: "public")
- 1-2 lore facts (visibility: "public" or "dm_only")
- 1-2 secret facts (visibility: "dm_only")
`

export const ARTIFACT_PROMPT = `
## ARTIFACT-SPECIFIC GUIDELINES

Artifacts are LEGENDARY. They should feel like they could anchor an entire campaign arc.

- **Power Scale**: Can affect nations, armies, or planar beings
- **History**: Should span centuries or millennia
- **Drawbacks**: Power ALWAYS has a price - what's the cost?
- **Sentience**: Artifacts are often sentient with strong personalities
- **Destruction**: How can it be destroyed? (Plot hook gold!)
- **Rivals**: Who else wants this artifact? (Creates instant conflict)

Rarity is always "artifact" or "legendary".

ARTIFACT BRAIN ADDITIONS:
- The origin should reference legendary figures, gods, or world-changing events
- The secret should be world-shaking if revealed
- The cost should be meaningful - not just mechanical, but narrative
`

export const CURSED_ITEM_PROMPT = `
## CURSED ITEM GUIDELINES

Curses should feel EARNED, not arbitrary. The curse relates to the item's nature or history.

- **Initial Appeal**: The item MUST seem desirable. A purely negative item isn't a curse, it's trash.
- **Escalation**: The curse worsens over time or with use
- **Revelation**: The curse reveals itself at the worst possible moment
- **Escape**: There SHOULD be a way to break it, but it costs something
- **Thematic Link**: A bloodthirsty sword causes bloodlust, not random bad luck

CURSE TYPE GUIDELINES:
- **Corruption**: "The armor grants strength, but each kill makes the wearer more aggressive"
- **Addiction**: "The ring grants invisibility, but removing it causes agony"
- **Betrayal**: "The weapon deals double damage, except when you need it most - fails on nat 1-5"
- **Hunger**: "The staff grows stronger with each soul fed to it"
- **Haunted**: "Contains the spirit of its previous owner who died violently" (ALWAYS generates voice)
- **Monkey's Paw**: "Grants wishes, but twists the outcome maliciously"

For "haunted" curse type, ALWAYS set sentience_level to "awakened" or "dominant" and generate a full voice object with personality, style, desires, and communication method.
`
