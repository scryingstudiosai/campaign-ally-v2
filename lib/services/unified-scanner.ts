import { getOpenAIClient } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export interface EntityMention {
  name: string;
  type: 'npc' | 'location' | 'item' | 'quest' | 'faction' | 'creature';
  summary: string;
  confidence: number;
  textRange: { start: number; end: number };
  snippet: string;
  existingMatch?: {
    id: string;
    name: string;
    similarity: number;
  };
}

export interface ScanResult {
  mentions: EntityMention[];
  stats: {
    total: number;
    newEntities: number;
    potentialMerges: number;
  };
}

export async function scanTextForEntities(
  text: string,
  campaignId: string
): Promise<ScanResult> {
  const supabase = await createClient();
  const openai = getOpenAIClient();

  // Step 1: Use AI to extract entity mentions
  const extractionPrompt = `You are an expert at extracting D&D/TTRPG entities from text.

Analyze the following text and extract all mentioned entities. For each entity, provide:
- name: The entity's name as mentioned
- type: One of: npc, location, item, quest, faction, creature
- summary: A 1-2 sentence description based on context
- confidence: 0.0-1.0 how confident you are this is a real entity (not just a common noun)
- startIndex: Character index where the name first appears
- endIndex: Character index where the name ends

Focus on:
- Named characters (NPCs)
- Specific locations (towns, dungeons, taverns)
- Notable items (weapons, artifacts, quest items)
- Organizations/factions
- Quests or missions mentioned
- Creatures by name or specific type

Ignore:
- Generic terms like "the guard" or "a sword" unless they have specific names
- Common D&D terms without specific context

Return JSON object with "entities" array:
{
  "entities": [
    {
      "name": "Thalor the Blacksmith",
      "type": "npc",
      "summary": "A blacksmith who forged the legendary blade",
      "confidence": 0.95,
      "startIndex": 45,
      "endIndex": 65
    }
  ]
}

TEXT TO ANALYZE:
${text}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: extractionPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  let extractedEntities: any[] = [];
  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    extractedEntities = parsed.entities || [];
    if (!Array.isArray(extractedEntities)) {
      extractedEntities = [];
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    extractedEntities = [];
  }

  // Step 2: Check each entity against existing campaign entities
  const mentions: EntityMention[] = [];
  let potentialMerges = 0;

  for (const entity of extractedEntities) {
    // Find similar existing entities using fuzzy matching
    // Note: This requires a PostgreSQL function 'find_similar_entities'
    // If not available, we'll do simple name matching
    let bestMatch: { id: string; name: string; similarity: number } | null = null;

    try {
      const { data: similarEntities } = await supabase
        .rpc('find_similar_entities', {
          p_campaign_id: campaignId,
          p_name: entity.name,
          p_threshold: 0.3,
        });

      if (similarEntities && similarEntities.length > 0) {
        bestMatch = similarEntities[0];
      }
    } catch {
      // Fallback to simple name search if RPC doesn't exist
      const { data: existingEntities } = await supabase
        .from('entities')
        .select('id, name')
        .eq('campaign_id', campaignId)
        .ilike('name', `%${entity.name}%`)
        .limit(1);

      if (existingEntities && existingEntities.length > 0) {
        bestMatch = {
          id: existingEntities[0].id,
          name: existingEntities[0].name,
          similarity: 0.7, // Estimate
        };
      }
    }

    // Extract snippet (50 chars before and after)
    const startIdx = entity.startIndex || 0;
    const endIdx = entity.endIndex || startIdx + entity.name.length;
    const snippetStart = Math.max(0, startIdx - 50);
    const snippetEnd = Math.min(text.length, endIdx + 50);
    const snippet = text.slice(snippetStart, snippetEnd);

    const mention: EntityMention = {
      name: entity.name,
      type: entity.type,
      summary: entity.summary,
      confidence: entity.confidence,
      textRange: { start: startIdx, end: endIdx },
      snippet: `...${snippet}...`,
    };

    // If we found a similar entity with >60% match, flag as potential merge
    if (bestMatch && bestMatch.similarity > 0.6) {
      mention.existingMatch = {
        id: bestMatch.id,
        name: bestMatch.name,
        similarity: bestMatch.similarity,
      };
      potentialMerges++;
    }

    mentions.push(mention);
  }

  return {
    mentions,
    stats: {
      total: mentions.length,
      newEntities: mentions.length - potentialMerges,
      potentialMerges,
    },
  };
}
