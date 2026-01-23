import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RelationshipData {
  id: string;
  relationship_type: string;
  description?: string;
  surface_description?: string;
  intensity?: string;
  source_entity?: { id: string; name: string; entity_type: string; summary?: string; brain?: Record<string, unknown> } | null;
  target_entity?: { id: string; name: string; entity_type: string; summary?: string; brain?: Record<string, unknown> } | null;
}

interface EntityData {
  id: string;
  name: string;
  entity_type: string;
  summary?: string;
  brain?: {
    motivation?: string;
    goals?: string;
  };
  mechanics?: Record<string, unknown>;
  forge_status?: string;
}

interface CampaignData {
  id: string;
  name: string;
}

interface LocationNpc {
  id: string;
  name: string;
  summary?: string;
  brain?: { motivation?: string; goals?: string };
  locationRelation: string;
}

interface FactionData {
  id: string;
  name: string;
  summary?: string;
  connection: string;
}

interface ItemData {
  id: string;
  name: string;
  summary?: string;
  connection: string;
  description?: string;
}

interface PlayerConnection {
  playerName: string;
  connectedTo: string;
  relationship: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, objectiveDescription, questId, campaignId } = body;

    if (!objective || !campaignId) {
      return NextResponse.json(
        { error: 'Objective and campaignId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // =========================================
    // STEP 1: Gather Campaign Context
    // =========================================

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .single() as { data: CampaignData | null; error: unknown };

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
    }
    console.log('Campaign:', campaign?.name);

    // Get the quest details if we have questId
    let questContext = '';
    if (questId) {
      const { data: quest } = await supabase
        .from('entities')
        .select('*')
        .eq('id', questId)
        .single();

      if (quest) {
        questContext = `
Quest: "${quest.name}"
Summary: ${quest.summary || 'No summary'}
Current Status: ${quest.status || 'active'}
        `;
      }
    }

    // =========================================
    // STEP 2: Fetch ALL Entities (not just a few types)
    // =========================================

    const { data: allCampaignEntities } = await supabase
      .from('entities')
      .select('id, name, entity_type, sub_type, summary, brain, mechanics, forge_status')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null) as { data: EntityData[] | null; error: unknown };

    // Group entities by type
    const entityGroups = {
      npcs: allCampaignEntities?.filter(e => e.entity_type === 'npc') || [],
      locations: allCampaignEntities?.filter(e => e.entity_type === 'location') || [],
      factions: allCampaignEntities?.filter(e => e.entity_type === 'faction') || [],
      items: allCampaignEntities?.filter(e => e.entity_type === 'item') || [],
      encounters: allCampaignEntities?.filter(e => e.entity_type === 'encounter') || [],
      creatures: allCampaignEntities?.filter(e => e.entity_type === 'creature') || [],
      events: allCampaignEntities?.filter(e => e.entity_type === 'event') || [],
      quests: allCampaignEntities?.filter(e => e.entity_type === 'quest') || [],
    };

    console.log('=== ENTITY COUNTS BY TYPE ===');
    console.log('NPCs:', entityGroups.npcs.length);
    console.log('Locations:', entityGroups.locations.length);
    console.log('Factions:', entityGroups.factions.length);
    console.log('Items:', entityGroups.items.length);
    console.log('Encounters:', entityGroups.encounters.length);
    console.log('Creatures:', entityGroups.creatures.length);
    console.log('Events:', entityGroups.events.length);
    console.log('Quests:', entityGroups.quests.length);

    // =========================================
    // STEP 3: Extract Keywords from Objective
    // =========================================

    const stopWords = ['the', 'a', 'an', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'of', 'with', 'is', 'are', 'be', 'this', 'that', 'their', 'them', 'they'];
    const objectiveKeywords = `${objective} ${objectiveDescription || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    console.log('=== KEYWORD EXTRACTION ===');
    console.log('Objective:', objective);
    console.log('Keywords:', objectiveKeywords);

    // =========================================
    // STEP 4: Find Entities by Name Match AND Keyword Match
    // =========================================

    const searchText = `${objective} ${objectiveDescription || ''}`.toLowerCase();

    // Name-based matching (existing logic)
    const mentionedEntities: EntityData[] = allCampaignEntities?.filter(entity => {
      const entityNameLower = entity.name.toLowerCase();
      const entityNameParts = entityNameLower.split(' ');

      if (searchText.includes(entityNameLower)) {
        console.log(`MATCH (full name): "${entity.name}" found in objective`);
        return true;
      }

      for (let i = 0; i < entityNameParts.length - 1; i++) {
        const twoWordCombo = `${entityNameParts[i]} ${entityNameParts[i + 1]}`;
        if (twoWordCombo.length > 5 && searchText.includes(twoWordCombo)) {
          console.log(`MATCH (partial): "${twoWordCombo}" from "${entity.name}" found in objective`);
          return true;
        }
      }

      if (entityNameParts.length >= 2) {
        const firstTwoWords = entityNameParts.slice(0, 2).join(' ');
        if (firstTwoWords.length > 5 && searchText.includes(firstTwoWords)) {
          console.log(`MATCH (first words): "${firstTwoWords}" from "${entity.name}" found in objective`);
          return true;
        }
      }

      return false;
    }) || [];

    console.log('=== NAME-MATCHED ENTITIES ===');
    console.log('Matched:', mentionedEntities.map(e => e.name));
    const mentionedEntityIds = mentionedEntities.map(e => e.id);

    // =========================================
    // STEP 5: Keyword-based Location Matching
    // =========================================

    const relevantLocations = entityGroups.locations.filter(loc => {
      const locText = `${loc.name} ${loc.summary || ''} ${loc.sub_type || ''}`.toLowerCase();
      return objectiveKeywords.some(kw => locText.includes(kw));
    });

    console.log('=== KEYWORD-MATCHED LOCATIONS ===');
    console.log('Relevant locations:', relevantLocations.map(l => l.name));

    // =========================================
    // STEP 6: Keyword-based Encounter Matching
    // =========================================

    const relevantEncounters = entityGroups.encounters.filter(enc => {
      const encText = `${enc.name} ${enc.summary || ''}`.toLowerCase();
      return objectiveKeywords.some(kw => encText.includes(kw));
    });

    console.log('=== KEYWORD-MATCHED ENCOUNTERS ===');
    console.log('Relevant encounters:', relevantEncounters.map(e => e.name));

    // =========================================
    // STEP 7: Fetch ALL Relationships
    // =========================================

    const { data: allRelationships, error: relError } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        description,
        surface_description,
        intensity,
        source_entity:source_id(id, name, entity_type, summary, brain),
        target_entity:target_id(id, name, entity_type, summary, brain)
      `)
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .limit(200) as { data: RelationshipData[] | null; error: unknown };

    if (relError) {
      console.error('Relationship query error:', relError);
    }

    console.log('=== ALL RELATIONSHIPS ===');
    console.log('Total relationships:', allRelationships?.length || 0);

    // Filter to relationships involving matched entities OR relevant locations
    const relevantLocationIds = relevantLocations.map(l => l.id);
    const allRelevantIds = [...new Set([...mentionedEntityIds, ...relevantLocationIds])];

    let relationships: RelationshipData[] = [];
    if (allRelevantIds.length > 0) {
      relationships = allRelationships?.filter(r =>
        allRelevantIds.includes(r.source_entity?.id || '') ||
        allRelevantIds.includes(r.target_entity?.id || '')
      ) || [];
    }

    console.log('Relevant relationships:', relationships.length);

    // =========================================
    // STEP 8: Find NPCs at Relevant Locations
    // =========================================

    // Combine name-matched locations with keyword-matched locations
    const mentionedLocations = mentionedEntities.filter(e => e.entity_type === 'location');
    const allRelevantLocations = [...new Map([...mentionedLocations, ...relevantLocations].map(l => [l.id, l])).values()];

    console.log('=== ALL RELEVANT LOCATIONS ===');
    console.log('Combined locations:', allRelevantLocations.map(l => l.name));

    let locationNpcs: LocationNpc[] = [];
    if (allRelevantLocations.length > 0) {
      const locationIds = allRelevantLocations.map(l => l.id);

      // Find NPCs at these locations from the fetched relationships
      const locationRelTypes = [
        'inhabited_by', 'located_in', 'lives_in', 'resides_in',
        'works_at', 'owns', 'operates', 'frequents', 'patrols',
        'contains', 'guards', 'runs', 'lives_at', 'stays_at'
      ];

      allRelationships?.forEach(rel => {
        const isLocationTarget = locationIds.includes(rel.target_entity?.id || '');
        const isLocationSource = locationIds.includes(rel.source_entity?.id || '');

        if (locationRelTypes.includes(rel.relationship_type)) {
          if (isLocationTarget && rel.source_entity?.entity_type === 'npc') {
            locationNpcs.push({
              id: rel.source_entity.id,
              name: rel.source_entity.name,
              summary: rel.source_entity.summary,
              brain: rel.source_entity.brain as LocationNpc['brain'],
              locationRelation: `${rel.relationship_type} ${rel.target_entity?.name}`
            });
          }
          if (isLocationSource && rel.target_entity?.entity_type === 'npc') {
            locationNpcs.push({
              id: rel.target_entity.id,
              name: rel.target_entity.name,
              summary: rel.target_entity.summary,
              brain: rel.target_entity.brain as LocationNpc['brain'],
              locationRelation: `at ${rel.source_entity?.name}`
            });
          }
        }
      });

      // Deduplicate by ID
      locationNpcs = Array.from(new Map(locationNpcs.map(n => [n.id, n])).values());

      console.log('=== NPCs AT RELEVANT LOCATIONS ===');
      locationNpcs.forEach(npc => {
        console.log(`  ${npc.name} - ${npc.locationRelation}`);
      });
    }

    // =========================================
    // STEP 9: Get ALL Factions (always include)
    // =========================================

    // Find factions specifically involved with matched entities
    let involvedFactions: FactionData[] = [];
    const factionRelTypes = [
      'member_of', 'belongs_to', 'leads', 'serves',
      'allied_with', 'enemy_of', 'works_for', 'controls'
    ];

    if (allRelevantIds.length > 0) {
      allRelationships?.forEach(rel => {
        const involvesRelevant = allRelevantIds.includes(rel.source_entity?.id || '') ||
                                 allRelevantIds.includes(rel.target_entity?.id || '');

        if (involvesRelevant && factionRelTypes.includes(rel.relationship_type)) {
          if (rel.source_entity?.entity_type === 'faction') {
            involvedFactions.push({
              id: rel.source_entity.id,
              name: rel.source_entity.name,
              summary: rel.source_entity.summary,
              connection: `${rel.target_entity?.name} ${rel.relationship_type}`
            });
          }
          if (rel.target_entity?.entity_type === 'faction') {
            involvedFactions.push({
              id: rel.target_entity.id,
              name: rel.target_entity.name,
              summary: rel.target_entity.summary,
              connection: `${rel.source_entity?.name} ${rel.relationship_type}`
            });
          }
        }
      });

      involvedFactions = Array.from(new Map(involvedFactions.map(f => [f.id, f])).values());
    }

    console.log('=== INVOLVED FACTIONS ===');
    involvedFactions.forEach(f => console.log(`  ${f.name} - ${f.connection}`));

    // =========================================
    // STEP 10: Get Items (from relationships + keyword match)
    // =========================================

    let relevantItems: ItemData[] = [];
    const itemRelTypes = [
      'owns', 'carries', 'guards', 'seeks', 'created',
      'possesses', 'hides', 'protects', 'wields'
    ];

    // Items from relationships
    if (allRelevantIds.length > 0) {
      allRelationships?.forEach(rel => {
        const involvesRelevant = allRelevantIds.includes(rel.source_entity?.id || '') ||
                                 allRelevantIds.includes(rel.target_entity?.id || '');

        if (involvesRelevant && itemRelTypes.includes(rel.relationship_type)) {
          if (rel.source_entity?.entity_type === 'item') {
            relevantItems.push({
              id: rel.source_entity.id,
              name: rel.source_entity.name,
              summary: rel.source_entity.summary,
              connection: `${rel.relationship_type} by ${rel.target_entity?.name}`,
              description: rel.description
            });
          }
          if (rel.target_entity?.entity_type === 'item') {
            relevantItems.push({
              id: rel.target_entity.id,
              name: rel.target_entity.name,
              summary: rel.target_entity.summary,
              connection: `${rel.source_entity?.name} ${rel.relationship_type}`,
              description: rel.description
            });
          }
        }
      });
    }

    // Also find items by keyword match
    const keywordMatchedItems = entityGroups.items.filter(item => {
      const itemText = `${item.name} ${item.summary || ''}`.toLowerCase();
      return objectiveKeywords.some(kw => itemText.includes(kw));
    });

    keywordMatchedItems.forEach(item => {
      if (!relevantItems.find(i => i.id === item.id)) {
        relevantItems.push({
          id: item.id,
          name: item.name,
          summary: item.summary,
          connection: 'keyword match',
          description: undefined
        });
      }
    });

    relevantItems = Array.from(new Map(relevantItems.map(i => [i.id, i])).values());

    console.log('=== RELEVANT ITEMS ===');
    relevantItems.forEach(i => console.log(`  ${i.name} - ${i.connection}`));

    // =========================================
    // STEP 11: Combine All Relevant Encounters
    // =========================================

    // Encounters from location relationships
    let locationEncounters: EntityData[] = [];
    if (allRelevantLocations.length > 0) {
      const locationIds = allRelevantLocations.map(l => l.id);

      allRelationships?.forEach(rel => {
        if (rel.relationship_type === 'located_at' || rel.relationship_type === 'takes_place_at') {
          if (locationIds.includes(rel.target_entity?.id || '') && rel.source_entity?.entity_type === 'encounter') {
            locationEncounters.push(rel.source_entity as unknown as EntityData);
          }
        }
      });
    }

    // Combine with keyword-matched encounters
    const allRelevantEncounters = [...new Map([...locationEncounters, ...relevantEncounters].map(e => [e.id, e])).values()];

    console.log('=== ALL RELEVANT ENCOUNTERS ===');
    allRelevantEncounters.forEach(e => console.log(`  ${e.name}: ${e.summary}`));

    // =========================================
    // STEP 12: Get Player Characters & Connections
    // =========================================

    // Players are already in entityGroups
    const playerCharacters = allCampaignEntities?.filter(e => e.entity_type === 'player') || [];

    let playerConnections: PlayerConnection[] = [];
    if (playerCharacters.length > 0 && allRelevantIds.length > 0) {
      const playerIds = playerCharacters.map(p => p.id);

      // Use the already-fetched relationships
      allRelationships?.forEach(rel => {
        const isPlayerSource = playerIds.includes(rel.source_entity?.id || '');
        const isPlayerTarget = playerIds.includes(rel.target_entity?.id || '');

        if (isPlayerSource || isPlayerTarget) {
          const player = isPlayerSource ? rel.source_entity : rel.target_entity;
          const other = isPlayerSource ? rel.target_entity : rel.source_entity;

          if (allRelevantIds.includes(other?.id || '')) {
            playerConnections.push({
              playerName: player?.name || 'Unknown',
              connectedTo: other?.name || 'Unknown',
              relationship: rel.relationship_type,
              description: rel.description
            });
          }
        }
      });

      console.log('=== PLAYER CONNECTIONS ===');
      playerConnections.forEach(pc => {
        console.log(`  ${pc.playerName} --[${pc.relationship}]--> ${pc.connectedTo}`);
      });
    }

    // =========================================
    // STEP 13: Prepare Available NPCs (from entityGroups)
    // =========================================

    // Include all NPCs that have useful info (not just stubs without content)
    const usableNpcs = entityGroups.npcs.filter(npc =>
      npc.forge_status !== 'stub' || npc.summary || npc.brain?.motivation
    ).slice(0, 50);

    // =========================================
    // STEP 10: Build Enhanced System Prompt
    // =========================================

    // Relationship context
    let relationshipContext = '';
    if (relationships.length > 0) {
      relationshipContext = `

🔥 EXISTING RELATIONSHIPS - USE THESE FOR DRAMA! 🔥
${relationships.map(r => {
  const source = r.source_entity?.name || 'Unknown';
  const target = r.target_entity?.name || 'Unknown';
  const type = r.relationship_type?.toUpperCase() || 'CONNECTED TO';
  const desc = r.description || r.surface_description || '';
  const intensity = r.intensity ? ` [${r.intensity} intensity]` : '';
  return `• ${source} is ${type} ${target}${intensity}
  ${desc ? `  → "${desc}"` : ''}`;
}).join('\n')}

⚠️ CRITICAL: You MUST incorporate at least one of these relationships into your beats!
If there's a RIVAL or ENEMY, they should interfere or complicate the objective.
`;
    }

    // Location NPCs context
    let locationNpcContext = '';
    if (locationNpcs.length > 0) {
      const locationNames = allRelevantLocations.map(l => l.name).join(', ');
      locationNpcContext = `

📍 NPCs AT RELEVANT LOCATIONS (${locationNames}):
${locationNpcs.slice(0, 12).map(npc => {
  const motivation = npc.brain?.motivation || npc.brain?.goals || '';
  return `• ${npc.name} (${npc.locationRelation})
  ${npc.summary || 'No description'}${motivation ? `\n  💭 Motivation: ${motivation}` : ''}`;
}).join('\n')}

Use these NPCs for information gathering, social encounters, or complications!
`;
    }

    // Relevant locations context (keyword-matched)
    let relevantLocationContext = '';
    if (allRelevantLocations.length > 0) {
      relevantLocationContext = `

📍 RELEVANT LOCATIONS FOR THIS OBJECTIVE:
${allRelevantLocations.slice(0, 8).map(loc => `• ${loc.name}: ${loc.summary || loc.sub_type || 'No description'}`).join('\n')}

Set scenes in these locations when appropriate!
`;
    }

    // Faction context - show involved factions AND general factions
    let factionContext = '';
    if (involvedFactions.length > 0) {
      factionContext = `

🏴 FACTIONS DIRECTLY INVOLVED:
${involvedFactions.map(f => `• ${f.name}: ${f.summary || 'No description'}
  Connection: ${f.connection}`).join('\n')}

Consider faction politics and how they might help or hinder the party.
`;
    }

    // Always show available factions for general context
    let allFactionsContext = '';
    if (entityGroups.factions.length > 0) {
      const uninvolvedFactions = entityGroups.factions.filter(f =>
        !involvedFactions.find(inv => inv.id === f.id)
      );
      if (uninvolvedFactions.length > 0) {
        allFactionsContext = `

🏛️ OTHER FACTIONS IN CAMPAIGN:
${uninvolvedFactions.slice(0, 6).map(f => `• ${f.name}: ${f.summary || 'No description'}`).join('\n')}
`;
      }
    }

    // Items context
    let itemContext = '';
    if (relevantItems.length > 0) {
      itemContext = `

🎒 RELEVANT ITEMS/ARTIFACTS:
${relevantItems.map(i => `• ${i.name}: ${i.summary || 'No description'}
  ${i.connection}${i.description ? ` - "${i.description}"` : ''}`).join('\n')}

These items could be quest rewards, MacGuffins, or complications.
`;
    }

    // Existing encounters context - use combined encounters
    let encounterContext = '';
    if (allRelevantEncounters.length > 0) {
      encounterContext = `

⚔️ RELEVANT PRE-BUILT ENCOUNTERS:
${allRelevantEncounters.slice(0, 6).map(e => `• ${e.name}: ${e.summary || 'No description'}`).join('\n')}

You may reference these existing encounters instead of creating new ones!
`;
    }

    // Creatures context
    let creaturesContext = '';
    if (entityGroups.creatures.length > 0) {
      creaturesContext = `

🐉 CREATURES IN CAMPAIGN:
${entityGroups.creatures.slice(0, 10).map(c => `• ${c.name}: ${c.summary || c.sub_type || 'No description'}`).join('\n')}
`;
    }

    // Player connections context
    let playerContext = '';
    if (playerConnections.length > 0) {
      playerContext = `

👥 PARTY MEMBER CONNECTIONS:
${playerConnections.map(pc => `• ${pc.playerName} is ${pc.relationship} ${pc.connectedTo}${pc.description ? `: "${pc.description}"` : ''}`).join('\n')}

⭐ IMPORTANT: Create moments that let these players shine through their connections!
`;
    } else if (playerCharacters && playerCharacters.length > 0) {
      playerContext = `

👥 THE PARTY:
${playerCharacters.map(p => `• ${p.name}: ${p.summary || 'Adventurer'}`).join('\n')}
`;
    }

    // Available NPCs context
    let npcContext = '';
    if (usableNpcs.length > 0) {
      npcContext = `

AVAILABLE NPCs (prefer these over inventing new ones):
${usableNpcs.slice(0, 25).map(npc => {
  const motivation = npc.brain?.motivation || '';
  return `- ${npc.name}: ${npc.summary || 'No description'}${motivation ? ` (Wants: ${motivation})` : ''}`;
}).join('\n')}
`;
    }

    // Build the full system prompt
    const systemPrompt = `You are an expert Dungeon Master assistant for D&D 5e campaigns.
Your job is to help the DM prepare engaging, personalized scenes that leverage EXISTING campaign elements.

CAMPAIGN: ${campaign?.name || 'Unknown Campaign'}

${questContext}

${relationshipContext}

${relevantLocationContext}

${locationNpcContext}

${factionContext}

${allFactionsContext}

${itemContext}

${encounterContext}

${creaturesContext}

${playerContext}

${npcContext}

CRITICAL RULES:
1. ALWAYS use existing NPCs, locations, and encounters - this creates continuity!
2. If there's a RIVAL/ENEMY relationship, they MUST interfere or complicate the objective
3. If a party member has a connection, create a moment for them to use it
4. If there are NPCs at the location, use them for information/social encounters
5. Set scenes in the RELEVANT LOCATIONS listed above when possible
6. Create 3 distinct beats: Social → Exploration/Discovery → Potential Combat
7. Each beat should be 2-3 sentences - evocative but not prescriptive
8. Reference existing encounters if they fit, rather than inventing new ones
9. Include faction politics if relevant factions are involved
10. Use creatures from the campaign for combat encounters`;

    const userPrompt = `Break this quest objective into 3 playable beats:

OBJECTIVE: ${objective}
${objectiveDescription ? `DETAILS: ${objectiveDescription}` : ''}

Return your response as JSON with this exact structure:
{
  "content": [
    { "type": "readAloud", "text": "Boxed text the DM can read to players..." },
    { "type": "paragraph", "text": "DM notes about this beat..." },
    { "type": "encounter", "name": "Encounter Name", "description": "Brief description", "difficulty": "medium" }
  ],
  "suggestedNpcs": [
    { "name": "NPC Name", "role": "How they're involved" }
  ],
  "hooks": ["Optional plot hooks this creates..."]
}

Remember: Use existing NPCs and relationships! Don't invent new characters if the campaign already has someone who fits the role.`;

    // =========================================
    // DEBUG LOGGING - Full Context Summary
    // =========================================
    console.log('=== FULL CONTEXT SUMMARY ===');
    console.log(`Campaign: ${campaign?.name}`);
    console.log(`--- ENTITY COUNTS ---`);
    console.log(`Total NPCs: ${entityGroups.npcs.length}`);
    console.log(`Total Locations: ${entityGroups.locations.length}`);
    console.log(`Total Factions: ${entityGroups.factions.length}`);
    console.log(`Total Items: ${entityGroups.items.length}`);
    console.log(`Total Encounters: ${entityGroups.encounters.length}`);
    console.log(`Total Creatures: ${entityGroups.creatures.length}`);
    console.log(`--- MATCHING ---`);
    console.log(`Name-Matched Entities: ${mentionedEntities.length}`);
    console.log(`Keyword-Matched Locations: ${relevantLocations.length}`);
    console.log(`Keyword-Matched Encounters: ${relevantEncounters.length}`);
    console.log(`--- CONTEXT USED ---`);
    console.log(`All Relationships: ${allRelationships?.length || 0}`);
    console.log(`Relevant Relationships: ${relationships.length}`);
    console.log(`All Relevant Locations: ${allRelevantLocations.length}`);
    console.log(`Location NPCs: ${locationNpcs.length}`);
    console.log(`Involved Factions: ${involvedFactions.length}`);
    console.log(`Relevant Items: ${relevantItems.length}`);
    console.log(`All Relevant Encounters: ${allRelevantEncounters.length}`);
    console.log(`Player Connections: ${playerConnections.length}`);
    console.log(`Available NPCs: ${usableNpcs.length}`);
    console.log('');
    console.log('--- SYSTEM PROMPT ---');
    console.log(systemPrompt);

    // =========================================
    // STEP 11: Call OpenAI
    // =========================================

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    const generatedContent = JSON.parse(responseText);

    // =========================================
    // STEP 12: Return the Generated Beats
    // =========================================

    return NextResponse.json({
      success: true,
      content: generatedContent.content || [],
      suggestedNpcs: generatedContent.suggestedNpcs || [],
      hooks: generatedContent.hooks || [],
      context: {
        // Entity counts
        totalNpcs: entityGroups.npcs.length,
        totalLocations: entityGroups.locations.length,
        totalFactions: entityGroups.factions.length,
        totalItems: entityGroups.items.length,
        totalEncounters: entityGroups.encounters.length,
        totalCreatures: entityGroups.creatures.length,
        // Matching
        nameMatched: mentionedEntities.map(e => e.name),
        keywordLocations: relevantLocations.map(l => l.name),
        keywordEncounters: relevantEncounters.map(e => e.name),
        // Context used
        relationshipsUsed: relationships.length,
        allRelationships: allRelationships?.length || 0,
        relevantLocations: allRelevantLocations.length,
        locationNpcs: locationNpcs.length,
        factions: involvedFactions.length,
        items: relevantItems.length,
        encounters: allRelevantEncounters.length,
        playerConnections: playerConnections.length,
        npcsAvailable: usableNpcs.length,
      },
    });

  } catch (error) {
    console.error('Beat generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate beats' },
      { status: 500 }
    );
  }
}
