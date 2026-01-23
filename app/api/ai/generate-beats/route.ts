import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import {
  categorizeRelationships,
  buildRelationshipContext,
  checkRelationshipDensity,
  type RelationshipWithEntities,
} from '@/lib/forge/relationship-extractor';

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

interface ScoredNpc {
  id: string;
  name: string;
  summary?: string;
  brain?: { motivation?: string; goals?: string };
  score: number;
  reasons: string[];
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

    // Get the quest details if we have questId, including quest chain context
    let questContext = '';
    let questChainContext = '';
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

        // Extract quest objectives for chain context
        const questBrain = quest.brain as Record<string, unknown> | null;
        const objectives = questBrain?.objectives as Array<{
          id?: string;
          name?: string;
          title?: string;
          description?: string;
          status?: string;
        }> | null;

        if (objectives && objectives.length > 0) {
          // Find the current objective by matching the objective text
          const currentIndex = objectives.findIndex(obj => {
            const objTitle = obj.name || obj.title || '';
            const objDesc = obj.description || '';
            return objective.toLowerCase().includes(objTitle.toLowerCase()) ||
                   objTitle.toLowerCase().includes(objective.toLowerCase()) ||
                   (objDesc && objective.toLowerCase().includes(objDesc.substring(0, 30).toLowerCase()));
          });

          if (currentIndex !== -1) {
            const prevObjectives = objectives.slice(Math.max(0, currentIndex - 2), currentIndex);
            const nextObjectives = objectives.slice(currentIndex + 1, currentIndex + 3);

            questChainContext = `
📜 QUEST CHAIN CONTEXT:`;

            if (prevObjectives.length > 0) {
              questChainContext += `
Previously Completed:
${prevObjectives.map(obj => `  ✓ ${obj.name || obj.title || 'Objective'}: ${obj.description || ''}`).join('\n')}`;
            }

            questChainContext += `
Current Objective (#${currentIndex + 1} of ${objectives.length}):
  ➤ ${objective}`;

            if (nextObjectives.length > 0) {
              questChainContext += `
Coming Next:
${nextObjectives.map(obj => `  ○ ${obj.name || obj.title || 'Objective'}: ${obj.description || ''}`).join('\n')}`;
            }

            questChainContext += `

Consider how this objective connects to what came before and sets up what comes next!`;

            console.log('=== QUEST CHAIN CONTEXT ===');
            console.log(`Objective ${currentIndex + 1} of ${objectives.length}`);
            console.log(`Previous: ${prevObjectives.length}, Next: ${nextObjectives.length}`);
          }
        }
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

    // Comprehensive stop words list for fantasy/RPG context
    const stopWords = [
      // Articles & conjunctions
      'the', 'a', 'an', 'to', 'and', 'or', 'but', 'nor', 'yet', 'so',
      // Prepositions
      'in', 'on', 'at', 'for', 'of', 'with', 'from', 'into', 'onto', 'upon',
      'by', 'about', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'over', 'out', 'off', 'down', 'up', 'near', 'around',
      // Pronouns
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
      'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
      // Common verbs
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
      'get', 'got', 'go', 'went', 'gone', 'going', 'come', 'came', 'coming',
      // Common adjectives/adverbs
      'very', 'really', 'quite', 'just', 'only', 'also', 'even', 'still', 'already',
      'some', 'any', 'many', 'much', 'more', 'most', 'other', 'another', 'each',
      'all', 'both', 'few', 'several', 'enough', 'every', 'either', 'neither',
      // Quest-common filler words
      'need', 'needs', 'want', 'wants', 'must', 'should', 'help', 'find', 'look',
      'make', 'take', 'give', 'tell', 'know', 'see', 'think', 'say', 'said',
      'way', 'time', 'thing', 'things', 'place', 'something', 'someone', 'somewhere',
      'there', 'here', 'now', 'then', 'always', 'never', 'often', 'sometimes',
      // Common RPG filler
      'quest', 'task', 'mission', 'objective', 'party', 'players', 'player'
    ];

