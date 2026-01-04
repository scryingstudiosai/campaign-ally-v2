'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle, Trash2, Plus, Minus, Target } from 'lucide-react';
import { toast } from 'sonner';

interface StoryThread {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  thread_type: string;
  stake_type: string;
  clock_type: string;
  clock_current: number;
  clock_max: number;
  consequence_if_ignored: string;
  consequence_if_resolved: string;
}

interface ThreadDetailSheetProps {
  thread: StoryThread | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function ThreadDetailSheet({ thread, onClose, onUpdate }: ThreadDetailSheetProps) {
  const [loading, setLoading] = useState(false);

  if (!thread) return null;

  const clockPercentage = thread.clock_max
    ? Math.round((thread.clock_current / thread.clock_max) * 100)
    : 0;

  const advanceClock = async (amount: number) => {
    setLoading(true);
    try {
      const newValue = Math.max(
        0,
        Math.min((thread.clock_current || 0) + amount, thread.clock_max || 99)
      );

      await fetch(`/api/story-threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clock_current: newValue }),
      });

      toast.success(amount > 0 ? 'Clock advanced' : 'Clock reduced');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update clock');
    } finally {
      setLoading(false);
    }
  };

  const resolveThread = async () => {
    setLoading(true);
    try {
      await fetch(`/api/story-threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      toast.success('Thread resolved!');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to resolve thread');
    } finally {
      setLoading(false);
    }
  };

  const deleteThread = async () => {
    if (!confirm('Delete this thread?')) return;

    setLoading(true);
    try {
      await fetch(`/api/story-threads/${thread.id}`, {
        method: 'DELETE',
      });

      toast.success('Thread deleted');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to delete thread');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={!!thread} onOpenChange={() => onClose()}>
      <SheetContent className="bg-zinc-900 border-zinc-800 w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            {thread.title}
            {thread.status === 'resolved' && <CheckCircle className="h-5 w-5 text-green-400" />}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status & Priority */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="border-zinc-700">
              {thread.thread_type}
            </Badge>
            <Badge variant="outline" className="border-zinc-700">
              {thread.priority}
            </Badge>
            {thread.stake_type && (
              <Badge variant="outline" className="border-zinc-700">
                {thread.stake_type}
              </Badge>
            )}
          </div>

          {/* Description */}
          {thread.description && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-1">Description</h4>
              <p className="text-zinc-300">{thread.description}</p>
            </div>
          )}

          {/* Clock */}
          {thread.clock_type && thread.clock_type !== 'none' && thread.clock_max && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Clock ({thread.clock_type})
              </h4>
              <div className="space-y-2">
                <Progress
                  value={clockPercentage}
                  className={`h-3 ${clockPercentage >= 75 ? '[&>div]:bg-red-500' : ''}`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    {thread.clock_current} / {thread.clock_max}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => advanceClock(-1)}
                      disabled={loading || thread.clock_current <= 0}
                      className="h-8 w-8 p-0 border-zinc-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => advanceClock(1)}
                      disabled={loading || thread.clock_current >= thread.clock_max}
                      className="h-8 w-8 p-0 border-zinc-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consequence */}
          {thread.consequence_if_ignored && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                If Ignored
              </h4>
              <p className="text-zinc-300 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {thread.consequence_if_ignored}
              </p>
            </div>
          )}

          {/* Resolution */}
          {thread.consequence_if_resolved && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-1 flex items-center gap-2">
                <Target className="h-4 w-4" />
                If Resolved
              </h4>
              <p className="text-zinc-300 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                {thread.consequence_if_resolved}
              </p>
            </div>
          )}

          {/* Actions */}
          {thread.status === 'active' && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <Button
                className="w-full bg-green-600 hover:bg-green-500"
                onClick={resolveThread}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={deleteThread}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Thread
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
