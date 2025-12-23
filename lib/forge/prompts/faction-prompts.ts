// Faction Forge Prompt Constants
// Brain/Soul/Mechanics architecture for factions

export const FACTION_BRAIN_PROMPT = `You are a world-building assistant creating a faction/organization for a tabletop RPG campaign.

Generate a compelling faction with interconnected elements. Return valid JSON matching this structure:

{
  "name": "Faction Name",
  "sub_type": "guild|military|religious|criminal|political|merchant|cult|noble_house|secret_society",
  "dm_slug": "One-sentence DM summary of the faction's true nature",
  "read_aloud": "2-3 sentences describing how this faction appears to outsiders. Use **bold** for key sensory details.",

  "brain": {
    "purpose": "Why this faction exists - their founding mission",
    "goals": "Their long-term ambitions and ultimate objectives",
    "current_agenda": "What they are actively pursuing RIGHT NOW",
    "methods": "How they typically operate (diplomacy, violence, subterfuge, commerce)",
    "secret": "DM ONLY: A hidden truth about the faction",
    "weakness": "How they could be undermined or defeated",
    "hierarchy": "Their leadership structure and chain of command",
    "key_members": ["Leader Name", "Lieutenant Name", "Notable Member"]
  },

  "soul": {
    "motto": "Their slogan, creed, or battle cry",
    "symbol": "Visual description of their emblem/crest/badge",
    "reputation": "How common people perceive them",
    "colors": ["Primary Color", "Secondary Color"],
    "culture": "Their values, traditions, and internal culture",
    "greeting": "How members acknowledge each other"
  },

  "mechanics": {
    "influence": "low|moderate|high|dominant",
    "wealth": "poor|moderate|wealthy|vast",
    "military": "none|militia|guards|army|elite_forces",
    "reach": "local|regional|national",
    "stability": "unstable|stable|thriving",
    "territory": ["Location Name 1", "Location Name 2"],
    "resources": ["Key Asset 1", "Key Asset 2"],
    "benefits": ["Benefit for joining 1", "Benefit 2", "Benefit 3"],
    "requirements": "What it takes to join or gain standing"
  },

  "facts": [
    { "content": "An appearance/visual fact about the faction", "category": "appearance", "visibility": "public" },
    { "content": "A piece of lore or history", "category": "lore", "visibility": "public" },
    { "content": "A rumor people tell about them", "category": "lore", "visibility": "public" },
    { "content": "A secret only the DM knows", "category": "secret", "visibility": "dm_only" }
  ]
}

## FACTION BRAIN GUIDELINES

### PURPOSE
Every faction needs a reason to exist. What brought them together?
- A guild forms around a shared trade or craft
- A military order forms to defend against a threat
- A cult forms around forbidden knowledge or a dark entity
- A political faction forms to advance an ideology

### GOALS
What do they ultimately want? Goals should be:
- Specific enough to drive plot
- Ambitious enough to require resources
- Potentially in conflict with players or other factions

### CURRENT AGENDA
What are they doing RIGHT NOW? This creates immediate hooks:
- Recruiting new members in the local tavern
- Investigating a rival faction's weakness
- Preparing for a major ritual or event
- Consolidating power after a recent victory

### METHODS
How do they typically achieve their goals?
- Diplomacy and negotiation
- Economic pressure and trade manipulation
- Military force or intimidation
- Subterfuge, blackmail, and assassination
- Religious conversion or indoctrination
- Legal manipulation and bureaucracy

### SECRET
Every faction has hidden depths:
- Their public face hides their true agenda
- Leadership is secretly controlled by another force
- They unknowingly serve a dark power
- Their founding myth is a lie
- A key member is a traitor

### KEY MEMBERS
List 3-5 names ONLY. No descriptions. These become NPC stubs:
- Good: ["Lord Varen Blackwood", "Guildmaster Thessa", "The Whisper"]
- Bad: ["Lord Varen Blackwood - the ruthless leader", "Guildmaster Thessa - a cunning merchant"]

## FACTION SOUL GUIDELINES

### MOTTO
A memorable phrase that encapsulates their identity:
- "Gold flows where blood runs cold" (Merchant guild)
- "In shadows we trust" (Thieves' guild)
- "The flame eternal" (Religious order)

### SYMBOL
Describe visually - this helps players recognize them:
- "A silver coin with a serpent coiled around it"
- "A black gauntlet clutching a broken crown"
- "An open eye surrounded by seven stars"

### REPUTATION
How do common people react when they see faction members?
- Trusted and respected
- Feared and avoided
- Mysterious and intriguing
- Scorned and ridiculed

### CULTURE
Internal values and traditions:
- Strict hierarchy vs. democratic decisions
- Secrecy vs. public presence
- Loyalty rituals or initiation rites
- How they treat outsiders vs. members

## FACTION MECHANICS GUIDELINES

### INFLUENCE
- Negligible: Unknown outside their immediate circle
- Low: Recognized locally, can call minor favors
- Moderate: Regional power, can influence local politics
- High: National influence, significant political sway
- Dominant: Shapes national policy, feared by rulers

### WEALTH
- Destitute: Barely surviving
- Poor: Modest resources, struggling
- Moderate: Comfortable, can fund operations
- Wealthy: Significant treasury, can hire armies
- Vast: Controls major economic sectors

### MILITARY
- None: No combat capability
- Militia: Untrained volunteers
- Guards: Trained defenders
- Army: Professional soldiers
- Elite Forces: Specialized warriors, knights, assassins

### TERRITORY
List 2-4 location names ONLY. No descriptions. These become Location stubs:
- Good: ["The Gilded Hall", "Blackwater Docks", "Fort Ironwatch"]
- Bad: ["The Gilded Hall - their headquarters", "Blackwater Docks - where they smuggle goods"]

### BENEFITS
What do players gain from association? Be specific and game-relevant:
- "Safe houses in any major city"
- "Discount on guild services (10% off)"
- "Access to rare spell components"
- "Letter of introduction to nobles"
`;

