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
  source_entity?: { id: string; name: string; entity_type: string; summary?: string } | null;
  target_entity?: { id: string; name: string; entity_type: string; summary?: string } | null;
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
  codex?: {
    tone?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, objectiveDescription, questId, questName, campaignId } = body;

    if (!objective || !campaignId) {
      return NextResponse.json(
        { error: 'Objective and campaignId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // =========================================
    // DEBUG: Check database state
    // =========================================

    // DEBUG: Check what entities exist with "Varis" in the name
    const { data: varisCheck } = await supabase
      .from('entities')
      .select('id, name, entity_type, forge_status, deleted_at')
      .eq('campaign_id', campaignId)
      .ilike('name', '%Varis%');

    console.log('=== VARIS CHECK ===');
    console.log('Entities with "Varis" in name:', varisCheck);

    // DEBUG: Check what relationships exist for this campaign
    const { data: allRels } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        description,
        source_id,
        target_id
      `)
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .limit(20);

    console.log('=== ALL RELATIONSHIPS (first 20) ===');
    console.log(allRels);

    // Check relationship table structure
    const { data: campaignRels } = await supabase
      .from('relationships')
      .select('*')
      .limit(5);

    console.log('=== RELATIONSHIP TABLE STRUCTURE ===');
    console.log('Sample relationship:', campaignRels?.[0]);

    // DEBUG: Check objective text matching
    console.log('=== OBJECTIVE TEXT MATCHING ===');
    console.log('Objective:', objective);
    console.log('Objective lowercase:', objective.toLowerCase());

    // Get ALL npcs for this campaign
    const { data: allNpcsDebug } = await supabase
      .from('entities')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'npc')
      .is('deleted_at', null);

    console.log('All NPCs in campaign:', allNpcsDebug?.map(n => n.name));

    // Check which ones match
    allNpcsDebug?.forEach(npc => {
      const nameInObjective = objective.toLowerCase().includes(npc.name.toLowerCase());
      if (nameInObjective) {
        console.log(`MATCH FOUND: "${npc.name}" is in objective!`);
      }
    });

    // =========================================
    // STEP 1: Gather Campaign Context
    // =========================================

    // Get campaign with better error handling
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, codex')
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

    // Get ALL NPCs and locations for this campaign (excluding deleted)
    const { data: allCampaignEntities } = await supabase
      .from('entities')
      .select('id, name, entity_type, summary, brain, mechanics')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .in('entity_type', ['npc', 'location', 'faction', 'creature']) as { data: EntityData[] | null; error: unknown };

    console.log('=== ENTITY MATCHING ===');
    console.log('Objective text:', objective);
    console.log('All campaign entities:', allCampaignEntities?.length);

    // Combine objective and description for matching
    const searchText = `${objective} ${objectiveDescription || ''}`.toLowerCase();

    // Find entities where:
    // 1. Entity name appears in the search text, OR
    // 2. Any significant part of entity name appears in search text
    const mentionedEntities: EntityData[] = allCampaignEntities?.filter(entity => {
      const entityNameLower = entity.name.toLowerCase();
      const entityNameParts = entityNameLower.split(' ');

      // Check if search text contains the full entity name
      if (searchText.includes(entityNameLower)) {
        console.log(`MATCH (full name): "${entity.name}" found in objective`);
        return true;
      }

      // Check if search text contains significant parts of entity name (2+ word match)
      for (let i = 0; i < entityNameParts.length - 1; i++) {
        const twoWordCombo = `${entityNameParts[i]} ${entityNameParts[i + 1]}`;
        if (twoWordCombo.length > 5 && searchText.includes(twoWordCombo)) {
          console.log(`MATCH (partial): "${twoWordCombo}" from "${entity.name}" found in objective`);
          return true;
        }
      }

      // Check if entity's first two words match (for "Sage Varis" matching "Sage Varis Windwhisper")
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

    // =========================================
    // STEP 3: Get ALL Relationships for Found Entities
    // =========================================

    let relationships: RelationshipData[] = [];
    if (mentionedEntities.length > 0) {
      const entityIds = mentionedEntities.map(e => e.id);

      console.log('Looking for relationships for entity IDs:', entityIds);

      // FIXED: Use correct column names (source_id and target_id, NOT source_entity_id)
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
        .or(`source_id.in.(${entityIds.join(',')}),target_id.in.(${entityIds.join(',')})`) as { data: RelationshipData[] | null; error: unknown };

      if (relError) {
        console.error('Relationship query error:', relError);
      } else {
        relationships = rels || [];
        console.log('=== RELATIONSHIPS FOUND ===');
        console.log('Count:', relationships.length);
        relationships.forEach(r => {
          console.log(`  ${r.source_entity?.name} --[${r.relationship_type}]--> ${r.target_entity?.name}`);
          console.log(`    Description: ${r.description || 'none'}`);
        });
      }
    } else {
      console.log('No mentioned entities found to look up relationships for');
    }

    // Get player characters for party context
    const { data: players } = await supabase
      .from('entities')
      .select('id, name, summary, mechanics')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'player')
      .is('deleted_at', null) as { data: EntityData[] | null; error: unknown };

    // =========================================
    // STEP 4: Get NPCs (exclude deleted, exclude stubs without content)
    // =========================================

    const { data: nearbyNpcs } = await supabase
      .from('entities')
      .select('id, name, entity_type, summary, brain, forge_status')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'npc')
      .is('deleted_at', null)  // Exclude deleted
      .limit(10) as { data: EntityData[] | null; error: unknown };

    // Filter out stubs that have no useful content
    const usableNpcs = nearbyNpcs?.filter(npc =>
      npc.forge_status !== 'stub' || npc.summary || npc.brain?.motivation
    ) || [];

    console.log('Available NPCs (non-deleted):', nearbyNpcs?.map(n => `${n.name} (${n.forge_status || 'complete'})`));
    console.log('Usable NPCs (with content):', usableNpcs.map(n => n.name));

    // =========================================
    // STEP 5: Build the Context-Rich Prompt
    // =========================================

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

⚠️ CRITICAL INSTRUCTION: You MUST incorporate at least one of these relationships into your beats!
If there's a RIVAL or ENEMY, they should interfere or complicate the objective.
`;
    } else {
      relationshipContext = '\n(No direct relationships found for mentioned entities)\n';
      console.log('WARNING: No relationships found for mentioned entities');
    }

    let npcContext = '';
    if (usableNpcs.length > 0) {
      npcContext = `
AVAILABLE NPCs (prefer these over inventing new ones):
${usableNpcs.slice(0, 5).map(npc => {
  const motivation = npc.brain?.motivation || npc.brain?.goals || '';
  return `- ${npc.name}: ${npc.summary || 'No description'}${motivation ? `. Motivation: ${motivation}` : ''}`;
}).join('\n')}
      `;
    }

    let partyContext = '';
    if (players && players.length > 0) {
      partyContext = `
THE PARTY:
${players.map(p => `- ${p.name}: ${p.summary || 'Adventurer'}`).join('\n')}
      `;
    }

    const systemPrompt = `You are an expert Dungeon Master assistant for D&D 5e campaigns.
Your job is to help the DM prepare engaging, personalized scenes that leverage EXISTING campaign elements.

CAMPAIGN: ${campaign?.name || 'Unknown'}
WORLD CONTEXT: ${campaign?.codex?.tone || 'High fantasy adventure'}

${questContext}

${relationshipContext}

${npcContext}

${partyContext}

CRITICAL RULES:
1. ALWAYS use existing NPCs and relationships when possible - this creates continuity!
2. If an NPC has a rival/enemy, consider having them interfere with the objective
3. If a party member has a connection, use it for roleplay opportunities
4. Create 3 distinct beats: typically a Social moment, an Exploration/Discovery, and a potential Combat
5. Each beat should be 2-3 sentences - evocative but not prescriptive
6. Suggest at least one encounter but make it optional (DM decides if combat happens)`;

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
    // DEBUG LOGGING
    // =========================================
    console.log('========== BEAT GENERATOR DEBUG ==========');
    console.log('Objective:', objective);
    console.log('Campaign ID:', campaignId);
    console.log('Campaign Name:', campaign?.name);
    console.log('');
    console.log('--- MENTIONED ENTITIES ---');
    console.log('Potential names found:', potentialNames);
    console.log('Matched entities:', mentionedEntities?.map(e => ({ name: e.name, type: e.entity_type })));
    console.log('');
    console.log('--- RELATIONSHIPS FOUND ---');
    console.log('Relationship count:', relationships.length);
    relationships.forEach(r => {
      console.log(`  ${r.source_entity?.name} --[${r.relationship_type}]--> ${r.target_entity?.name}`);
    });
    console.log('');
    console.log('--- AVAILABLE NPCs ---');
    console.log(usableNpcs?.map(n => n.name));
    console.log('');
    console.log('--- SYSTEM PROMPT ---');
    console.log(systemPrompt);
    console.log('');
    console.log('--- USER PROMPT ---');
    console.log(userPrompt);
    console.log('==========================================');

    // =========================================
    // STEP 6: Call OpenAI
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

    // Parse the JSON response
    const generatedContent = JSON.parse(responseText);

    // =========================================
    // STEP 7: Return the Generated Beats
    // =========================================

    return NextResponse.json({
      success: true,
      content: generatedContent.content || [],
      suggestedNpcs: generatedContent.suggestedNpcs || [],
      hooks: generatedContent.hooks || [],
      context: {
        relationshipsUsed: relationships.length,
        npcsAvailable: usableNpcs?.length || 0,
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
