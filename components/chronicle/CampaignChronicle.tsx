'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Book,
  ScrollText,
  Layers,
  FileText,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CampaignChronicle as ChronicleData,
  SessionSummary,
  ArcSummary,
  CampaignBrief,
} from '@/lib/ai/compression';

interface CampaignChronicleProps {
  campaignId: string;
}

export function CampaignChronicle({ campaignId }: CampaignChronicleProps) {
  const [chronicle, setChronicle] = useState<ChronicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChronicle();
  }, [campaignId]);

  const fetchChronicle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compression/chronicle?campaignId=${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch chronicle');
      const data = await response.json();
      setChronicle(data);
    } catch (error) {
      console.error('Failed to fetch chronicle:', error);
      toast.error('Failed to load campaign chronicle');
    } finally {
      setLoading(false);
    }
  };

  const generateBrief = async () => {
    try {
      setGenerating('brief');
      const response = await fetch('/api/compression/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, forceRegenerate: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate brief');
      }

      toast.success('Campaign brief generated!');
      await fetchChronicle();
    } catch (error) {
      console.error('Failed to generate brief:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate brief');
    } finally {
      setGenerating(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Book className="h-6 w-6 text-teal-400" />
            Campaign Chronicle
          </h2>
          <p className="text-zinc-400">AI-compressed summaries of your campaign</p>
        </div>
        <Button onClick={fetchChronicle} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-teal-400">
              {chronicle?.sessions.length || 0}
            </div>
            <div className="text-xs text-zinc-500">Session Summaries</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {chronicle?.arcs.length || 0}
            </div>
            <div className="text-xs text-zinc-500">Arc Summaries</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {chronicle?.brief ? 1 : 0}
            </div>
            <div className="text-xs text-zinc-500">Campaign Brief</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {chronicle?.entityHistories.length || 0}
            </div>
            <div className="text-xs text-zinc-500">Entity Histories</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="brief" className="space-y-4">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="brief">Campaign Brief</TabsTrigger>
          <TabsTrigger value="arcs">Arcs ({chronicle?.arcs.length || 0})</TabsTrigger>
          <TabsTrigger value="sessions">Sessions ({chronicle?.sessions.length || 0})</TabsTrigger>
        </TabsList>

        {/* Brief Tab */}
        <TabsContent value="brief">
          {chronicle?.brief ? (
            <BriefCard brief={chronicle.brief} />
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">No Campaign Brief Yet</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                  Generate a high-level overview of your campaign. Requires at least one arc summary.
                </p>
                <Button
                  onClick={generateBrief}
                  disabled={generating === 'brief' || !chronicle?.arcs.length}
                  className="bg-teal-600 hover:bg-teal-500"
                >
                  {generating === 'brief' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Brief
                    </>
                  )}
                </Button>
                {!chronicle?.arcs.length && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Create arc summaries first
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Arcs Tab */}
        <TabsContent value="arcs">
          <div className="space-y-3">
            {chronicle?.arcs.length ? (
              chronicle.arcs.map((arc) => (
                <ArcCard
                  key={arc.id}
                  arc={arc}
                  expanded={expandedItems.has(arc.id)}
                  onToggle={() => toggleExpand(arc.id)}
                />
              ))
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">No Arc Summaries</h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Arc summaries compress multiple sessions into story arcs.
                    Create session summaries first, then group them into arcs.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <div className="h-[500px] overflow-y-auto pr-4 space-y-3">
            {chronicle?.sessions.length ? (
              chronicle.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  expanded={expandedItems.has(session.id)}
                  onToggle={() => toggleExpand(session.id)}
                />
              ))
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <ScrollText className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">No Session Summaries</h3>
                  <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Session summaries are automatically generated when you end a session
                    or can be created manually from the Sessions page.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Brief Card Component
function BriefCard({ brief }: { brief: CampaignBrief }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-400" />
          Campaign Overview
          <Badge variant="outline" className="ml-auto text-xs">
            {brief.total_sessions} sessions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
          <p className="text-zinc-300 leading-relaxed">{brief.brief}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Current Arc</h4>
            <p className="text-zinc-200">{brief.current_arc}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Party Status</h4>
            <p className="text-zinc-200">{brief.party_status}</p>
          </div>
        </div>

        {brief.major_npcs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Major NPCs</h4>
            <div className="flex flex-wrap gap-2">
              {brief.major_npcs.map((npc, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {npc.name} - {npc.role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {brief.active_threads.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-2">Active Threads</h4>
            <div className="space-y-1">
              {brief.active_threads.map((thread, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-teal-400" />
                  <span className="text-zinc-300">{thread.title}</span>
                  <span className="text-zinc-500">- {thread.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
          <span>{brief.word_count} words</span>
          <span>{brief.compression_ratio?.toFixed(1)}x compression</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Arc Card Component
function ArcCard({
  arc,
  expanded,
  onToggle,
}: {
  arc: ArcSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h4 className="font-medium text-zinc-100">
                Arc {arc.arc_number}: {arc.arc_name}
              </h4>
              <Badge variant="outline" className="text-xs">
                Sessions {arc.session_range.start}-{arc.session_range.end}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{arc.summary}</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          )}
        </div>

        {expanded && (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <p className="text-zinc-300 text-sm leading-relaxed">{arc.summary}</p>
            </div>

            {arc.major_events.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-zinc-500 mb-1">Major Events</h5>
                <ul className="text-sm text-zinc-400 space-y-1">
                  {arc.major_events.map((event, i) => (
                    <li key={i}>• {event}</li>
                  ))}
                </ul>
              </div>
            )}

            {arc.world_changes.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-zinc-500 mb-1">World Changes</h5>
                <ul className="text-sm text-zinc-400 space-y-1">
                  {arc.world_changes.map((change, i) => (
                    <li key={i}>• {change}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              <span>{arc.word_count} words</span>
              <span>{arc.compression_ratio?.toFixed(1)}x compression</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Session Card Component
function SessionCard({
  session,
  expanded,
  onToggle,
}: {
  session: SessionSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-teal-400" />
              <h4 className="font-medium text-zinc-100">Session {session.session_number}</h4>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(session.created_at).toLocaleDateString()}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{session.summary}</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          )}
        </div>

        {expanded && (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <p className="text-zinc-300 text-sm leading-relaxed">{session.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {session.key_events.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-zinc-500 mb-1">Key Events</h5>
                  <ul className="text-zinc-400 space-y-1">
                    {session.key_events.slice(0, 5).map((event, i) => (
                      <li key={i}>• {event}</li>
                    ))}
                  </ul>
                </div>
              )}

              {session.npcs_involved.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-zinc-500 mb-1">NPCs</h5>
                  <div className="flex flex-wrap gap-1">
                    {session.npcs_involved.map((npc, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {npc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {session.cliffhanger && (
              <div className="bg-amber-500/10 p-2 rounded border border-amber-500/30">
                <h5 className="text-xs font-medium text-amber-400 mb-1">Cliffhanger</h5>
                <p className="text-sm text-zinc-300 italic">{session.cliffhanger}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              <span>{session.word_count} words</span>
              <span>{session.compression_ratio?.toFixed(1)}x compression</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