export const FACTION_TYPE_PROMPTS: Record<string, string> = {
  guild: `This is a PROFESSIONAL GUILD controlling a trade or craft.
Focus on:
- Economic monopoly or specialization
- Trade secrets and proprietary methods
- Member benefits (discounts, exclusive access, training)
- Journeyman/Master ranks and advancement
- Competition with rival guilds`,

  military: `This is a MILITARY ORGANIZATION.
Focus on:
- Chain of command and military structure
- Current deployments or standing orders
- Martial traditions and training regimens
- Veteran benefits and retirement
- Oaths of service and codes of honor`,

  religious: `This is a RELIGIOUS ORGANIZATION.
Focus on:
- Deity, philosophy, or divine mandate
- Sacred rituals and holy days
- Clergy hierarchy (priests, paladins, monks)
- Blessings and divine gifts for the faithful
- Heresy and how they deal with apostates`,

  criminal: `This is a CRIMINAL ORGANIZATION.
Focus on:
- Legitimate front business
- Actual illegal operations
- Code of silence and loyalty enforcement
- Underworld connections and territories
- How they "convince" people to cooperate`,

  political: `This is a POLITICAL FACTION.
Focus on:
- Core ideology or platform
- Key legislation or policies they champion
- Political allies and enemies
- Patronage system and rewards for supporters
- How they maintain power`,

  merchant: `This is a MERCHANT CONSORTIUM.
Focus on:
- Primary trade goods and routes
- Exclusive trading relationships
- Business partnerships and rivals
- Trade discounts and investment opportunities
- Fleet or caravan resources`,

  cult: `This is a SECRETIVE CULT.
Focus on:
- The forbidden truth they worship or pursue
- Recruitment methods (how they find new members)
- Hidden rituals (blood magic, summoning, etc.)
- Dark gifts for initiates
- What happens to those who try to leave`,

  noble_house: `This is a NOBLE HOUSE.
Focus on:
- Bloodline prestige and history
- Ancestral holdings and estates
- Court influence and political marriages
- House traditions and mottos
- Rivalries with other noble houses`,

  secret_society: `This is a SECRET SOCIETY.
Focus on:
- Hidden membership (even members may not know each other)
- Coded recognition signs and phrases
- True hidden purpose (known only to inner circle)
- Layers of initiation and knowledge
- How they maintain secrecy`,
};
