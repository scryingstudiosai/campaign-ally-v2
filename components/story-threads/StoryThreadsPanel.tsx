'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Flame,
  Scroll,
  Coins,
  Eye,
  Sparkles,
  Users,
  Target,
  Loader2,
} from 'lucide-react';
import { CreateThreadDialog } from './CreateThreadDialog';
import { ThreadDetailSheet } from './ThreadDetailSheet';

interface StoryThread {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'failed' | 'dormant';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'background';
  thread_type: string;
  clock_type: string;
  clock_current: number;
  clock_max: number;
  clock_percentage: number;
  is_urgent: boolean;
  consequence_if_ignored: string;
  consequence_if_resolved: string;
  stake_type: string;
  trigger_description: string;
  related_entity_ids: string[];
}

interface StoryThreadsPanelProps {
  campaignId: string;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  background: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
};

const threadTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  consequence: AlertTriangle,
  promise: Scroll,
  debt: Coins,
  secret: Eye,
  prophecy: Sparkles,
  quest_hook: Target,
  relationship: Users,
};

export function StoryThreadsPanel({ campaignId }: StoryThreadsPanelProps) {
  const [threads, setThreads] = useState<StoryThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedThread, setSelectedThread] = useState<StoryThread | null>(null);
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');

  const loadThreads = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/story-threads?campaignId=${campaignId}&status=${filter}`);
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [campaignId, filter]);

  const urgentThreads = threads.filter((t) => t.is_urgent || t.priority === 'critical');
  const normalThreads = threads.filter((t) => !t.is_urgent && t.priority !== 'critical');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Story Threads
          </h2>
          <p className="text-sm text-zinc-400">Track consequences, promises, and ticking clocks</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-500">
          <Plus className="h-4 w-4 mr-2" />
          New Thread
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['active', 'resolved', 'all'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-teal-600' : 'border-zinc-700'}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Urgent Threads */}
      {!loading && urgentThreads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Urgent ({urgentThreads.length})
          </h3>
          {urgentThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => setSelectedThread(thread)} />
          ))}
        </div>
      )}

      {/* Normal Threads */}
      {!loading && normalThreads.length > 0 && (
        <div className="space-y-2">
          {urgentThreads.length > 0 && (
            <h3 className="text-sm font-medium text-zinc-400">Other Threads ({normalThreads.length})</h3>
          )}
          {normalThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onClick={() => setSelectedThread(thread)} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && threads.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-8 text-center">
            <Scroll className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="font-medium text-zinc-300">No Story Threads</h3>
            <p className="text-sm text-zinc-500 mb-4">Track promises, debts, and consequences</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="border-zinc-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Thread
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateThreadDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        campaignId={campaignId}
        onCreated={() => {
          setShowCreate(false);
          loadThreads();
        }}
      />

      {/* Detail Sheet */}
      <ThreadDetailSheet
        thread={selectedThread}
        onClose={() => setSelectedThread(null)}
        onUpdate={loadThreads}
      />
    </div>
  );
}

function ThreadCard({ thread, onClick }: { thread: StoryThread; onClick: () => void }) {
  const Icon = threadTypeIcons[thread.thread_type] || Scroll;

  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors ${
        thread.is_urgent ? 'border-l-2 border-l-red-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${thread.is_urgent ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
              <Icon className={`h-4 w-4 ${thread.is_urgent ? 'text-red-400' : 'text-zinc-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium text-zinc-100 truncate">{thread.title}</h4>
                <Badge variant="outline" className={priorityColors[thread.priority]}>
                  {thread.priority}
                </Badge>
                {thread.status === 'resolved' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>

              {thread.description && (
                <p className="text-sm text-zinc-400 line-clamp-1 mb-2">{thread.description}</p>
              )}

              {/* Clock Progress */}
              {thread.clock_type && thread.clock_type !== 'none' && thread.clock_max && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <Progress
                    value={thread.clock_percentage || 0}
                    className={`h-1.5 flex-1 ${thread.clock_percentage >= 75 ? '[&>div]:bg-red-500' : ''}`}
                  />
                  <span className="text-xs text-zinc-500">
                    {thread.clock_current}/{thread.clock_max} {thread.clock_type}
                  </span>
                </div>
              )}

              {/* Consequence Preview */}
              {thread.consequence_if_ignored && thread.is_urgent && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {thread.consequence_if_ignored}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
