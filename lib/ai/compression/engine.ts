/**
 * CompressionEngine
 * Generates rolling summaries for sessions, arcs, and campaigns
 */

import OpenAI from 'openai';
import {
  SessionSummary,
  ArcSummary,
  CampaignBrief,
  EntityHistory,
  SessionCompressionInput,
  ArcCompressionInput,
  BriefCompressionInput,
  EntityHistoryInput,
  CompressionResponse,
} from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class CompressionEngine {
  private campaignId: string;

  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  /**
   * Compress a single session into a summary
   * Target: 6-7x compression ratio
   */
  async compressSession(input: SessionCompressionInput): Promise<CompressionResponse<SessionSummary>> {
    try {
      const eventsText = input.events
        .map((e) => `[${e.event_type}] ${e.title}: ${e.description}`)
        .join('\n');

      const inputWordCount = eventsText.split(/\s+/).length;

      const prompt = `You are summarizing a D&D session for a Dungeon Master's campaign records.

SESSION ${input.sessionNumber} EVENTS:
${eventsText}

Create a concise summary that captures:
1. A narrative summary (2-3 paragraphs)
2. Key events that happened
3. NPCs who appeared or were mentioned
4. Locations visited
5. Items acquired or lost
6. Story threads that were advanced
7. Story threads that were resolved
8. Important party decisions
9. Any cliffhanger or hook for next session

Respond in JSON format:
{
  "summary": "narrative summary here",
  "key_events": ["event 1", "event 2"],
  "npcs_involved": ["npc name 1", "npc name 2"],
  "locations_visited": ["location 1"],
  "items_acquired": ["item 1"],
  "threads_advanced": ["thread title 1"],
  "threads_resolved": ["thread title 1"],
  "party_decisions": ["decision 1"],
  "cliffhanger": "optional cliffhanger"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const outputWordCount = parsed.summary.split(/\s+/).length;

      const sessionSummary: SessionSummary = {
        id: crypto.randomUUID(),
        campaign_id: this.campaignId,
        session_id: input.sessionId,
        session_number: input.sessionNumber,
        summary: parsed.summary,
        key_events: parsed.key_events || [],
        npcs_involved: parsed.npcs_involved || [],
        locations_visited: parsed.locations_visited || [],
        items_acquired: parsed.items_acquired || [],
        threads_advanced: parsed.threads_advanced || [],
        threads_resolved: parsed.threads_resolved || [],
        party_decisions: parsed.party_decisions || [],
        cliffhanger: parsed.cliffhanger || undefined,
        word_count: outputWordCount,
        compression_ratio: inputWordCount / outputWordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: sessionSummary,
        tokens_used: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Session compression failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Compress multiple session summaries into an arc summary
   * Target: 10-15x compression from original sessions
   */
  async compressArc(input: ArcCompressionInput): Promise<CompressionResponse<ArcSummary>> {
    try {
      const sessionsText = input.sessionSummaries
        .map((s) => `SESSION ${s.session_number}:\n${s.summary}`)
        .join('\n\n---\n\n');

      const inputWordCount = sessionsText.split(/\s+/).length;

      const prompt = `You are creating an arc summary for a D&D campaign. This arc is called "${input.arcName}".

SESSION SUMMARIES (${input.sessionSummaries.length} sessions):
${sessionsText}

Create a comprehensive arc summary that:
1. Tells the story of this arc in 3-5 paragraphs
2. Highlights major events
3. Tracks character development arcs
4. Notes faction changes
5. Records world changes
6. Lists unresolved threads

Respond in JSON format:
{
  "summary": "arc narrative summary",
  "major_events": ["event 1", "event 2"],
  "character_arcs": [{"character_name": "name", "development": "how they changed"}],
  "faction_changes": [{"faction_name": "name", "change": "what changed"}],
  "world_changes": ["change 1"],
  "unresolved_threads": ["thread 1"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const outputWordCount = parsed.summary.split(/\s+/).length;

      const arcSummary: ArcSummary = {
        id: crypto.randomUUID(),
        campaign_id: this.campaignId,
        arc_name: input.arcName,
        arc_number: input.arcNumber,
        session_range: {
          start: Math.min(...input.sessionSummaries.map((s) => s.session_number)),
          end: Math.max(...input.sessionSummaries.map((s) => s.session_number)),
        },
        summary: parsed.summary,
        major_events: parsed.major_events || [],
        character_arcs: parsed.character_arcs || [],
        faction_changes: parsed.faction_changes || [],
        world_changes: parsed.world_changes || [],
        unresolved_threads: parsed.unresolved_threads || [],
        word_count: outputWordCount,
        compression_ratio: inputWordCount / outputWordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: arcSummary,
        tokens_used: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Arc compression failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a campaign brief from arc summaries
   * Target: 15-20x compression from full campaign
   */
  async generateBrief(input: BriefCompressionInput): Promise<CompressionResponse<CampaignBrief>> {
    try {
      const arcsText = input.arcSummaries
        .map((a) => `ARC ${a.arc_number}: ${a.arc_name}\n${a.summary}`)
        .join('\n\n---\n\n');

      const inputWordCount = arcsText.split(/\s+/).length;

      const prompt = `You are creating a campaign brief - a high-level overview of an entire D&D campaign.

ARC SUMMARIES:
${arcsText}

Current session number: ${input.currentSessionNumber}

Create a comprehensive campaign brief that a DM could use to quickly understand:
1. The overall campaign story so far (2-3 paragraphs)
2. Current arc and its status
3. Party status and dynamics
4. Major NPCs and their relationships to the party
5. Key locations and their significance
6. Active story threads
7. Core campaign themes

Respond in JSON format:
{
  "brief": "overall campaign narrative",
  "current_arc": "name and brief status of current arc",
  "party_status": "current party situation and dynamics",
  "major_npcs": [{"name": "npc name", "role": "their role", "relationship": "relation to party"}],
  "key_locations": [{"name": "location", "significance": "why it matters"}],
  "active_threads": [{"title": "thread name", "status": "current status"}],
  "campaign_themes": ["theme 1", "theme 2"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const outputWordCount = parsed.brief.split(/\s+/).length;

      const campaignBrief: CampaignBrief = {
        id: crypto.randomUUID(),
        campaign_id: this.campaignId,
        brief: parsed.brief,
        current_arc: parsed.current_arc || 'Unknown',
        party_status: parsed.party_status || 'Unknown',
        major_npcs: parsed.major_npcs || [],
        key_locations: parsed.key_locations || [],
        active_threads: parsed.active_threads || [],
        campaign_themes: parsed.campaign_themes || [],
        total_sessions: input.currentSessionNumber,
        word_count: outputWordCount,
        compression_ratio: inputWordCount / outputWordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: campaignBrief,
        tokens_used: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Brief generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate history for a specific entity
   */
  async generateEntityHistory(input: EntityHistoryInput): Promise<CompressionResponse<EntityHistory>> {
    try {
      const mentionsText = input.mentions
        .map((m) => `Session ${m.session_number}: ${m.context}`)
        .join('\n');

      const prompt = `You are summarizing the history of a ${input.entityType} named "${input.entityName}" in a D&D campaign.

APPEARANCES AND MENTIONS:
${mentionsText}

Create a comprehensive history that tracks:
1. A narrative history of this ${input.entityType}
2. Key appearances (most significant sessions)
3. Relationship or status changes over time
4. Current status

Respond in JSON format:
{
  "history": "narrative history",
  "key_appearances": [{"session_number": 1, "event": "what happened"}],
  "relationship_changes": [{"session_number": 1, "change": "what changed"}],
  "current_status": "where they are now / current state"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const outputWordCount = parsed.history.split(/\s+/).length;

      const entityHistory: EntityHistory = {
        id: crypto.randomUUID(),
        campaign_id: this.campaignId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        entity_name: input.entityName,
        history: parsed.history,
        key_appearances: parsed.key_appearances || [],
        relationship_changes: parsed.relationship_changes || [],
        current_status: parsed.current_status || 'Unknown',
        word_count: outputWordCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: entityHistory,
        tokens_used: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Entity history generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
