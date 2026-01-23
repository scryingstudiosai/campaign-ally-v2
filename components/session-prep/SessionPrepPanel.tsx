'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  Scroll,
  Heart,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Swords,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsContext } from '@/components/settings/SettingsContext';

interface PrepSuggestion {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: { type: string; id?: string; name?: string };
  details?: { mechanics?: string };
  dmNotes?: string;
  suggestedReadAloud?: string;
}

interface SessionPrepReport {
  critical: PrepSuggestion[];
  high: PrepSuggestion[];
  medium: PrepSuggestion[];
  low: PrepSuggestion[];
  stats: {
    totalSuggestions: number;
    urgentThreads: number;
    activeNpcs: number;
    partyHealthPercent: number;
    daysUntilNextDeadline?: number;
  };
  recap?: string;
  openingScene?: string;
}

interface SessionPrepPanelProps {
  campaignId: string;
}

const priorityColors = {
  critical: 'bg-red-500/20 border-red-500/50 text-red-400',
  high: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  low: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

const typeIcons: Record<string, React.ElementType> = {
  urgent_thread: Clock,
  location_npcs: MapPin,
  unresolved_hook: Scroll,
  faction_movement: Users,
  encounter_rec: Swords,
  party_status: Heart,
  recap: MessageSquare,
  callback: Sparkles,
};

export function SessionPrepPanel({ campaignId }: SessionPrepPanelProps) {
  const [report, setReport] = useState<SessionPrepReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { markOnboardingComplete } = useSettingsContext();

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/session-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          includeRecap: true,
          includeOpeningScene: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate prep');

      const data = await response.json();
      setReport(data);
      toast.success('Session prep generated!');
      // Mark onboarding task complete
      await markOnboardingComplete('use_session_prep');
    } catch (error) {
      console.error('Failed to generate prep:', error);
      toast.error('Failed to generate session prep');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const allSuggestions = report
    ? [...report.critical, ...report.high, ...report.medium, ...report.low]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            Session Prep
          </h2>
          <p className="text-zinc-400">AI-powered suggestions for your next session</p>
        </div>
        <Button
          onClick={generateReport}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Prep
            </>
          )}
        </Button>
      </div>

      {/* Stats Bar */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {report.stats.totalSuggestions}
              </div>
              <div className="text-xs text-zinc-500">Suggestions</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{report.stats.urgentThreads}</div>
              <div className="text-xs text-zinc-500">Urgent Threads</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-teal-400">{report.stats.activeNpcs}</div>
              <div className="text-xs text-zinc-500">Active NPCs</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <div
                className={`text-2xl font-bold ${
                  report.stats.partyHealthPercent < 50 ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {report.stats.partyHealthPercent}%
              </div>
              <div className="text-xs text-zinc-500">Party HP</div>
            </CardContent>
          </Card>
          {report.stats.daysUntilNextDeadline !== undefined && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {report.stats.daysUntilNextDeadline}
                </div>
                <div className="text-xs text-zinc-500">Days to Deadline</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content */}
      {report && (
        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="suggestions">Suggestions ({allSuggestions.length})</TabsTrigger>
            <TabsTrigger value="recap">Recap</TabsTrigger>
            <TabsTrigger value="opening">Opening Scene</TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <div className="h-[500px] overflow-y-auto pr-4">
              <div className="space-y-3">
                {/* Critical */}
                {report.critical.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Critical ({report.critical.length})
                    </h3>
                    {report.critical.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        expanded={expandedSuggestions.has(suggestion.id)}
                        onToggle={() => toggleExpand(suggestion.id)}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    ))}
                  </div>
                )}

                {/* High */}
                {report.high.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-orange-400">
                      High Priority ({report.high.length})
                    </h3>
                    {report.high.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        expanded={expandedSuggestions.has(suggestion.id)}
                        onToggle={() => toggleExpand(suggestion.id)}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    ))}
                  </div>
                )}

                {/* Medium */}
                {report.medium.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-yellow-400">
                      Medium Priority ({report.medium.length})
                    </h3>
                    {report.medium.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        expanded={expandedSuggestions.has(suggestion.id)}
                        onToggle={() => toggleExpand(suggestion.id)}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    ))}
                  </div>
                )}

                {/* Low */}
                {report.low.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-blue-400">
                      Low Priority ({report.low.length})
                    </h3>
                    {report.low.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        expanded={expandedSuggestions.has(suggestion.id)}
                        onToggle={() => toggleExpand(suggestion.id)}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    ))}
                  </div>
                )}

                {allSuggestions.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No suggestions generated. Add story threads, NPCs, and session events to get
                    prep suggestions.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Recap Tab */}
          <TabsContent value="recap">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-400" />
                    &quot;Previously on...&quot;
                  </span>
                  {report.recap && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(report.recap!, 'recap')}
                    >
                      {copiedId === 'recap' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.recap ? (
                  <p className="text-zinc-300 italic leading-relaxed">&quot;{report.recap}&quot;</p>
                ) : (
                  <p className="text-zinc-500">
                    No recap available. Log session events to generate recaps.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opening Scene Tab */}
          <TabsContent value="opening">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Opening Scene
                  </span>
                  {report.openingScene && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(report.openingScene!, 'opening')}
                    >
                      {copiedId === 'opening' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.openingScene ? (
                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-200 italic leading-relaxed">{report.openingScene}</p>
                  </div>
                ) : (
                  <p className="text-zinc-500">No opening scene generated.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!report && !loading && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-amber-400/50 mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">Ready to Prep Your Session?</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              Generate AI-powered suggestions based on your campaign&apos;s story threads, party
              status, and unresolved plot hooks.
            </p>
            <Button onClick={generateReport} className="bg-amber-600 hover:bg-amber-500">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Session Prep
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Suggestion Card Component
function SuggestionCard({
  suggestion,
  expanded,
  onToggle,
  onCopy,
  copiedId,
}: {
  suggestion: PrepSuggestion;
  expanded: boolean;
  onToggle: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const Icon = typeIcons[suggestion.type] || Scroll;

  return (
    <Card
      className={`bg-zinc-900 border ${priorityColors[suggestion.priority]} cursor-pointer transition-all`}
      onClick={onToggle}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${priorityColors[suggestion.priority].split(' ')[0]}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-zinc-100 text-sm">{suggestion.title}</h4>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
            </div>

            <p className="text-sm text-zinc-400 mt-1">{suggestion.description}</p>

            {expanded && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                {suggestion.dmNotes && (
                  <div className="bg-zinc-800 p-2 rounded text-xs text-zinc-300">
                    <span className="text-zinc-500 font-medium">DM Notes: </span>
                    {suggestion.dmNotes}
                  </div>
                )}

                {suggestion.details?.mechanics && (
                  <Badge variant="outline" className="text-xs">
                    {suggestion.details.mechanics}
                  </Badge>
                )}

                {suggestion.suggestedReadAloud && (
                  <div className="bg-purple-500/10 p-2 rounded border border-purple-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-purple-400 font-medium">Read Aloud:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onCopy(suggestion.suggestedReadAloud!, suggestion.id)}
                      >
                        {copiedId === suggestion.id ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-300 italic">
                      &quot;{suggestion.suggestedReadAloud}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
