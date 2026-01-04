import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const openai = getOpenAIClient();

    // Get session with campaign info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, campaign:campaigns(id, name)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const campaignId = session.campaign?.id || session.campaign_id;

    // Get all events for this session
    const { data: events } = await supabase
      .from('session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get all entities in campaign for fuzzy matching
    const { data: entities } = await supabase
      .from('entities')
      .select('id, name, entity_type, status, summary')
      .eq('campaign_id', campaignId);

    // Fetch player notes from this session period for AI context
    const { data: playerNotes } = await supabase
      .from('player_journal_entries')
      .select('title, content, created_at')
      .eq('campaign_id', campaignId)
      .eq('entry_type', 'personal')
      .gte('created_at', session.started_at || session.created_at)
      .order('created_at', { ascending: true });

    // Build player notes context
    let playerNotesContext = '';
    if (playerNotes && playerNotes.length > 0) {
      playerNotesContext = `

## Player Notes from This Session
The players took the following notes during play. Use these to understand what THEY found important:

${playerNotes.map(note => `- "${note.title}": ${note.content || '(no content)'}`).join('\n')}

Consider highlighting moments the players specifically noted, as these were memorable to them.
`;
    }

    // Build entity name map for fuzzy matching
    const entityMap = new Map<string, any>();
    (entities || []).forEach(e => {
      entityMap.set(e.name.toLowerCase(), e);
      // Also map partial names (first name)
      const firstName = e.name.split(' ')[0].toLowerCase();
      if (!entityMap.has(firstName)) {
        entityMap.set(firstName, e);
      }
    });

    // Build context for AI
    const eventSummary = (events || []).map(e => {
      const timestamp = new Date(e.created_at).toLocaleTimeString();
      switch (e.event_type) {
        case 'combat_start':
          return `[${timestamp}] COMBAT STARTED: ${e.description || 'Initiative rolled'}`;
        case 'combat_end':
          return `[${timestamp}] COMBAT ENDED: ${e.description || 'Encounter resolved'}`;
        case 'damage':
          return `[${timestamp}] DAMAGE: ${e.title} - ${e.description}`;
        case 'death':
          return `[${timestamp}] DEATH: ${e.title} died - ${e.description}`;
        case 'dice_roll':
          return `[${timestamp}] ROLL: ${e.title} - ${e.description}`;
        case 'note':
          return `[${timestamp}] NOTE: ${e.description}`;
        case 'npc_interaction':
          return `[${timestamp}] NPC: ${e.title} - ${e.description}`;
        case 'location_change':
          return `[${timestamp}] LOCATION: Party moved to ${e.title}`;
        case 'quest_update':
          return `[${timestamp}] QUEST: ${e.description}`;
        case 'loot':
          return `[${timestamp}] LOOT: ${e.description}`;
        case 'secret_revealed':
          return `[${timestamp}] SECRET: ${e.description}`;
        default:
          return `[${timestamp}] ${e.event_type?.toUpperCase()}: ${e.description || e.title || ''}`;
      }
    }).filter(Boolean).join('\n');

    // Build entity list for context
    const entityList = (entities || [])
      .map(e => `- ${e.name} (${e.entity_type}, status: ${e.status || 'active'})`)
      .join('\n');

    // Generate AI Analysis
    const prompt = `You are the Campaign Database Manager for a D&D campaign.
Analyze the session log and identify what changed in the world.

Campaign: ${session.campaign?.name || 'Unknown'}
Session: ${session.name}

KNOWN ENTITIES IN THIS CAMPAIGN:
${entityList || 'No entities loaded'}

SESSION LOG:
${eventSummary || 'No events recorded'}
${playerNotesContext}
PREP NOTES:
${session.prep_content ? JSON.stringify(session.prep_content).substring(0, 1500) : 'None'}

Analyze the session and return a JSON object with:

{
  "summary": "A 2-3 paragraph narrative recap written in past tense, like a chronicle entry. Make it engaging and capture the drama of the session.",

  "highlights": [
    "Key moment 1 - be specific about what happened",
    "Key moment 2",
    "Key moment 3"
  ],

  "updates": [
    {
      "type": "status",
      "entityName": "Thalor",
      "oldValue": "alive",
      "newValue": "dead",
      "reason": "Killed by the dragon's fire breath in round 3"
    },
    {
      "type": "location",
      "entityName": "Party",
      "oldValue": "Waterdeep",
      "newValue": "The Underdark",
      "reason": "Descended through the well after defeating the guardian"
    },
    {
      "type": "relationship",
      "entityName": "Lord Blackwood",
      "targetName": "Party",
      "oldValue": "neutral",
      "newValue": "hostile",
      "reason": "Discovered the party stole the crown from his vault"
    },
    {
      "type": "fact",
      "entityName": "Mira",
      "value": "Knows the location of the Lost Temple of Pelor",
      "reason": "Successfully deciphered the ancient map during the skill challenge"
    },
    {
      "type": "item",
      "entityName": "Party",
      "action": "acquired",
      "itemName": "Dragon Scale Shield +2",
      "reason": "Looted from the dragon's hoard after the battle"
    },
    {
      "type": "quest",
      "questName": "Slay the Dragon of Thornwood",
      "oldValue": "active",
      "newValue": "completed",
      "reason": "Dragon defeated in epic combat"
    }
  ],

  "openThreads": [
    "The dragon's mate Scorrath is still alive and will seek revenge",
    "Lord Blackwood now knows the party's identities"
  ],

  "npcsEncountered": ["Sage Varis", "Captain Helena", "The Innkeeper"],
  "locationsVisited": ["The Thornwood Forest", "Dragon's Lair", "Village of Millbrook"],

  "suggestedXp": 500,
  "xpReason": "Defeated CR 8 Young Red Dragon, completed major quest, excellent problem-solving",

  "nextSessionHooks": [
    "Scorrath the dragon's mate will attack Millbrook seeking vengeance",
    "Lord Blackwood dispatches assassins to recover his crown",
    "The Lost Temple location could lead to powerful artifacts"
  ]
}

IMPORTANT RULES FOR UPDATES:
- Only suggest updates for things that CLEARLY happened in the session log
- Use exact entity names from the KNOWN ENTITIES list when possible
- If an NPC or creature died in combat, suggest a status change to "dead"
- If the party traveled to a new location, suggest a location update
- If relationships changed (made enemies, gained allies), note it
- If significant loot was acquired, list each notable item
- If a quest was completed or updated, include that
- Be conservative - only suggest changes you're confident about from the log
- Make the summary engaging and dramatic, not dry`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Campaign Database Manager. Analyze D&D session logs and return structured JSON with narrative summaries and database update suggestions. Be specific and actionable.'
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });
    }

    // Resolve entity names to IDs for database updates
    const resolvedUpdates = (analysis.updates || []).map((update: any, index: number) => {
      const resolved: any = {
        ...update,
        id: `update-${index}`,
        resolved: false,
        entityId: null,
        targetId: null,
      };

      // Try to match entity name to ID
      if (update.entityName && update.entityName.toLowerCase() !== 'party') {
        const match = entityMap.get(update.entityName.toLowerCase());
        if (match) {
          resolved.entityId = match.id;
          resolved.entityType = match.entity_type;
          resolved.resolved = true;
        }
      }

      // "Party" updates are always considered resolved (handled specially)
      if (update.entityName?.toLowerCase() === 'party') {
        resolved.resolved = true;
        resolved.isPartyUpdate = true;
      }

      // For relationship updates, also resolve target
      if (update.targetName && update.targetName.toLowerCase() !== 'party') {
        const targetMatch = entityMap.get(update.targetName.toLowerCase());
        if (targetMatch) {
          resolved.targetId = targetMatch.id;
        }
      }

      return resolved;
    });

    // Build final review object
    const review = {
      summary: analysis.summary,
      highlights: analysis.highlights || [],
      updates: resolvedUpdates,
      openThreads: analysis.openThreads || [],
      npcsEncountered: analysis.npcsEncountered || [],
      locationsVisited: analysis.locationsVisited || [],
      suggestedXp: analysis.suggestedXp || 0,
      xpReason: analysis.xpReason || '',
      nextSessionHooks: analysis.nextSessionHooks || [],
      generatedAt: new Date().toISOString(),
    };

    // Save review to session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        review: review,
        ai_summary: review.summary,
        pending_updates: resolvedUpdates,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to save review:', updateError);
    }

    return NextResponse.json(review);

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
