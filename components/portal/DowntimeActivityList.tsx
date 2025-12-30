'use client';

import { useState } from 'react';
import {
  Clock, ChevronRight,
  Dumbbell, BookOpen, Coins, Beer, Hammer, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DowntimeLog {
  id: string;
  activity_type: string;
  activity_target: string | null;
  notes: string | null;
  days_spent: number;
  status: 'pending' | 'resolved' | 'cancelled';
  result_summary: string | null;
  result_rewards: any;
  created_at: string;
  resolved_at: string | null;
}

interface Props {
  logs: DowntimeLog[];
  onCancel?: (id: string) => void;
}

const activityIcons: Record<string, React.ElementType> = {
  training: Dumbbell,
  research: BookOpen,
  work: Coins,
  carousing: Beer,
  crafting: Hammer,
  other: MoreHorizontal,
};

const activityColors: Record<string, string> = {
  training: 'text-orange-400',
  research: 'text-blue-400',
  work: 'text-yellow-400',
  carousing: 'text-pink-400',
  crafting: 'text-emerald-400',
  other: 'text-purple-400',
};

export function DowntimeActivityList({ logs, onCancel }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No downtime activities yet</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const Icon = activityIcons[log.activity_type] || MoreHorizontal;
        const color = activityColors[log.activity_type] || 'text-slate-400';
        const isExpanded = expandedId === log.id;

        return (
          <div
            key={log.id}
            className={cn(
              "bg-slate-900/50 border rounded-xl overflow-hidden transition-colors",
              log.status === 'pending' ? "border-amber-500/30" :
              log.status === 'resolved' ? "border-green-500/30" :
              "border-white/10"
            )}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Icon className={cn("w-5 h-5", color)} />

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium capitalize">
                    {log.activity_type}
                    {log.activity_target && `: ${log.activity_target}`}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{log.days_spent} {log.days_spent === 1 ? 'day' : 'days'}</span>
                  <span>•</span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                log.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                log.status === 'resolved' ? "bg-green-500/20 text-green-400" :
                "bg-slate-500/20 text-slate-400"
              )}>
                {log.status === 'pending' ? 'Pending' :
                 log.status === 'resolved' ? 'Resolved' : 'Cancelled'}
              </div>

              <ChevronRight className={cn(
                "w-4 h-4 text-slate-500 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {/* Notes */}
                {log.notes && (
                  <div>
                    <h5 className="text-xs text-slate-500 uppercase mb-1">Your Notes</h5>
                    <p className="text-sm text-slate-300">{log.notes}</p>
                  </div>
                )}

                {/* Result (if resolved) */}
                {log.status === 'resolved' && log.result_summary && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h5 className="text-xs text-green-400 uppercase mb-1">Result</h5>
                    <p className="text-sm text-slate-300">{log.result_summary}</p>

                    {/* Rewards */}
                    {log.result_rewards && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {log.result_rewards.gold && (
                          <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">
                            +{log.result_rewards.gold} gold
                          </span>
                        )}
                        {log.result_rewards.xp && (
                          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">
                            +{log.result_rewards.xp} XP
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cancel Button (for pending) */}
                {log.status === 'pending' && onCancel && (
                  <button
                    onClick={() => onCancel(log.id)}
                    className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    Cancel Activity
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
