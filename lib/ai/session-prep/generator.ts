import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import {
  PrepSuggestion,
  SessionPrepReport,
  PrepGeneratorOptions,
  SuggestionPriority,
} from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StoryThread {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  clock_type: string | null;
  clock_current: number | null;
  clock_max: number | null;
  consequence_if_ignored: string | null;
}

interface SessionWithEvents {
  id: string;
  title: string | null;
  status: string;
  session_date: string | null;
  summary: string | null;
  session_events: Array<{
    id: string;
    content: string;
    event_type: string;
    created_at: string;
  }>;
}

interface Entity {
  id: string;
  name: string;
  summary: string | null;
  brain: Record<string, unknown> | null;
  soul: Record<string, unknown> | null;
  entity_type?: string;
}

interface CampaignMember {
  character_entity_id: string;
  entities: {
    id: string;
    name: string;
    soul: Record<string, unknown> | null;
  };
}

interface PartyStatus {
  characters: Array<{ id: string; name: string; soul: Record<string, unknown> | null }>;
  healthPercent: number;
  avgLevel: number;
  warnings: string[];
}

interface Campaign {
  id: string;
  name: string;
  codex: Record<string, unknown> | null;
  party_gold: number | null;
}

export class SessionPrepGenerator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;

  async generatePrepReport(options: PrepGeneratorOptions): Promise<SessionPrepReport> {
    this.supabase = await createClient();
    const { campaignId } = options;

    console.log(`[SessionPrep] Generating prep report for campaign ${campaignId}`);

    // Gather all relevant data in parallel
    const [campaign, party, threads, recentSessions, npcs, factions] = await Promise.all([
      this.getCampaign(campaignId),
      this.getPartyStatus(campaignId),
      this.getActiveThreads(campaignId),
      this.getRecentSessions(campaignId),
      this.getRelevantNPCs(campaignId, options.plannedLocationId),
      this.getFactions(campaignId),
    ]);

    const suggestions: PrepSuggestion[] = [];

    // Generate suggestions from different sources
    suggestions.push(...this.generateThreadSuggestions(threads));
    suggestions.push(...this.generatePartySuggestions(party));
    suggestions.push(...this.generateNpcSuggestions(npcs));
    suggestions.push(...this.generateFactionSuggestions(factions));
    suggestions.push(...this.generateCallbackSuggestions(recentSessions));

    // Sort by priority
    const priorityOrder: Record<SuggestionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Generate AI content if requested
    let recap: string | undefined;
    let openingScene: string | undefined;

    if (options.includeRecap && recentSessions.length > 0) {
      recap = await this.generateRecap(campaign, recentSessions[0]);
    }

    if (options.includeOpeningScene) {
      openingScene = await this.generateOpeningScene(campaign, suggestions, party);
    }

    // Build report
    const report: SessionPrepReport = {
      campaignId,
      sessionNumber: recentSessions.length + 1,
      generatedAt: new Date(),
      critical: suggestions.filter((s) => s.priority === 'critical'),
      high: suggestions.filter((s) => s.priority === 'high'),
      medium: suggestions.filter((s) => s.priority === 'medium'),
      low: suggestions.filter((s) => s.priority === 'low'),
      stats: {
        totalSuggestions: suggestions.length,
        urgentThreads: threads.filter((t) => this.isThreadUrgent(t)).length,
        activeNpcs: npcs.length,
        partyHealthPercent: party.healthPercent,
        daysUntilNextDeadline: this.getNextDeadline(threads),
      },
      recap,
      openingScene,
    };

    console.log(`[SessionPrep] Generated ${suggestions.length} suggestions`);
    return report;
  }

  // ==========================================
  // DATA FETCHERS
  // ==========================================

  private async getCampaign(campaignId: string): Promise<Campaign | null> {
    const { data } = await this.supabase
      .from('campaigns')
      .select('id, name, codex, party_gold')
      .eq('id', campaignId)
      .single();
    return data;
  }

  private async getPartyStatus(campaignId: string): Promise<PartyStatus> {
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
      return { characters: [], healthPercent: 100, avgLevel: 1, warnings: [] };
    }

    const totalHP = characters.reduce((sum: number, c) => {
      const soul = (c.soul || {}) as Record<string, unknown>;
      return sum + ((soul.current_hp as number) || 0);
    }, 0);

    const maxHP = characters.reduce((sum: number, c) => {
      const soul = (c.soul || {}) as Record<string, unknown>;
      return sum + ((soul.max_hp as number) || 1);
    }, 0);

    const avgLevel =
      characters.reduce((sum: number, c) => {
        const soul = (c.soul || {}) as Record<string, unknown>;
        return sum + ((soul.level as number) || 1);
      }, 0) / characters.length;

    const healthPercent = Math.round((totalHP / maxHP) * 100);

    // Generate warnings
    const warnings: string[] = [];
    if (healthPercent < 50) warnings.push('Party HP is below 50%');
    if (healthPercent < 25) warnings.push('Party HP is critical!');

    // Check for exhaustion, spell slots, etc.
    characters.forEach((c) => {
      const soul = (c.soul || {}) as Record<string, unknown>;
      if (soul.exhaustion && (soul.exhaustion as number) > 0) {
        warnings.push(`${c.name} has ${soul.exhaustion} exhaustion`);
      }
    });

    return { characters, healthPercent, avgLevel, warnings };
  }

  private async getActiveThreads(campaignId: string): Promise<StoryThread[]> {
    const { data } = await this.supabase
      .from('story_threads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('priority', { ascending: true });
    return (data as StoryThread[]) || [];
  }

  private async getRecentSessions(campaignId: string): Promise<SessionWithEvents[]> {
    const { data } = await this.supabase
      .from('sessions')
      .select(
        `
        id, title, status, session_date, summary,
        session_events (id, content, event_type, created_at)
      `
      )
      .eq('campaign_id', campaignId)
      .order('session_date', { ascending: false })
      .limit(3);
    return (data as SessionWithEvents[]) || [];
  }

  private async getRelevantNPCs(campaignId: string, _locationId?: string): Promise<Entity[]> {
    const query = this.supabase
      .from('entities')
      .select('id, name, summary, brain, soul, entity_type')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'npc')
      .is('deleted_at', null)
      .limit(20);

    const { data } = await query;
    return (data as Entity[]) || [];
  }

  private async getFactions(campaignId: string): Promise<Entity[]> {
    const { data } = await this.supabase
      .from('entities')
      .select('id, name, summary, brain, soul')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'faction')
      .is('deleted_at', null);
    return (data as Entity[]) || [];
  }

  // ==========================================
  // SUGGESTION GENERATORS
  // ==========================================

  private generateThreadSuggestions(threads: StoryThread[]): PrepSuggestion[] {
    const suggestions: PrepSuggestion[] = [];

    threads.forEach((thread) => {
      const isUrgent = this.isThreadUrgent(thread);
      const clockPercent = thread.clock_max
        ? Math.round(((thread.clock_current || 0) / thread.clock_max) * 100)
        : null;

      if (isUrgent) {
        suggestions.push({
          id: `thread-urgent-${thread.id}`,
          type: 'urgent_thread',
          priority: 'critical',
          title: `⏰ ${thread.title} - IMMINENT!`,
          description: thread.consequence_if_ignored || 'Consequence will trigger!',
          source: { type: 'thread', id: thread.id, name: thread.title },
          details: {
            mechanics: `Clock: ${thread.clock_current}/${thread.clock_max} (${clockPercent}%)`,
          },
          dmNotes: `This thread will trigger soon. Consider: 1) Let it happen for drama, 2) Give party a last chance to address it, 3) Have an NPC warn them.`,
        });
      } else if (clockPercent && clockPercent >= 50) {
        suggestions.push({
          id: `thread-warning-${thread.id}`,
          type: 'urgent_thread',
          priority: 'high',
          title: `📜 ${thread.title} - Halfway`,
          description: `Clock at ${clockPercent}%. ${thread.description || ''}`,
          source: { type: 'thread', id: thread.id, name: thread.title },
          dmNotes: `Good time to remind players this exists through in-world hints.`,
        });
      } else if (thread.priority === 'high' || thread.priority === 'critical') {
        suggestions.push({
          id: `thread-active-${thread.id}`,
          type: 'unresolved_hook',
          priority: 'medium',
          title: thread.title,
          description: thread.description || 'Active story thread',
          source: { type: 'thread', id: thread.id, name: thread.title },
        });
      }
    });

    return suggestions;
  }

  private generatePartySuggestions(party: PartyStatus): PrepSuggestion[] {
    const suggestions: PrepSuggestion[] = [];

    if (party.healthPercent < 25) {
      suggestions.push({
        id: 'party-health-critical',
        type: 'party_status',
        priority: 'critical',
        title: '🩸 Party Health Critical',
        description: `Party is at ${party.healthPercent}% HP. Consider rest opportunity or reduce combat difficulty.`,
        source: { type: 'party' },
        dmNotes:
          'Start with social encounter or exploration. Provide healing potions or safe rest opportunity.',
      });
    } else if (party.healthPercent < 50) {
      suggestions.push({
        id: 'party-health-low',
        type: 'party_status',
        priority: 'high',
        title: '⚠️ Party Resources Low',
        description: `Party is at ${party.healthPercent}% HP. Be mindful of encounter difficulty.`,
        source: { type: 'party' },
      });
    }

    party.warnings?.forEach((warning: string, i: number) => {
      suggestions.push({
        id: `party-warning-${i}`,
        type: 'party_status',
        priority: 'medium',
        title: warning,
        description: 'Party member has a condition to track.',
        source: { type: 'party' },
      });
    });

    return suggestions;
  }

  private generateNpcSuggestions(npcs: Entity[]): PrepSuggestion[] {
    const suggestions: PrepSuggestion[] = [];

    // Find NPCs with secrets or unfinished business
    npcs.forEach((npc) => {
      const brain = (npc.brain || {}) as Record<string, unknown>;

      // NPCs with secrets the party doesn't know
      if (brain.secret && !brain.secretRevealed) {
        suggestions.push({
          id: `npc-secret-${npc.id}`,
          type: 'callback',
          priority: 'medium',
          title: `🤫 ${npc.name} has a secret`,
          description: `Secret: ${brain.secret}`,
          source: { type: 'entity', id: npc.id, name: npc.name },
          dmNotes: 'Consider revealing through: investigation, slip of tongue, or third party.',
        });
      }

      // NPCs with goals that conflict with party
      if (brain.goals && brain.attitude === 'hostile') {
        suggestions.push({
          id: `npc-hostile-${npc.id}`,
          type: 'faction_movement',
          priority: 'high',
          title: `⚔️ ${npc.name} is working against the party`,
          description: `Goals: ${brain.goals}`,
          source: { type: 'entity', id: npc.id, name: npc.name },
        });
      }
    });

    return suggestions;
  }

  private generateFactionSuggestions(factions: Entity[]): PrepSuggestion[] {
    const suggestions: PrepSuggestion[] = [];

    factions.forEach((faction) => {
      const brain = (faction.brain || {}) as Record<string, unknown>;
      const soul = (faction.soul || {}) as Record<string, unknown>;

      // Factions with active plans
      if (brain.currentPlan || soul.currentObjective) {
        suggestions.push({
          id: `faction-plan-${faction.id}`,
          type: 'faction_movement',
          priority: 'medium',
          title: `🏛️ ${faction.name} is making moves`,
          description:
            (brain.currentPlan as string) ||
            (soul.currentObjective as string) ||
            'Faction is active',
          source: { type: 'entity', id: faction.id, name: faction.name },
          dmNotes: 'Consider having party witness or hear rumors about faction activity.',
        });
      }
    });

    return suggestions;
  }

  private generateCallbackSuggestions(recentSessions: SessionWithEvents[]): PrepSuggestion[] {
    const suggestions: PrepSuggestion[] = [];

    if (recentSessions.length === 0) return suggestions;

    // Look for memorable events from recent sessions
    const lastSession = recentSessions[0];
    const events = lastSession.session_events || [];

    // Find combat events, roleplay moments, discoveries
    const significantEvents = events.filter((e) =>
      ['combat_end', 'discovery', 'roleplay', 'decision'].includes(e.event_type)
    );

    if (significantEvents.length > 0) {
      const eventDescriptions = significantEvents
        .slice(0, 3)
        .map((e) => e.content)
        .join('; ');

      suggestions.push({
        id: 'callback-last-session',
        type: 'callback',
        priority: 'low',
        title: '📖 Last Session Highlights',
        description: eventDescriptions,
        source: { type: 'session', id: lastSession.id, name: lastSession.title || undefined },
        dmNotes: 'Reference these events in NPC dialogue or world reactions.',
      });
    }

    return suggestions;
  }

  // ==========================================
  // AI-GENERATED CONTENT
  // ==========================================

  private async generateRecap(
    campaign: Campaign | null,
    lastSession: SessionWithEvents
  ): Promise<string> {
    if (!lastSession) return '';

    const events = lastSession.session_events || [];
    const eventList = events.map((e) => `- ${e.content}`).join('\n');

    const prompt = `
Generate a dramatic "Previously on ${campaign?.name || 'the campaign'}..." recap for players.
Keep it under 150 words. Make it exciting and end on a hook.

Last session: ${lastSession.title || 'Unnamed session'}
Events:
${eventList || 'No events logged'}

Summary: ${lastSession.summary || 'No summary available'}
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a dramatic narrator for a D&D campaign. Write engaging recaps.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[SessionPrep] Recap generation failed:', error);
      return '';
    }
  }

  private async generateOpeningScene(
    campaign: Campaign | null,
    suggestions: PrepSuggestion[],
    party: PartyStatus
  ): Promise<string> {
    const urgentSuggestions = suggestions
      .filter((s) => s.priority === 'critical' || s.priority === 'high')
      .slice(0, 3)
      .map((s) => s.title)
      .join(', ');

    const codex = (campaign?.codex || {}) as Record<string, unknown>;

    const prompt = `
Generate an opening scene description for a D&D session.
Campaign: ${campaign?.name || 'Unknown'}
Tone: ${codex.tone || 'heroic fantasy'}
Party status: ${party.healthPercent}% HP

Key elements to potentially incorporate: ${urgentSuggestions || 'Normal session start'}

Write 2-3 sentences of read-aloud text to set the scene. Be atmospheric.
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a D&D Dungeon Master writing atmospheric scene descriptions.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[SessionPrep] Opening scene generation failed:', error);
      return '';
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private isThreadUrgent(thread: StoryThread): boolean {
    if (thread.priority === 'critical') return true;
    if (!thread.clock_max) return false;
    return ((thread.clock_current || 0) / thread.clock_max) >= 0.75;
  }

  private getNextDeadline(threads: StoryThread[]): number | undefined {
    const threadWithClock = threads
      .filter((t) => t.clock_type === 'days' && t.clock_max)
      .sort(
        (a, b) =>
          (a.clock_max! - (a.clock_current || 0)) - (b.clock_max! - (b.clock_current || 0))
      )[0];

    if (threadWithClock) {
      return threadWithClock.clock_max! - (threadWithClock.clock_current || 0);
    }
    return undefined;
  }
}

export const sessionPrepGenerator = new SessionPrepGenerator();
