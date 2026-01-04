import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embedding';
import { CopilotMessage, CopilotSource, CopilotRequest, CopilotResponse } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CampaignMember {
  character_entity_id: string;
  entities: {
    id: string;
    name: string;
    soul: Record<string, unknown> | null;
  };
}

interface SemanticResult {
  id: string;
  entity_type: string;
  entity_name: string;
  content: string;
  similarity: number;
}

interface StoryThread {
  id: string;
  title: string;
  priority: string;
  clock_current: number | null;
  clock_max: number | null;
  consequence_if_ignored: string | null;
}

interface Entity {
  id: string;
  name: string;
  summary: string | null;
  brain: Record<string, unknown> | null;
  soul: Record<string, unknown> | null;
  entity_type: string;
}

interface GatheredContext {
  campaign: { id: string; name: string; codex: Record<string, unknown> | null } | null;
  codex: Record<string, unknown>;
  party: Array<{ id: string; name: string; soul: Record<string, unknown> | null }>;
  semanticResults: SemanticResult[];
  threads: StoryThread[];
  sources: CopilotSource[];
}

export class CopilotService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;

  async chat(request: CopilotRequest): Promise<CopilotResponse> {
    this.supabase = await createClient();
    const { campaignId, message, conversationHistory = [] } = request;

    console.log(`[Copilot] Processing: "${message}"`);

    // Step 1: Gather campaign context
    const context = await this.gatherContext(campaignId, message);

    // Step 2: Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Step 3: Build conversation messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Step 4: Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for chat
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseContent =
      completion.choices[0]?.message?.content || "I couldn't generate a response.";

    // Step 5: Generate follow-up suggestions
    const followUps = this.generateFollowUps(message, context);

    const responseMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      sources: context.sources,
      tokens: completion.usage?.total_tokens,
    };

    console.log(`[Copilot] Response generated (${completion.usage?.total_tokens} tokens)`);

    return {
      message: responseMessage,
      sources: context.sources,
      suggestedFollowUps: followUps,
    };
  }

  private async gatherContext(campaignId: string, query: string): Promise<GatheredContext> {
    // Get campaign basics
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('id, name, codex')
      .eq('id', campaignId)
      .single();

    // Get party members
    const { data: members } = await this.supabase
      .from('campaign_members')
      .select(
        `
        character_entity_id,
        entities:character_entity_id (id, name, soul)
      `
      )
      .eq('campaign_id', campaignId)
      .not('character_entity_id', 'is', null);

    const party =
      (members as CampaignMember[] | null)?.map((m) => m.entities).filter(Boolean) || [];

    // Semantic search for relevant entities
    let semanticResults: SemanticResult[] = [];
    const sources: CopilotSource[] = [];

    try {
      const embeddingArray = await generateEmbedding(query);
      const embeddingString = `[${embeddingArray.join(',')}]`;

      // Use match_campaign_context_text which accepts text instead of vector type
      // Threshold 0.15 is low but ensures we get relevant context even for broad queries
      const { data: results, error } = await this.supabase.rpc('match_campaign_context_text', {
        query_embedding_text: embeddingString,
        match_threshold: 0.15,
        match_count: 15,
        p_campaign_id: campaignId,
      });

      if (error) {
        console.error('[Copilot] Semantic search RPC error:', error);
      } else {
        semanticResults = (results as SemanticResult[]) || [];
        console.log(`[Copilot] Semantic search returned ${semanticResults.length} results`);
      }

      // Add to sources
      semanticResults.forEach((r) => {
        sources.push({
          id: r.id,
          type: 'entity',
          name: r.entity_name || 'Unknown',
          entityType: r.entity_type,
          relevance: r.similarity,
          snippet: r.content?.slice(0, 150),
        });
      });
    } catch (error) {
      console.error('[Copilot] Semantic search failed:', error);
    }

    // Keyword search fallback - catches cases where query mentions entity by name
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    if (queryWords.length > 0) {
      try {
        const { data: keywordResults } = await this.supabase
          .from('entities')
          .select('id, name, summary, description, entity_type')
          .eq('campaign_id', campaignId)
          .is('deleted_at', null)
          .or(queryWords.map(word => `name.ilike.%${word}%`).join(','))
          .limit(10);

        if (keywordResults && keywordResults.length > 0) {
          console.log(`[Copilot] Keyword search found ${keywordResults.length} results`);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keywordResults.forEach((entity: any) => {
            // Only add if not already in sources
            if (!sources.find(s => s.id === entity.id)) {
              // Check how many query words match the name
              const nameWords = entity.name.toLowerCase();
              const matchCount = queryWords.filter(w => nameWords.includes(w)).length;
              const relevance = 0.5 + (matchCount * 0.2); // Higher relevance for more matches

              sources.unshift({ // Add to front since these are direct matches
                id: entity.id,
                type: 'entity',
                name: entity.name,
                entityType: entity.entity_type,
                relevance: Math.min(relevance, 1.0),
                snippet: entity.summary || entity.description?.slice(0, 150),
              });

              // Also add to semanticResults so it appears in the knowledge base
              semanticResults.unshift({
                id: entity.id,
                entity_type: entity.entity_type,
                entity_name: entity.name,
                content: entity.summary || entity.description || '',
                similarity: relevance,
              });
            }
          });
        }
      } catch (error) {
        console.error('[Copilot] Keyword search failed:', error);
      }
    }

    // TYPE-BASED SEARCH - if query mentions an entity type, fetch all of that type
    const typeKeywords: Record<string, string> = {
      'faction': 'faction',
      'factions': 'faction',
      'npc': 'npc',
      'npcs': 'npc',
      'character': 'npc',
      'characters': 'npc',
      'location': 'location',
      'locations': 'location',
      'place': 'location',
      'places': 'location',
      'item': 'item',
      'items': 'item',
      'quest': 'quest',
      'quests': 'quest',
      'creature': 'creature',
      'creatures': 'creature',
      'monster': 'creature',
      'monsters': 'creature',
    };

    const queryLowerForType = query.toLowerCase();
    for (const [keyword, entityType] of Object.entries(typeKeywords)) {
      if (queryLowerForType.includes(keyword)) {
        try {
          const { data: typeMatches } = await this.supabase
            .from('entities')
            .select('id, name, entity_type, summary, description')
            .eq('campaign_id', campaignId)
            .eq('entity_type', entityType)
            .is('deleted_at', null)
            .limit(10);

          if (typeMatches && typeMatches.length > 0) {
            console.log(`[Copilot] Type search found ${typeMatches.length} ${entityType}s`);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeMatches.forEach((entity: any) => {
              if (!sources.some(s => s.id === entity.id)) {
                sources.unshift({
                  id: entity.id,
                  type: 'entity',
                  name: entity.name,
                  entityType: entity.entity_type,
                  relevance: 0.85,
                  snippet: entity.summary || entity.description?.slice(0, 150) || '',
                });

                semanticResults.unshift({
                  id: entity.id,
                  entity_name: entity.name,
                  entity_type: entity.entity_type,
                  content: entity.summary || entity.description || '',
                  similarity: 0.85,
                });
              }
            });
          }
        } catch (error) {
          console.error(`[Copilot] Type search failed for ${entityType}:`, error);
        }
        break; // Only match one type per query
      }
    }

    // Get active story threads
    const { data: threads } = await this.supabase
      .from('story_threads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(10);

    (threads as StoryThread[] | null)?.forEach((t) => {
      sources.push({
        id: t.id,
        type: 'thread',
        name: t.title,
        relevance: t.priority === 'critical' ? 1 : t.priority === 'high' ? 0.8 : 0.6,
        snippet: t.consequence_if_ignored || undefined,
      });
    });

    // Get key NPCs (for relationship questions)
    const { data: npcs } = await this.supabase
      .from('entities')
      .select('id, name, summary, brain, soul, entity_type')
      .eq('campaign_id', campaignId)
      .in('entity_type', ['npc', 'faction'])
      .is('deleted_at', null)
      .limit(20);

    (npcs as Entity[] | null)?.forEach((n) => {
      if (!sources.find((s) => s.id === n.id)) {
        sources.push({
          id: n.id,
          type: 'entity',
          name: n.name,
          entityType: n.entity_type,
          relevance: 0.5,
          snippet: n.summary || undefined,
        });
      }
    });

    return {
      campaign,
      codex: (campaign?.codex as Record<string, unknown>) || {},
      party,
      semanticResults,
      threads: (threads as StoryThread[]) || [],
      sources,
    };
  }

  private buildSystemPrompt(context: GatheredContext): string {
    const { campaign, codex, party, semanticResults, threads } = context;

    // Format party info
    const partyInfo =
      party.length > 0
        ? party
            .map((c) => {
              const soul = (c.soul || {}) as Record<string, unknown>;
              return `- ${c.name}: Level ${soul.level || 1} ${soul.class || 'Unknown'}`;
            })
            .join('\n')
        : 'No party members registered.';

    // Format semantic results (most relevant campaign knowledge)
    const knowledgeBase =
      semanticResults.length > 0
        ? semanticResults
            .slice(0, 10)
            .map((r) => {
              return `[${r.entity_type || 'entity'}] ${r.entity_name}: ${r.content?.slice(0, 300)}`;
            })
            .join('\n\n')
        : 'No specific campaign knowledge found for this query.';

    // Format threads
    const threadInfo =
      threads.length > 0
        ? threads
            .map((t) => {
              const clockInfo = t.clock_max ? ` (Clock: ${t.clock_current}/${t.clock_max})` : '';
              return `- ${t.title}${clockInfo}: ${t.consequence_if_ignored || 'No consequence defined'}`;
            })
            .join('\n')
        : 'No active story threads.';

    return `
You are Ally, the AI assistant for a D&D 5e campaign called "${campaign?.name || 'Unknown Campaign'}".

Your role is to help the Dungeon Master by:
- Answering questions about their campaign world, NPCs, factions, and history
- Suggesting plot developments and connections
- Identifying potential story hooks and consequences
- Helping track relationships and motivations

## Campaign Tone & Setting
${codex.tone ? `Tone: ${codex.tone}` : 'No tone defined.'}
${codex.setting ? `Setting: ${codex.setting}` : ''}
${Array.isArray(codex.themes) && codex.themes.length ? `Themes: ${codex.themes.join(', ')}` : ''}

## Party Members
${partyInfo}

## Active Story Threads
${threadInfo}

## Campaign Knowledge Base
The following is relevant information from the campaign database:

${knowledgeBase}

## Instructions
1. Answer questions using ONLY the campaign information provided above.
2. If you don't have enough information, say so honestly.
3. When mentioning NPCs, factions, or locations, reference them by name.
4. Suggest connections between entities when relevant.
5. For "what if" questions, base predictions on established character motivations and world rules.
6. Keep responses concise but informative.
7. If asked about game mechanics, you can reference D&D 5e rules.
8. When discussing story threads, mention their clock status if relevant.

Remember: You're a helpful ally, not the DM. Offer suggestions and insights, but let the DM make final decisions.
    `.trim();
  }

  private generateFollowUps(query: string, context: GatheredContext): string[] {
    const followUps: string[] = [];
    const queryLower = query.toLowerCase();

    // Based on query type, suggest relevant follow-ups
    if (queryLower.includes('npc') || queryLower.includes('who')) {
      followUps.push('What are their secrets or hidden motivations?');
      followUps.push('Who are their allies and enemies?');
    }

    if (queryLower.includes('faction') || queryLower.includes('guild')) {
      followUps.push('What are their current goals?');
      followUps.push('How do they feel about the party?');
    }

    if (queryLower.includes('what if') || queryLower.includes('ignore')) {
      followUps.push('How can the party prevent this?');
      followUps.push('Who benefits from this outcome?');
    }

    if (queryLower.includes('betray') || queryLower.includes('trust')) {
      followUps.push('What would make them loyal instead?');
      followUps.push('Who else knows about this?');
    }

    // Add thread-based suggestions
    if (context.threads?.length > 0) {
      const urgentThread = context.threads.find(
        (t) =>
          t.priority === 'critical' ||
          (t.clock_max && (t.clock_current || 0) >= t.clock_max * 0.75)
      );
      if (urgentThread) {
        followUps.push(`What happens when "${urgentThread.title}" triggers?`);
      }
    }

    return followUps.slice(0, 3);
  }
}

// Export singleton
export const copilotService = new CopilotService();
