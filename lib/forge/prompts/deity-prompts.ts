import { DeityRank } from '@/types/deity';

export const deitySystemPrompt = `You are a divine mythologist creating gods for tabletop RPG campaigns.

Your deities should be:
- PLAYABLE: Include actionable content DMs can use at the table
- DISTINCT: Each god should feel unique, not generic fantasy deity #47
- CONNECTED: Reference how this deity relates to the world and other powers
- MYSTERIOUS: Gods should have secrets and hidden agendas
- EVOCATIVE: Use vivid imagery and sensory details

DIVINE SIGNALS are critical - these are sensory details DMs can describe at the table:
- Omens when the god is watching (candles flicker gold, shadows shift, smell of incense appears)
- Signs of favor (wounds close slightly, dice roll well, animals act friendly)
- Signs of anger (food spoils, flames turn cold, mirrors crack)

PRAYERS should be speakable - actual phrases players can say in character at the table.

TENETS should create moral dilemmas - not just "be good" but specific rules that might conflict with each other or with practical necessities. A follower should sometimes struggle with following all tenets.

BOONS and CURSES should be specific mechanical or narrative effects that can actually be applied in play.`;

export function buildDeityUserPrompt(params: {
  rank: DeityRank;
  domains: string[];
  alignment?: string;
  concept?: string;
  pantheon?: string;
  campaignContext?: string;
}): string {
  const { rank, domains, alignment, concept, pantheon, campaignContext } = params;

  const rankLabel = rank.replace(/_/g, ' ');
  let prompt = `Generate a ${rankLabel} with domains: ${domains.join(', ')}.`;

  if (alignment) {
    prompt += `\nAlignment: ${alignment}`;
  }

  if (concept) {
    prompt += `\nConcept/Theme: ${concept}`;
  }

  if (pantheon) {
    prompt += `\nPart of pantheon: ${pantheon}`;
  }

  if (campaignContext) {
    prompt += `\n\nCampaign Context:\n${campaignContext}`;
  }

  prompt += `

Return a JSON object with this EXACT structure:
{
  "name": "Deity name (evocative, not generic)",
  "rank": "${rank}",
  "soul": {
    "titles": ["The [Title]", "Second Title", "Third Title"],
    "portfolio": {
      "domains": ${JSON.stringify(domains)},
      "alignment": "${alignment || 'appropriate alignment'}",
      "symbol": "Vivid visual description of holy symbol",
      "favored_weapon": "Specific weapon name",
      "holy_day": "Name and when it occurs",
      "sacred_colors": ["Color1", "Color2"],
      "sacred_animal": "Animal associated with deity"
    },
    "manifestation": "How they appear to mortals - be specific and evocative (2-3 sentences)",
    "personality": "Divine temperament - how they act and feel",
    "voice": "How they communicate with mortals (dreams, whispers, signs, etc.)",
    "tenets": [
      "First commandment - specific, creates potential moral dilemmas",
      "Second commandment - may conflict with first in edge cases",
      "Third commandment - actionable rule for followers"
    ],
    "prayers": {
      "invocation": "Opening prayer phrase players can speak aloud",
      "blessing": "Blessing to give to others",
      "oath": "Oath sworn in this deity's name"
    },
    "worship": {
      "followers": "Who worships this deity and why",
      "clergy_title": "Title for priests (e.g., Dawnbringer, Soulkeeper)",
      "temple_style": "What temples and shrines look like",
      "rituals": ["Specific ritual 1", "Specific ritual 2"],
      "offerings": ["Specific offering 1", "Specific offering 2"],
      "taboos": ["Specific taboo 1", "Specific taboo 2"]
    }
  },
  "brain": {
    "true_nature": "What the god is REALLY like behind the public face (DM secret)",
    "divine_agenda": "What they're secretly working toward",
    "secrets": "Hidden truth about this deity that could shake followers",
    "divine_signals": {
      "distance": "distant" | "symbolic" | "interventionist",
      "omens": {
        "watching": ["Subtle sensory sign 1 (be specific)", "Subtle sensory sign 2"],
        "pleased": ["Positive sign 1 (observable)", "Positive sign 2"],
        "angry": ["Warning sign 1 (ominous)", "Warning sign 2"]
      },
      "boons": [
        { "trigger": "When a follower does X specific action", "effect": "Mechanical or narrative reward" },
        { "trigger": "Second trigger condition", "effect": "Second reward" }
      ],
      "curses": [
        { "trigger": "When a follower violates X tenet", "effect": "Specific punishment" },
        { "trigger": "Second violation type", "effect": "Second punishment" }
      ]
    },
    "conflicts": "Rivalries or tensions with other divine powers",
    "weaknesses": "How this deity can be opposed or their influence diminished",
    "hooks": [
      "Adventure hook 1 involving this deity",
      "Adventure hook 2",
      "Adventure hook 3"
    ]
  },
  "mechanics": {
    "cleric_domains": ["Domain1", "Domain2"],
    "channel_divinity": "Unique channel divinity ability description",
    "sacred_spells": ["Spell1", "Spell2", "Spell3"],
    "suggested_classes": ["Cleric", "Paladin", "etc"]
  },
  "discoveries": [
    {
      "name": "Related entity name",
      "entity_type": "faction" | "npc" | "location" | "item",
      "brief": "Brief description",
      "connection": "How it connects to this deity"
    },
    {
      "name": "Another related entity",
      "entity_type": "npc",
      "brief": "Brief description",
      "connection": "Connection to deity"
    }
  ]
}

Generate evocative, playable content. Divine signals should be sensory details a DM can describe. Prayers should be speakable. Tenets should create interesting moral choices.`;

  return prompt;
}

export const DEITY_DOMAINS = [
  'Light', 'Life', 'Death', 'War', 'Nature', 'Tempest',
  'Knowledge', 'Trickery', 'Forge', 'Grave', 'Order', 'Peace',
  'Twilight', 'Arcana', 'Blood', 'Madness', 'Time', 'Luck',
];

export const DEITY_ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];
