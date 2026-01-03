import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embedding';
import { getProfile } from './profiles';
import { allocateBudget, estimateTokens, summarizeUsage } from './budgeter';
import {
  ContextEngineOptions,
  AssembledContext,
  LayerResult,
  ContextSourceReference,
  StoryThreadContext,
} from './types';

interface CampaignMember {
  character_entity_id: string;
  entities: {
    id: string;
    name: string;
    soul: Record<string, unknown> | null;
  };
}

interface FactionReputation {
  reputation_level: string;
  entities: { name: string } | null;
}

interface EntityRelationship {
  relationship_type: string;
  description: string | null;
  source: { id: string; name: string; entity_type: string } | null;
  target: { id: string; name: string; entity_type: string } | null;
}

interface SessionEvent {
  content: string;
  event_type: string;
}

interface Faction {
  id: string;
  name: string;
  summary: string | null;
  soul: Record<string, unknown> | null;
}

interface StoryThread {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  clock_current: number | null;
  clock_max: number | null;
  consequence_if_ignored: string | null;
}

interface SemanticResult {
  id: string;
  entity_type: string;
  entity_name: string;
  content: string;
  similarity: number;
}

export class ContextEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;
  private options!: ContextEngineOptions;

  /**
   * Main entry point: Assemble context for a Forge
   */
  async assembleContext(options: ContextEngineOptions): Promise<AssembledContext> {
    this.options = options;
    this.supabase = await createClient();

    const { campaignId, query, profile: profileName } = options;
    const profile = getProfile(profileName);

    console.log(`[ContextEngine] Assembling for ${profileName} forge`);
    console.log(`[ContextEngine] Query: "${query}"`);
    console.log(`[ContextEngine] Budget: ${profile.tokenBudget} tokens`);

    // Gather all context layers in parallel
    const [
      codexResult,
      partyResult,
      sessionResult,
      historyResult,
      threadsResult,
      factionsResult,
      relationshipsResult,
    ] = await Promise.all([
      this.getCodexLayer(campaignId),
      this.getPartyLayer(campaignId),
      this.getSessionLayer(campaignId),
      this.getHistoryLayer(campaignId, query),
      this.getThreadsLayer(campaignId),
      this.getFactionsLayer(campaignId),
      this.getRelationshipsLayer(campaignId, options.includeEntityIds),
    ]);

    // Collect all layers
    const allLayers: LayerResult[] = [
      codexResult,
      partyResult,
      sessionResult,
      historyResult,
      threadsResult,
      factionsResult,
      relationshipsResult,
    ].filter((l) => l.content && l.tokens > 0);

    // Budget and prioritize based on profile
    const allocatedLayers = allocateBudget(allLayers, profile);

    // Format the final prompt
    const promptText = this.formatPrompt(allocatedLayers, profileName);

    // Collect all sources for debug
    const allSources = allocatedLayers.flatMap((l) => l.sources);

    // Extract thread info
    const activeThreads: StoryThreadContext[] =
      (threadsResult.metadata?.threads as StoryThreadContext[]) || [];

    // Generate warnings and hooks
    const warnings = this.generateWarnings(partyResult, threadsResult);
    const suggestedHooks = this.generateHooks(historyResult, threadsResult);

    // Summarize token usage
    const tokenUsage = summarizeUsage(allocatedLayers, profile.tokenBudget);

    console.log(
      `[ContextEngine] Assembled ${tokenUsage.total}/${tokenUsage.budget} tokens (${tokenUsage.utilizationPercent}%)`
    );

    return {
      promptText,
      tokenUsage,
      sources: allSources,
      activeThreads,
      warnings,
      suggestedHooks,
      profile: profileName,
    };
  }

  // ==========================================
  // LAYER FETCHERS
  // ==========================================

  private async getCodexLayer(campaignId: string): Promise<LayerResult> {
    const { data: campaign } = await this.supabase
      .from('campaigns')
      .select('name, codex')
      .eq('id', campaignId)
      .single();

    if (!campaign?.codex) {
      return { layer: 'codex', content: '', tokens: 0, sources: [] };
    }

    const codex = campaign.codex as Record<string, unknown>;
    const sections = [
      `Campaign: ${campaign.name}`,
      codex.tone && `Tone: ${codex.tone}`,
      codex.setting && `Setting: ${codex.setting}`,
      Array.isArray(codex.themes) && codex.themes.length && `Themes: ${codex.themes.join(', ')}`,
      codex.premise && `Premise: ${codex.premise}`,
      codex.rules && `House Rules: ${codex.rules}`,
    ].filter(Boolean);

    const content = sections.join('\n');

    return {
      layer: 'codex',
      content,
      tokens: estimateTokens(content),
      sources: [{ id: campaignId, type: 'codex', name: 'Campaign Codex', relevance: 1 }],
    };
  }

  private async getPartyLayer(campaignId: string): Promise<LayerResult> {
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

    const characters =
      (members as CampaignMember[] | null)?.map((m) => m.entities).filter(Boolean) || [];

    if (characters.length === 0) {
      return { layer: 'party', content: '', tokens: 0, sources: [], metadata: {} };
    }

    // Calculate party stats
    const composition = characters
      .map((c) => {
        const soul = (c.soul || {}) as Record<string, unknown>;
        return `${c.name} (Lvl ${soul.level || 1} ${soul.class || 'Unknown'})`;
      })
      .join(', ');

    const avgLevel =
      characters.reduce((sum: number, c) => {
        const soul = (c.soul || {}) as Record<string, unknown>;
        return sum + ((soul.level as number) || 1);
      }, 0) / characters.length;

    const totalHP = characters.reduce((sum: number, c) => {
      const soul = (c.soul || {}) as Record<string, unknown>;
      return sum + ((soul.current_hp as number) || 0);
    }, 0);

    const maxHP = characters.reduce((sum: number, c) => {
      const soul = (c.soul || {}) as Record<string, unknown>;
      return sum + ((soul.max_hp as number) || 0);
    }, 0);

    // Find weakest save
    const saves = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const avgSaves = saves
      .map((save) => {
        const avg =
          characters.reduce((sum: number, c) => {
            const soul = (c.soul || {}) as Record<string, unknown>;
            const scores = (soul.ability_scores || {}) as Record<string, number>;
            const score = scores[save] || 10;
            return sum + Math.floor((score - 10) / 2);
          }, 0) / characters.length;
        return { save, avg };
      })
      .sort((a, b) => a.avg - b.avg);

    const weakestSave = avgSaves[0];
    const strongestSave = avgSaves[avgSaves.length - 1];

    // Get faction reputation
    const { data: reputations } = await this.supabase
      .from('faction_reputation')
      .select('reputation_level, entities:faction_id (name)')
      .eq('campaign_id', campaignId);

    const repSummary = (reputations as FactionReputation[] | null)?.length
      ? (reputations as FactionReputation[])
          .map((r) => `${r.entities?.name}: ${r.reputation_level}`)
          .join(', ')
      : 'No faction standings';

    const content = `
Party: ${composition}
Average Level: ${avgLevel.toFixed(1)}
Resources: ${totalHP}/${maxHP} HP
Weakest Save: ${weakestSave.save.toUpperCase()} (${weakestSave.avg >= 0 ? '+' : ''}${weakestSave.avg.toFixed(1)})
Strongest Save: ${strongestSave.save.toUpperCase()} (${strongestSave.avg >= 0 ? '+' : ''}${strongestSave.avg.toFixed(1)})
Faction Standing: ${repSummary}
    `.trim();

    return {
      layer: 'party',
      content,
      tokens: estimateTokens(content),
      sources: characters.map((c) => ({
        id: c.id,
        type: 'entity' as const,
        name: c.name,
        entityType: 'player',
        relevance: 1,
      })),
      metadata: { weakestSave: weakestSave.save, avgLevel },
    };
  }

  private async getSessionLayer(campaignId: string): Promise<LayerResult> {
    const sessionId = this.options.currentSessionId;

    // Get most recent or specified session
    let query = this.supabase
      .from('sessions')
      .select('id, title, status, current_location')
      .eq('campaign_id', campaignId);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else {
      query = query.order('session_date', { ascending: false }).limit(1);
    }

    const { data: session } = await query.single();

    if (!session) {
      return { layer: 'session', content: '', tokens: 0, sources: [] };
    }

    // Get recent events
    const { data: events } = await this.supabase
      .from('session_events')
      .select('content, event_type')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentEvents =
      (events as SessionEvent[] | null)?.map((e) => `- ${e.content}`).join('\n') ||
      'No recent events';

    const content = `
Current Session: ${session.title || 'Unnamed'}
Status: ${session.status}
Recent Events:
${recentEvents}
    `.trim();

    return {
      layer: 'session',
      content,
      tokens: estimateTokens(content),
      sources: [
        {
          id: session.id,
          type: 'session_event',
          name: session.title || 'Current Session',
          relevance: 1,
        },
      ],
    };
  }

  private async getHistoryLayer(campaignId: string, query: string): Promise<LayerResult> {
    if (!query || query.length < 3) {
      return { layer: 'history', content: '', tokens: 0, sources: [] };
    }

    try {
      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);

      // Search entities using the semantic search RPC
      const { data: results, error } = await this.supabase.rpc('match_campaign_context', {
        query_embedding: embedding,
        match_threshold: this.options.semanticThreshold || 0.5,
        match_count: this.options.maxSemanticResults || 8,
        p_campaign_id: campaignId,
      });

      if (error || !results?.length) {
        console.log('[ContextEngine] No semantic results found');
        return { layer: 'history', content: '', tokens: 0, sources: [] };
      }

      console.log(`[ContextEngine] Found ${results.length} semantic matches`);

      // Format results
      const content = (results as SemanticResult[])
        .map(
          (r) => `- [${r.entity_type || 'entity'}] ${r.entity_name}: ${r.content?.slice(0, 200)}...`
        )
        .join('\n');

      const sources: ContextSourceReference[] = (results as SemanticResult[]).map((r) => ({
        id: r.id,
        type: 'entity' as const,
        name: r.entity_name || 'Unknown',
        entityType: r.entity_type,
        relevance: r.similarity,
      }));

      return {
        layer: 'history',
        content: `Relevant Campaign History:\n${content}`,
        tokens: estimateTokens(content),
        sources,
      };
    } catch (error) {
      console.error('[ContextEngine] Semantic search failed:', error);
      return { layer: 'history', content: '', tokens: 0, sources: [] };
    }
  }

  private async getThreadsLayer(campaignId: string): Promise<LayerResult> {
    const { data: threads } = await this.supabase
      .from('story_threads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(10);

    if (!threads?.length) {
      return { layer: 'threads', content: '', tokens: 0, sources: [], metadata: { threads: [] } };
    }

    // Format threads with urgency
    const formattedThreads: StoryThreadContext[] = (threads as StoryThread[]).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      priority: t.priority,
      clockProgress: t.clock_max ? Math.round(((t.clock_current || 0) / t.clock_max) * 100) : undefined,
      consequence: t.consequence_if_ignored || undefined,
      isUrgent:
        t.priority === 'critical' ||
        (t.clock_max !== null && ((t.clock_current || 0) / t.clock_max) >= 0.75),
    }));

    const urgentThreads = formattedThreads.filter((t) => t.isUrgent);
    const otherThreads = formattedThreads.filter((t) => !t.isUrgent).slice(0, 3);

    const threadLines = [...urgentThreads, ...otherThreads].map((t) => {
      const urgentTag = t.isUrgent ? '🔴 URGENT: ' : '';
      const clockInfo = t.clockProgress !== undefined ? ` [${t.clockProgress}% to consequence]` : '';
      return `- ${urgentTag}${t.title}${clockInfo}${t.consequence ? ` → ${t.consequence}` : ''}`;
    });

    const content =
      threadLines.length > 0 ? `Active Story Threads:\n${threadLines.join('\n')}` : '';

    return {
      layer: 'threads',
      content,
      tokens: estimateTokens(content),
      sources: formattedThreads.map((t) => ({
        id: t.id,
        type: 'thread' as const,
        name: t.title,
        relevance: t.isUrgent ? 1 : 0.7,
      })),
      metadata: { threads: formattedThreads },
    };
  }

  private async getFactionsLayer(campaignId: string): Promise<LayerResult> {
    const { data: factions } = await this.supabase
      .from('entities')
      .select('id, name, summary, soul')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'faction')
      .is('deleted_at', null)
      .limit(10);

    if (!factions?.length) {
      return { layer: 'factions', content: '', tokens: 0, sources: [] };
    }

    const factionLines = (factions as Faction[]).map((f) => {
      const soul = (f.soul || {}) as Record<string, unknown>;
      const goals = (soul.goals || soul.purpose || '') as string;
      return `- ${f.name}: ${f.summary || ''}${goals ? ` (Goals: ${goals})` : ''}`;
    });

    const content = `Campaign Factions:\n${factionLines.join('\n')}`;

    return {
      layer: 'factions',
      content,
      tokens: estimateTokens(content),
      sources: (factions as Faction[]).map((f) => ({
        id: f.id,
        type: 'entity' as const,
        name: f.name,
        entityType: 'faction',
        relevance: 0.8,
      })),
    };
  }

  private async getRelationshipsLayer(
    campaignId: string,
    entityIds?: string[]
  ): Promise<LayerResult> {
    if (!entityIds?.length) {
      return { layer: 'relationships', content: '', tokens: 0, sources: [] };
    }

    const { data: relationships } = await this.supabase
      .from('entity_relationships')
      .select(
        `
        relationship_type,
        description,
        source:source_entity_id (id, name, entity_type),
        target:target_entity_id (id, name, entity_type)
      `
      )
      .eq('campaign_id', campaignId)
      .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`)
      .limit(15);

    if (!relationships?.length) {
      return { layer: 'relationships', content: '', tokens: 0, sources: [] };
    }

    const relLines = (relationships as EntityRelationship[]).map(
      (r) =>
        `- ${r.source?.name} → ${r.target?.name}: ${r.relationship_type}${r.description ? ` (${r.description})` : ''}`
    );

    const content = `Entity Relationships:\n${relLines.join('\n')}`;

    const sources: ContextSourceReference[] = [];
    (relationships as EntityRelationship[]).forEach((r) => {
      if (r.source)
        sources.push({
          id: r.source.id,
          type: 'entity',
          name: r.source.name,
          entityType: r.source.entity_type,
          relevance: 0.6,
        });
      if (r.target)
        sources.push({
          id: r.target.id,
          type: 'entity',
          name: r.target.name,
          entityType: r.target.entity_type,
          relevance: 0.6,
        });
    });

    return {
      layer: 'relationships',
      content,
      tokens: estimateTokens(content),
      sources,
    };
  }

  // ==========================================
  // FORMATTING & HELPERS
  // ==========================================

  private formatPrompt(layers: LayerResult[], profile: string): string {
    const sections = layers
      .filter((l) => l.content)
      .map((l) => l.content)
      .join('\n\n');

    return `
## CAMPAIGN CONTEXT
*Automatically assembled from campaign data for ${profile} generation.*

${sections}

---
*Use this context to make the generated content feel connected to the campaign world. Reference specific entities, events, and plot threads where appropriate.*
    `.trim();
  }

  private generateWarnings(partyResult: LayerResult, threadsResult: LayerResult): string[] {
    const warnings: string[] = [];

    // Party warnings
    if (partyResult.metadata?.weakestSave) {
      warnings.push(
        `Party is vulnerable to ${(partyResult.metadata.weakestSave as string).toUpperCase()} saves`
      );
    }

    // Thread warnings
    const threads = (threadsResult.metadata?.threads || []) as StoryThreadContext[];
    threads.forEach((t) => {
      if (t.isUrgent && t.clockProgress !== undefined) {
        warnings.push(`"${t.title}" is ${t.clockProgress}% to consequence!`);
      }
    });

    return warnings;
  }

  private generateHooks(historyResult: LayerResult, threadsResult: LayerResult): string[] {
    const hooks: string[] = [];

    // Suggest bringing back entities from semantic search
    historyResult.sources.slice(0, 2).forEach((s) => {
      if (s.relevance > 0.7) {
        hooks.push(`Consider involving "${s.name}" (${s.entityType}) - high relevance to query`);
      }
    });

    // Suggest thread advancement
    const threads = (threadsResult.metadata?.threads || []) as StoryThreadContext[];
    const urgentThread = threads.find((t) => t.isUrgent);
    if (urgentThread) {
      hooks.push(`Opportunity to advance "${urgentThread.title}" thread`);
    }

    return hooks;
  }
}

// Export convenient function
export async function assembleForgeContext(
  options: ContextEngineOptions
): Promise<AssembledContext> {
  const engine = new ContextEngine();
  return engine.assembleContext(options);
}
