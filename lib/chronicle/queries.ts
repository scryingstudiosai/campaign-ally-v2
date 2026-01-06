import { createClient } from '@/lib/supabase/server';

// Types for Chronicle data
export interface SessionData {
  id: string;
  name: string;
  session_number: number;
  session_date: string | null;
  status: string;
  summary: string | null;
  ai_summary: {
    narrative_summary?: string;
    key_events?: string[];
    npcs_encountered?: string[];
  } | null;
}

export interface QuestArc {
  id: string;
  type: 'quest';
  name: string;
  summary: string | null;
  progress: { completed: number; total: number };
  milestones: Array<{ text: string; completed: boolean }>;
  updatedAt: string;
}

export interface ThreadArc {
  id: string;
  type: 'thread';
  name: string;
  status: string;
  urgency: string | null;
  stakes: string | null;
  trigger: string | null;
  updatedAt: string;
}

export interface CampaignBriefData {
  campaign: {
    name: string;
    description: string | null;
    codex: {
      premise?: string;
      themes?: string[];
      tone?: string;
    } | null;
  } | null;
  urgentThreads: Array<{
    title: string;
    priority: string;
    stakes: string | null;
  }>;
  recentSessions: Array<{
    name: string;
    summary: string | null;
  }>;
}

export async function getSessionSummaries(campaignId: string): Promise<{ sessions: SessionData[]; error: Error | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name, session_number, session_date, status, summary, ai_summary')
    .eq('campaign_id', campaignId)
    .order('session_number', { ascending: false });

  console.log('[Chronicle] Sessions query:', {
    count: data?.length,
    withSummary: data?.filter(s => s.summary || s.ai_summary?.narrative_summary).length,
    error
  });
  return { sessions: (data || []) as SessionData[], error: error as Error | null };
}

export async function getArcData(campaignId: string): Promise<{ quests: QuestArc[]; threads: ThreadArc[] }> {
  const supabase = await createClient();

  // Get quests as arcs
  const { data: quests } = await supabase
    .from('entities')
    .select('id, name, summary, soul, created_at, updated_at')
    .eq('campaign_id', campaignId)
    .eq('entity_type', 'quest')
    .is('deleted_at', null);

  // Get story threads as arcs
  const { data: threads } = await supabase
    .from('story_threads')
    .select('*')
    .eq('campaign_id', campaignId);

  console.log('[Chronicle] Arcs query:', { quests: quests?.length, threads: threads?.length });

  // Parse quest milestones safely
  const questArcs: QuestArc[] = (quests || []).map((q) => {
    const soul = q.soul as { milestones?: Array<{ text: string; completed: boolean }> } | null;
    const milestones = Array.isArray(soul?.milestones) ? soul.milestones : [];
    const completed = milestones.filter((m) => m.completed).length;
    return {
      id: q.id,
      type: 'quest' as const,
      name: q.name,
      summary: q.summary,
      progress: { completed, total: milestones.length },
      milestones,
      updatedAt: q.updated_at,
    };
  });

  const threadArcs: ThreadArc[] = (threads || []).map((t) => ({
    id: t.id,
    type: 'thread' as const,
    name: t.title,
    status: t.status,
    urgency: t.priority,
    stakes: t.stakes,
    trigger: t.trigger_type,
    updatedAt: t.updated_at,
  }));

  return { quests: questArcs, threads: threadArcs };
}

export async function getCampaignBriefDerived(campaignId: string): Promise<CampaignBriefData> {
  const supabase = await createClient();

  // Get campaign info
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, description')
    .eq('id', campaignId)
    .single();

  // Get codex from separate table
  const { data: codex } = await supabase
    .from('codex')
    .select('premise, themes, tone')
    .eq('campaign_id', campaignId)
    .single();

  // Get top 3 urgent threads
  const { data: urgentThreads } = await supabase
    .from('story_threads')
    .select('title, priority, stakes')
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(3);

  // Get last 2 session summaries
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('name, summary')
    .eq('campaign_id', campaignId)
    .not('summary', 'is', null)
    .order('session_number', { ascending: false })
    .limit(2);

  return {
    campaign: campaign ? {
      name: campaign.name,
      description: campaign.description,
      codex: codex || null,
    } : null,
    urgentThreads: (urgentThreads || []) as CampaignBriefData['urgentThreads'],
    recentSessions: (recentSessions || []) as CampaignBriefData['recentSessions'],
  };
}

export async function getEntityHistory(campaignId: string, entityId: string): Promise<{
  entity: Record<string, unknown> | null;
  relationships: Array<Record<string, unknown>>;
}> {
  const supabase = await createClient();

  // Get entity
  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  // Get relationships
  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      *,
      source:source_id(id, name, entity_type),
      target:target_id(id, name, entity_type)
    `)
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

  return { entity, relationships: relationships || [] };
}
