import { EventSubType } from '@/types/event';

interface LorePromptParams {
  subType: EventSubType;
  concept: string;
  dateDisplay: string;
  era?: string;
  linkedEntities?: {
    locations?: string[];
    npcs?: string[];
    factions?: string[];
    events?: string[];
  };
  codexContext: string;
}

export function buildLoreSystemPrompt(): string {
  return `You are a master worldbuilder creating rich historical lore for a tabletop RPG campaign.

Your task is to generate a historical event with multiple layers of knowledge:
- What common people believe (may be incomplete or wrong)
- What scholars know (more accurate but still limited)
- What folk tales say (exaggerated, mythologized)
- What ACTUALLY happened (the DM's truth)

You must also create "Lore Drops" - specific, actionable moments where this history can enter play.

CRITICAL RULES:
1. Common knowledge should feel believable but may be incomplete
2. Folklore should be colorful and slightly exaggerated
3. The TRUE history should have secrets that make the event more interesting
4. Lore Drops must be specific and immediately usable in a session
5. Consequences should affect the PRESENT day
6. Do NOT reference real-world history or copyrighted settings
7. If the campaign is homebrew, do NOT use named Forgotten Realms/Greyhawk events

LORE DROP GUIDELINES:
- Each lore drop needs a TRIGGER (where/when this info can be learned)
- Each needs a DELIVERY method (skill check, freely given, overheard, etc.)
- The TEXT should be 1-2 sentences of actual, usable information
- Include DCs for skill checks (History, Arcana, Religion, etc.)
- Vary the reveal_level: public (easy to learn), partial (some effort), dm_truth (hard to learn)`;
}

export function buildLoreUserPrompt(params: LorePromptParams): string {
  const { subType, concept, dateDisplay, era, linkedEntities, codexContext } = params;

  let linkedContext = '';
  if (linkedEntities) {
    if (linkedEntities.locations?.length) {
      linkedContext += `\nLocations involved: ${linkedEntities.locations.join(', ')}`;
    }
    if (linkedEntities.npcs?.length) {
      linkedContext += `\nPeople involved: ${linkedEntities.npcs.join(', ')}`;
    }
    if (linkedEntities.factions?.length) {
      linkedContext += `\nFactions involved: ${linkedEntities.factions.join(', ')}`;
    }
    if (linkedEntities.events?.length) {
      linkedContext += `\nRelated events: ${linkedEntities.events.join(', ')}`;
    }
  }

  return `CAMPAIGN CONTEXT:
${codexContext}

EVENT DETAILS:
Type: ${subType.replace('_', ' ')}
When: ${dateDisplay}${era ? ` (${era})` : ''}
Concept: ${concept}
${linkedContext}

Generate this historical event with the following JSON structure:

{
  "name": "Event name (evocative title)",
  "soul": {
    "common_knowledge": "2-3 sentences. What everyone knows. May be simplified or slightly wrong.",
    "scholarly_account": "3-4 sentences. What educated people or books say. More detailed but still incomplete.",
    "folklore": "2-3 sentences. How common people remember it. Exaggerated, mythologized, possibly superstitious.",
    "propaganda": "1-2 sentences (optional). What powerful groups want people to believe. May contradict truth."
  },
  "brain": {
    "true_history": "3-4 sentences. What ACTUALLY happened. Include secrets and hidden actors.",
    "hidden_causes": "2-3 sentences. Secret reasons and motivations behind the event.",
    "consequences": "2-3 sentences. How this event affects the present day.",
    "secrets": "1-2 sentences. Things that even most scholars don't know.",
    "reveal_triggers": ["How truth becomes known #1", "How truth becomes known #2", "How truth becomes known #3"],
    "hooks": ["Quest hook #1", "Quest hook #2", "Quest hook #3", "Quest hook #4"]
  },
  "mechanics": {
    "duration": "How long the event lasted (e.g., 'Three days', 'A decade', 'Instantaneous')",
    "affected_regions": ["Region 1", "Region 2"],
    "current_evidence": "2-3 sentences. Physical proof that exists today. What players might find.",
    "lore_drops": [
      {
        "trigger": "Location or situation (e.g., 'At the Ruins of X' or 'Talking to an old veteran')",
        "delivery": "How revealed (e.g., 'History DC 14' or 'Freely given' or 'Overheard in tavern')",
        "dc": 14,
        "text": "The actual information revealed. 1-2 sentences, immediately usable.",
        "reveal_level": "public"
      },
      {
        "trigger": "Another trigger",
        "delivery": "Arcana DC 16",
        "dc": 16,
        "text": "More detailed or secret information.",
        "reveal_level": "partial"
      },
      {
        "trigger": "Rare situation",
        "delivery": "Special circumstance",
        "text": "Secret that reveals DM truth.",
        "reveal_level": "dm_truth"
      }
    ]
  },
  "discoveries": [
    {
      "name": "Name of discovered entity",
      "entity_type": "npc | location | faction | item | event | creature | quest",
      "brief": "1-2 sentence description of this entity",
      "connection": "How this entity connects to the event being generated"
    }
  ]
}

IMPORTANT:
- Generate exactly 3-5 lore drops with varying reveal levels
- At least one lore drop should be "public" (easy to learn)
- At least one should reveal "dm_truth" (hard to learn)
- Lore drops should feel like moments a DM can actually use in play
- The true history should make the common knowledge make sense while adding depth
- Generate 3-5 discoveries - related entities (NPCs, locations, factions, items, or other events) that connect to this lore
- Discoveries should be worldbuilding hooks that help expand the campaign
- Each discovery must have a clear connection to the event being generated`;
}

// Sub-type specific guidance
export const EVENT_TYPE_PROMPTS: Record<EventSubType, string> = {
  historical_event: `This is a major historical event. Focus on:
- Long-term impact on the world
- How different groups remember it differently
- Physical evidence that remains today`,

  recent_event: `This is recent news. Focus on:
- Immediate consequences
- Different perspectives on what happened
- Rumors vs. facts`,

  legend: `This is a legend or myth. Focus on:
- Supernatural or exaggerated elements in folklore
- Kernel of truth hidden in the story
- How it's used to teach lessons or explain phenomena`,

  prophecy: `This is a prophecy or prediction. Focus on:
- Cryptic or symbolic language in the public version
- Multiple possible interpretations
- What will actually happen (DM truth)`,

  rumor: `This is an unverified rumor. Focus on:
- How it spreads and changes
- What people believe vs. reality
- Who benefits from the rumor`,

  war: `This is a military conflict. Focus on:
- Official vs. real causes
- Key battles or turning points
- Aftermath and lingering resentments`,

  catastrophe: `This is a disaster or calamity. Focus on:
- The immediate devastation
- How survivors remember it
- Whether it was natural or caused`,

  founding: `This is the founding of something important. Focus on:
- The official founding story vs. real events
- Who the founders really were
- What was there before`,

  death: `This is a significant death. Focus on:
- How the death is publicly remembered
- The real circumstances
- Lasting impact of the loss`,

  treaty: `This is a treaty or agreement. Focus on:
- Public terms vs. secret clauses
- Who really benefited
- Current status of the agreement`,

  discovery: `This is a significant discovery. Focus on:
- What was officially found vs. what was hidden
- Who made the discovery and why
- What remains undiscovered`,

  miracle: `This is a miraculous event. Focus on:
- How believers interpret it
- Skeptical explanations
- The actual divine/magical truth`,
};
