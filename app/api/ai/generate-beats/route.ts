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
    // STEP 2: Find Related Entities (IMPROVED MATCHING)
    // =========================================

    const { data: allCampaignEntities } = await supabase
      .from('entities')
      .select('id, name, entity_type, summary, brain, mechanics')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .in('entity_type', ['npc', 'location', 'faction', 'creature']) as { data: EntityData[] | null; error: unknown };

    console.log('=== ENTITY MATCHING ===');
    console.log('Objective text:', objective);
    console.log('All campaign entities:', allCampaignEntities?.length);

    const searchText = `${objective} ${objectiveDescription || ''}`.toLowerCase();

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

    console.log('Matched entities:', mentionedEntities.map(e => e.name));
    const mentionedEntityIds = mentionedEntities.map(e => e.id);

    // =========================================
    // STEP 3: Get ALL Relationships for Found Entities
    // =========================================

    let relationships: RelationshipData[] = [];
    if (mentionedEntities.length > 0) {
      console.log('Looking for relationships for entity IDs:', mentionedEntityIds);

      const { data: rels, error: relError } = await supabase
        .from('relationships')
        .select(`
          id,
          relationship_type,
          description,
          surface_description,
          intensity,
          source_entity:source_id(id, name, entity_type, summary),
          target_entity:target_id(id, name, entity_type, summary)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`source_id.in.(${mentionedEntityIds.join(',')}),target_id.in.(${mentionedEntityIds.join(',')})`) as { data: RelationshipData[] | null; error: unknown };

      if (relError) {
        console.error('Relationship query error:', relError);
      } else {
        relationships = rels || [];
        console.log('=== RELATIONSHIPS FOUND ===');
        console.log('Count:', relationships.length);
        relationships.forEach(r => {
          console.log(`  ${r.source_entity?.name} --[${r.relationship_type}]--> ${r.target_entity?.name}`);
        });
      }
    }

    // =========================================
    // STEP 4: Find NPCs in Mentioned Locations
    // =========================================

    const mentionedLocations = mentionedEntities.filter(e => e.entity_type === 'location');
    console.log('Mentioned locations:', mentionedLocations.map(l => l.name));

    let locationNpcs: LocationNpc[] = [];
    if (mentionedLocations.length > 0) {
      const locationIds = mentionedLocations.map(l => l.id);

      const { data: locationRels } = await supabase
        .from('relationships')
        .select(`
          id,
          relationship_type,
          source_entity:source_id(id, name, entity_type, summary, brain),
          target_entity:target_id(id, name, entity_type, summary, brain)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`target_id.in.(${locationIds.join(',')}),source_id.in.(${locationIds.join(',')})`)
        .in('relationship_type', [
          'inhabited_by', 'located_in', 'lives_in', 'resides_in',
          'works_at', 'owns', 'operates', 'frequents', 'patrols',
          'contains', 'guards', 'runs'
        ]) as { data: RelationshipData[] | null; error: unknown };

      locationRels?.forEach(rel => {
        if (rel.source_entity?.entity_type === 'npc') {
          locationNpcs.push({
            id: rel.source_entity.id,
            name: rel.source_entity.name,
            summary: rel.source_entity.summary,
            brain: rel.source_entity.brain as LocationNpc['brain'],
            locationRelation: `${rel.relationship_type} ${rel.target_entity?.name}`
          });
        }
        if (rel.target_entity?.entity_type === 'npc') {
          locationNpcs.push({
            id: rel.target_entity.id,
            name: rel.target_entity.name,
            summary: rel.target_entity.summary,
            brain: rel.target_entity.brain as LocationNpc['brain'],
            locationRelation: `at ${rel.source_entity?.name}`
          });
        }
      });

      // Deduplicate by ID
      locationNpcs = Array.from(new Map(locationNpcs.map(n => [n.id, n])).values());

      console.log('=== NPCs IN MENTIONED LOCATIONS ===');
      locationNpcs.forEach(npc => {
        console.log(`  ${npc.name} - ${npc.locationRelation}`);
      });
    }

    // =========================================
    // STEP 5: Find Factions Involved
    // =========================================

    let involvedFactions: FactionData[] = [];
    if (mentionedEntityIds.length > 0) {
      const { data: factionRels } = await supabase
        .from('relationships')
        .select(`
          id,
          relationship_type,
          source_entity:source_id(id, name, entity_type, summary),
          target_entity:target_id(id, name, entity_type, summary)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`source_id.in.(${mentionedEntityIds.join(',')}),target_id.in.(${mentionedEntityIds.join(',')})`)
        .in('relationship_type', [
          'member_of', 'belongs_to', 'leads', 'serves',
          'allied_with', 'enemy_of', 'works_for'
        ]) as { data: RelationshipData[] | null; error: unknown };

      factionRels?.forEach(rel => {
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
      });

      involvedFactions = Array.from(new Map(involvedFactions.map(f => [f.id, f])).values());

      console.log('=== FACTIONS INVOLVED ===');
      involvedFactions.forEach(f => console.log(`  ${f.name} - ${f.connection}`));
    }

    // =========================================
    // STEP 6: Find Related Items/Artifacts
    // =========================================

    let relevantItems: ItemData[] = [];
    if (mentionedEntityIds.length > 0) {
      const { data: itemRels } = await supabase
        .from('relationships')
        .select(`
          id,
          relationship_type,
          description,
          source_entity:source_id(id, name, entity_type, summary),
          target_entity:target_id(id, name, entity_type, summary)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`source_id.in.(${mentionedEntityIds.join(',')}),target_id.in.(${mentionedEntityIds.join(',')})`)
        .in('relationship_type', [
          'owns', 'carries', 'guards', 'seeks', 'created',
          'possesses', 'hides', 'protects'
        ]) as { data: RelationshipData[] | null; error: unknown };

      itemRels?.forEach(rel => {
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
      });

      relevantItems = Array.from(new Map(relevantItems.map(i => [i.id, i])).values());

      console.log('=== RELEVANT ITEMS ===');
      relevantItems.forEach(i => console.log(`  ${i.name} - ${i.connection}`));
    }

    // =========================================
    // STEP 7: Find Active Encounters at Location
    // =========================================

    let locationEncounters: EntityData[] = [];
    if (mentionedLocations.length > 0) {
      const locationIds = mentionedLocations.map(l => l.id);

      const { data: encounterRels } = await supabase
        .from('relationships')
        .select(`
          source_entity:source_id(id, name, entity_type, summary, mechanics),
          target_entity:target_id(id, name, entity_type)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`target_id.in.(${locationIds.join(',')}),source_id.in.(${locationIds.join(',')})`)
        .eq('relationship_type', 'located_at') as { data: RelationshipData[] | null; error: unknown };

      encounterRels?.forEach(rel => {
        if (rel.source_entity?.entity_type === 'encounter') {
          locationEncounters.push(rel.source_entity as unknown as EntityData);
        }
      });

      console.log('=== ENCOUNTERS AT LOCATION ===');
      locationEncounters.forEach(e => console.log(`  ${e.name}: ${e.summary}`));
    }

    // =========================================
    // STEP 8: Get Player Characters & Connections
    // =========================================

    const { data: playerCharacters } = await supabase
      .from('entities')
      .select('id, name, summary, brain, mechanics')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'player')
      .is('deleted_at', null) as { data: EntityData[] | null; error: unknown };

    let playerConnections: PlayerConnection[] = [];
    if (playerCharacters && playerCharacters.length > 0 && mentionedEntityIds.length > 0) {
      const playerIds = playerCharacters.map(p => p.id);

      const { data: playerRels } = await supabase
        .from('relationships')
        .select(`
          id,
          relationship_type,
          description,
          source_entity:source_id(id, name, entity_type),
          target_entity:target_id(id, name, entity_type)
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .or(`source_id.in.(${playerIds.join(',')}),target_id.in.(${playerIds.join(',')})`) as { data: RelationshipData[] | null; error: unknown };

      playerRels?.forEach(rel => {
        const isPlayerSource = playerIds.includes(rel.source_entity?.id || '');
        const player = isPlayerSource ? rel.source_entity : rel.target_entity;
        const other = isPlayerSource ? rel.target_entity : rel.source_entity;

        if (mentionedEntityIds.includes(other?.id || '')) {
          playerConnections.push({
            playerName: player?.name || 'Unknown',
            connectedTo: other?.name || 'Unknown',
            relationship: rel.relationship_type,
            description: rel.description
          });
        }
      });

      console.log('=== PLAYER CONNECTIONS ===');
      playerConnections.forEach(pc => {
        console.log(`  ${pc.playerName} --[${pc.relationship}]--> ${pc.connectedTo}`);
      });
    }

    // =========================================
    // STEP 9: Get Available NPCs
    // =========================================

    const { data: nearbyNpcs } = await supabase
      .from('entities')
      .select('id, name, entity_type, summary, brain, forge_status')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'npc')
      .is('deleted_at', null)
      .limit(50) as { data: EntityData[] | null; error: unknown };

    // Include all NPCs that have useful info (not just stubs without content)
    const usableNpcs = nearbyNpcs?.filter(npc =>
      npc.forge_status !== 'stub' || npc.summary || npc.brain?.motivation
    ) || [];

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
      const locationNames = mentionedLocations.map(l => l.name).join(', ');
      locationNpcContext = `

📍 NPCs IN/NEAR ${locationNames.toUpperCase()}:
${locationNpcs.slice(0, 8).map(npc => {
  const motivation = npc.brain?.motivation || npc.brain?.goals || '';
  return `• ${npc.name} (${npc.locationRelation})
  ${npc.summary || 'No description'}${motivation ? `\n  💭 Motivation: ${motivation}` : ''}`;
}).join('\n')}

Use these NPCs for information gathering, social encounters, or complications!
`;
    }

    // Faction context
    let factionContext = '';
    if (involvedFactions.length > 0) {
      factionContext = `

🏴 FACTIONS INVOLVED:
${involvedFactions.map(f => `• ${f.name}: ${f.summary || 'No description'}
  Connection: ${f.connection}`).join('\n')}

Consider faction politics and how they might help or hinder the party.
`;
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

    // Existing encounters context
    let encounterContext = '';
    if (locationEncounters.length > 0) {
      encounterContext = `

⚔️ PRE-BUILT ENCOUNTERS AT THIS LOCATION:
${locationEncounters.map(e => `• ${e.name}: ${e.summary || 'No description'}`).join('\n')}

You may reference these existing encounters instead of creating new ones!
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

${locationNpcContext}

${factionContext}

${itemContext}

${encounterContext}

${playerContext}

${npcContext}

CRITICAL RULES:
1. ALWAYS use existing NPCs and relationships - this creates continuity!
2. If there's a RIVAL/ENEMY, they MUST interfere or complicate the objective
3. If a party member has a connection, create a moment for them to use it
4. If there are NPCs at the location, use them for information/social encounters
5. Create 3 distinct beats: Social → Exploration/Discovery → Potential Combat
6. Each beat should be 2-3 sentences - evocative but not prescriptive
7. Reference existing encounters if they fit, rather than inventing new ones
8. Include faction politics if relevant factions are involved`;

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
    console.log(`Mentioned Entities: ${mentionedEntities.length}`);
    console.log(`Relationships: ${relationships.length}`);
    console.log(`Location NPCs: ${locationNpcs.length}`);
    console.log(`Factions: ${involvedFactions.length}`);
    console.log(`Items: ${relevantItems.length}`);
    console.log(`Location Encounters: ${locationEncounters.length}`);
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
        relationshipsUsed: relationships.length,
        locationNpcs: locationNpcs.length,
        factions: involvedFactions.length,
        items: relevantItems.length,
        encounters: locationEncounters.length,
        playerConnections: playerConnections.length,
        npcsAvailable: usableNpcs.length,
        entitiesMatched: mentionedEntities.map(e => e.name),
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
