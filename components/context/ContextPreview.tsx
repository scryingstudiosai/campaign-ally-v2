'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, AlertTriangle, Lightbulb, FileText, Loader2 } from 'lucide-react';

interface TokenUsage {
  total: number;
  budget: number;
  byLayer: Record<string, number>;
}

interface Source {
  id: string;
  type: string;
  name: string;
  entityType?: string;
  relevance: number;
}

interface StoryThread {
  id: string;
  title: string;
  isUrgent: boolean;
  clockProgress?: number;
}

interface ContextResult {
  promptText: string;
  tokenUsage: TokenUsage;
  sources?: Source[];
  activeThreads: StoryThread[];
  warnings: string[];
  suggestedHooks: string[];
  profile: string;
}

interface ContextPreviewProps {
  campaignId: string;
}

export function ContextPreview({ campaignId }: ContextPreviewProps) {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState('npc');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContextResult | null>(null);

  const previewContext = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/context/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          query,
          profile,
          debug: true,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Context preview failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          Context Engine Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., sewer monster, tavern keeper, ancient artifact..."
            className="bg-zinc-800 border-zinc-700 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && previewContext()}
          />
          <Select value={profile} onValueChange={setProfile}>
            <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="npc">NPC</SelectItem>
              <SelectItem value="encounter">Encounter</SelectItem>
              <SelectItem value="quest">Quest</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="creature">Creature</SelectItem>
              <SelectItem value="faction">Faction</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={previewContext}
            disabled={loading || !query.trim()}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Preview'}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Token Usage */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-zinc-400">
                Tokens: {result.tokenUsage?.total} / {result.tokenUsage?.budget}
              </span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{
                    width: `${(result.tokenUsage?.total / result.tokenUsage?.budget) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  AI Warnings
                </h4>
                <ul className="text-sm text-yellow-300 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Hooks */}
            {result.suggestedHooks?.length > 0 && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-teal-400 flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Hooks
                </h4>
                <ul className="text-sm text-teal-300 space-y-1">
                  {result.suggestedHooks.map((h, i) => (
                    <li key={i}>• {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Threads */}
            {result.activeThreads?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Active Threads in Context</h4>
                <div className="flex flex-wrap gap-2">
                  {result.activeThreads.map((t) => (
                    <Badge
                      key={t.id}
                      variant="outline"
                      className={t.isUrgent ? 'border-red-500 text-red-400' : 'border-zinc-600'}
                    >
                      {t.isUrgent && '🔴 '}
                      {t.title}
                      {t.clockProgress !== undefined && ` (${t.clockProgress}%)`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {result.sources?.length ? (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                  Sources Found ({result.sources.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.sources.map((s, i) => (
                    <div key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-1">
                        {s.entityType || s.type}
                      </Badge>
                      <span>{s.name}</span>
                      <span className="text-zinc-600">({Math.round(s.relevance * 100)}% match)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Full Context Preview */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Full Context Prompt
              </summary>
              <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result.promptText}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
