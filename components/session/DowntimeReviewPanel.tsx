'use client';

import { useState, useEffect } from 'react';
import {
  Moon, Check, ChevronRight, Loader2,
  Dumbbell, BookOpen, Coins, Beer, Hammer, MoreHorizontal
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface DowntimeLog {
  id: string;
  activity_type: string;
  activity_target: string | null;
  notes: string | null;
  days_spent: number;
  status: string;
  created_at: string;
  character: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface Props {
  campaignId: string;
}

const activityIcons: Record<string, React.ElementType> = {
  training: Dumbbell,
  research: BookOpen,
  work: Coins,
  carousing: Beer,
  crafting: Hammer,
  other: MoreHorizontal,
};

export function DowntimeReviewPanel({ campaignId }: Props) {
  const [logs, setLogs] = useState<DowntimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resultText, setResultText] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('downtime_logs')
        .select(`
          *,
          character:entities!character_id (
            id,
            name,
            image_url
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      setLogs(data || []);
      setIsLoading(false);
    };

    fetchLogs();
  }, [campaignId, supabase]);

  const handleResolve = async (logId: string) => {
    if (!resultText.trim()) return;

    setResolving(logId);

    const res = await fetch('/api/portal/downtime/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logId,
        resultSummary: resultText,
      }),
    });

    if (res.ok) {
      setLogs(logs.filter(l => l.id !== logId));
      setResultText('');
      setExpandedId(null);
    }

    setResolving(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Moon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No pending downtime activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          Pending Activities ({logs.length})
        </h3>
      </div>

      {logs.map((log) => {
        const Icon = activityIcons[log.activity_type] || MoreHorizontal;
        const isExpanded = expandedId === log.id;

        return (
          <div
            key={log.id}
            className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5"
            >
              {/* Character Avatar */}
              <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                {log.character?.image_url ? (
                  <img src={log.character.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    ?
                  </div>
                )}
              </div>

              <div className="flex-1 text-left">
                <h4 className="text-white font-medium">{log.character?.name}</h4>
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {log.activity_type}
                  {log.activity_target && `: ${log.activity_target}`}
                </p>
              </div>

              <ChevronRight className={cn(
                "w-4 h-4 text-slate-500 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {/* Activity Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Days:</span>
                    <span className="text-white ml-2">{log.days_spent}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Submitted:</span>
                    <span className="text-white ml-2">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {log.notes && (
                  <div>
                    <h5 className="text-xs text-slate-500 uppercase mb-1">Player Notes</h5>
                    <p className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded">
                      {log.notes}
                    </p>
                  </div>
                )}

                {/* Resolution Input */}
                <div>
                  <h5 className="text-xs text-slate-500 uppercase mb-1">Result</h5>
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    rows={3}
                    placeholder="Describe what happens..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm placeholder-slate-500 resize-none"
                  />
                </div>

                <button
                  onClick={() => handleResolve(log.id)}
                  disabled={!resultText.trim() || resolving === log.id}
                  className="w-full py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resolving === log.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Resolve Activity
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