    const minWordLength = 4; // Minimum word length to be considered a keyword
    const objectiveKeywords = `${objective} ${objectiveDescription || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= minWordLength && !stopWords.includes(word));

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
      const locationNames = allRelevantLocations.map(l => l.name.toLowerCase());

      // Expanded relationship types for location-NPC connections
      const locationRelTypes = [
        // Residence
        'inhabited_by', 'located_in', 'lives_in', 'resides_in', 'lives_at', 'stays_at',
        'dwells_in', 'based_in', 'based_at', 'home_in', 'resides_at',
        // Work/Operations
        'works_at', 'works_in', 'works_for', 'employed_at', 'employed_by',
        'owns', 'operates', 'runs', 'manages', 'leads', 'controls',
        // Visits/Movement
        'frequents', 'visits', 'patrols', 'guards', 'watches', 'protects',
        'travels_to', 'travels_through', 'stationed_at', 'stationed_in',
        // Generic associations
        'contains', 'at', 'in', 'found_at', 'found_in', 'associated_with',
        'connected_to', 'linked_to', 'related_to', 'member_of', 'part_of',
        // Business
        'customer_of', 'patron_of', 'supplier_to', 'serves', 'serves_at'
      ];

      // Method 1: Find NPCs through relationships
      allRelationships?.forEach(rel => {
        const isLocationTarget = locationIds.includes(rel.target_entity?.id || '');
        const isLocationSource = locationIds.includes(rel.source_entity?.id || '');

        // Check both directions for location-NPC relationships
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

        // Also check generic relationships where location is involved
        if ((isLocationTarget || isLocationSource) && !locationRelTypes.includes(rel.relationship_type)) {
          const npc = rel.source_entity?.entity_type === 'npc' ? rel.source_entity :
                      rel.target_entity?.entity_type === 'npc' ? rel.target_entity : null;
          const loc = isLocationTarget ? rel.target_entity : rel.source_entity;
          if (npc && loc) {
            locationNpcs.push({
              id: npc.id,
              name: npc.name,
              summary: npc.summary,
              brain: npc.brain as LocationNpc['brain'],
              locationRelation: `${rel.relationship_type} (${loc?.name})`
            });
          }
        }
      });

      // Method 2: Search NPC summaries for location name mentions
      entityGroups.npcs.forEach(npc => {
        const npcText = `${npc.summary || ''} ${npc.brain?.motivation || ''} ${npc.brain?.goals || ''}`.toLowerCase();
        for (const locName of locationNames) {
          // Check if location name (at least 4 chars) appears in NPC description
          if (locName.length >= 4 && npcText.includes(locName)) {
            // Don't add if already found through relationships
            if (!locationNpcs.find(ln => ln.id === npc.id)) {
              const matchedLoc = allRelevantLocations.find(l => l.name.toLowerCase() === locName);
              locationNpcs.push({
                id: npc.id,
                name: npc.name,
                summary: npc.summary,
                brain: npc.brain as LocationNpc['brain'],
                locationRelation: `mentioned with ${matchedLoc?.name || locName}`
              });
            }
            break; // Only add once per NPC
          }
        }
      });

      // Deduplicate by ID
      locationNpcs = Array.from(new Map(locationNpcs.map(n => [n.id, n])).values());

      console.log('=== NPCs AT RELEVANT LOCATIONS ===');
      console.log(`Found ${locationNpcs.length} NPCs for locations: ${locationNames.join(', ')}`);
      locationNpcs.forEach(npc => {
        console.log(`  ${npc.name} - ${npc.locationRelation}`);
      });
    }

    // =========================================
    // STEP 8.5: NPC Relevance Scoring
    // =========================================

    // Score all NPCs based on their relevance to the quest objective
    const scoredNpcs: ScoredNpc[] = entityGroups.npcs.map(npc => {
      let score = 0;
      const reasons: string[] = [];

      const npcText = `${npc.name} ${npc.summary || ''} ${npc.brain?.motivation || ''} ${npc.brain?.goals || ''}`.toLowerCase();

      // +10 points: Directly mentioned in objective
      if (mentionedEntityIds.includes(npc.id)) {
        score += 10;
        reasons.push('named in objective');
      }

      // +5 points per keyword match in name/summary/brain
      for (const keyword of objectiveKeywords) {
        if (npcText.includes(keyword)) {
          score += 5;
          reasons.push(`keyword: "${keyword}"`);
        }
      }

      // +4 points: At a relevant location
      if (locationNpcs.find(ln => ln.id === npc.id)) {
        score += 4;
        reasons.push('at relevant location');
      }

      // +6 points: Has relationship to a matched entity
      const hasRelevantRelationship = allRelationships?.some(rel => {
        const involvesNpc = rel.source_entity?.id === npc.id || rel.target_entity?.id === npc.id;
        const involvesRelevant = mentionedEntityIds.includes(rel.source_entity?.id || '') ||
                                 mentionedEntityIds.includes(rel.target_entity?.id || '');
        return involvesNpc && involvesRelevant;
      });
      if (hasRelevantRelationship) {
        score += 6;
        reasons.push('related to matched entity');
      }

      // +8 points: Has drama-worthy relationship (rival, enemy, lover, etc.)
      const dramaRelTypes = ['rival', 'enemy', 'lover', 'betrayed', 'owes', 'seeks_revenge', 'fears', 'hates', 'loves'];
      const hasDramaRelationship = allRelationships?.some(rel => {
        const involvesNpc = rel.source_entity?.id === npc.id || rel.target_entity?.id === npc.id;
        return involvesNpc && dramaRelTypes.includes(rel.relationship_type);
      });
      if (hasDramaRelationship) {
        score += 8;
        reasons.push('drama potential');
      }

      // +3 points: Has good forge status (not a stub)
      if (npc.forge_status !== 'stub' && (npc.summary || npc.brain?.motivation)) {
        score += 3;
        reasons.push('detailed NPC');
      }

      return {
        id: npc.id,
        name: npc.name,
        summary: npc.summary,
        brain: npc.brain as ScoredNpc['brain'],
        score,
        reasons
      };
    });

    // Sort by score descending and filter to those with some relevance
    const relevantScoredNpcs = scoredNpcs
      .filter(npc => npc.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log('=== NPC RELEVANCE SCORES ===');
    console.log(`Scored ${relevantScoredNpcs.length} relevant NPCs out of ${entityGroups.npcs.length} total`);
    relevantScoredNpcs.slice(0, 15).forEach(npc => {
      console.log(`  ${npc.score}pts - ${npc.name}: ${npc.reasons.join(', ')}`);
    });

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
    // STEP 13: Prepare Available NPCs (use scored NPCs first)
    // =========================================

    // Use scored NPCs for priority, then fill with other detailed NPCs
    const highRelevanceNpcs = relevantScoredNpcs.slice(0, 20); // Top 20 scored NPCs
    const otherDetailedNpcs = entityGroups.npcs
      .filter(npc =>
        !highRelevanceNpcs.find(hn => hn.id === npc.id) &&
        (npc.forge_status !== 'stub' || npc.summary || npc.brain?.motivation)
      )
      .slice(0, 30);

    // Combine: scored NPCs first, then other detailed NPCs
    const usableNpcs = [
      ...highRelevanceNpcs.map(sn => entityGroups.npcs.find(n => n.id === sn.id)!),
      ...otherDetailedNpcs
    ].filter(Boolean);

    // =========================================
    // STEP 10: Build Enhanced System Prompt
    // =========================================

    // Categorize and build relationship context using the extractor utilities
    const categorizedRels = categorizeRelationships(relationships as RelationshipWithEntities[]);

    // Check relationship density for mentioned entities
    const densityWarnings: string[] = [];
    for (const entity of mentionedEntities.slice(0, 5)) {
      const density = checkRelationshipDensity(entity.id, relationships as RelationshipWithEntities[]);
      if (density.warning) {
        densityWarnings.push(`${entity.name}: ${density.warning}`);
      }
    }

    if (densityWarnings.length > 0) {
      console.log('=== RELATIONSHIP DENSITY WARNINGS ===');
      densityWarnings.forEach(w => console.log(`  ${w}`));
    }

    // Build relationship context using categorized format
    let relationshipContext = '';
    if (relationships.length > 0) {
      // Use the utility function for formatted output
      relationshipContext = buildRelationshipContext(categorizedRels);

      // Add summary stats
      const stats = [];
      if (categorizedRels.conflicts.length > 0) stats.push(`${categorizedRels.conflicts.length} conflicts`);
      if (categorizedRels.alliances.length > 0) stats.push(`${categorizedRels.alliances.length} alliances`);
      if (categorizedRels.locations.length > 0) stats.push(`${categorizedRels.locations.length} location ties`);
      if (categorizedRels.memberships.length > 0) stats.push(`${categorizedRels.memberships.length} memberships`);

      console.log('=== CATEGORIZED RELATIONSHIPS ===');
      console.log(`Summary: ${stats.join(', ')}`);
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

    // Available NPCs context - prioritize highly relevant NPCs
    let npcContext = '';

    // First, show highly relevant NPCs with their reasons
    if (highRelevanceNpcs.length > 0) {
      const topRelevant = highRelevanceNpcs.filter(npc => npc.score >= 5).slice(0, 10);
      if (topRelevant.length > 0) {
        npcContext = `

⭐ HIGHLY RELEVANT NPCs FOR THIS OBJECTIVE:
${topRelevant.map(npc => {
  const fullNpc = entityGroups.npcs.find(n => n.id === npc.id);
  const motivation = fullNpc?.brain?.motivation || '';
  const reasonStr = npc.reasons.slice(0, 2).join(', ');
  return `• ${npc.name} [${npc.score}pts: ${reasonStr}]
  ${npc.summary || 'No description'}${motivation ? `\n  💭 Wants: ${motivation}` : ''}`;
}).join('\n')}

🎯 PRIORITIZE using these NPCs - they match the objective!
`;
      }
    }

    // Then show other available NPCs
    if (usableNpcs.length > 0) {
      const otherNpcs = usableNpcs.filter(npc => {
        const scored = highRelevanceNpcs.find(hn => hn.id === npc.id);
        return !scored || scored.score < 5;
      });

      if (otherNpcs.length > 0) {
        npcContext += `
OTHER AVAILABLE NPCs:
${otherNpcs.slice(0, 15).map(npc => {
  const motivation = npc.brain?.motivation || '';
  return `- ${npc.name}: ${npc.summary || 'No description'}${motivation ? ` (Wants: ${motivation})` : ''}`;
}).join('\n')}
`;
      }
    }

    // Build the full system prompt
    const systemPrompt = `You are an expert Dungeon Master assistant for D&D 5e campaigns.
Your job is to help the DM prepare engaging, personalized scenes that leverage EXISTING campaign elements.

CAMPAIGN: ${campaign?.name || 'Unknown Campaign'}

${questContext}
${questChainContext}

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
10. Use creatures from the campaign for combat encounters
11. If quest chain context is provided, reference previous progress and foreshadow upcoming objectives`;

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
    console.log(`--- NPC SCORING ---`);
    console.log(`High Relevance NPCs (score>=5): ${highRelevanceNpcs.filter(n => n.score >= 5).length}`);
    console.log(`Any Relevance NPCs (score>0): ${relevantScoredNpcs.length}`);
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
        keywords: objectiveKeywords.slice(0, 10), // Show extracted keywords
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
        // Categorized relationships
        relationshipCategories: {
          conflicts: categorizedRels.conflicts.length,
          alliances: categorizedRels.alliances.length,
          locations: categorizedRels.locations.length,
          memberships: categorizedRels.memberships.length,
          ownership: categorizedRels.ownership.length,
        },
        densityWarnings: densityWarnings.length,
        // NPC Scoring
        highRelevanceNpcs: highRelevanceNpcs.filter(n => n.score >= 5).length,
        topScoredNpcs: highRelevanceNpcs.slice(0, 5).map(n => ({ name: n.name, score: n.score, reasons: n.reasons.slice(0, 2) })),
        // Quest chain
        hasQuestChain: questChainContext.length > 0,
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
