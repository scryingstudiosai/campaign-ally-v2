'use client';

import { useState } from 'react';
import { Clock, Moon, Sun } from 'lucide-react';
import { DowntimeSelector } from './DowntimeSelector';
import { DowntimeActivityList } from './DowntimeActivityList';
import { cn } from '@/lib/utils';

interface Character {
  id: string;
  name: string;
  image_url: string | null;
}

interface Campaign {
  id: string;
  name: string;
  current_state: string | null;
  downtime_days_available: number | null;
}

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
  campaignId: string;
  userId: string;
  campaign: Campaign | null;
  character: Character | null;
  initialLogs: DowntimeLog[];
}

export function DowntimeView({ campaignId, userId, campaign, character, initialLogs }: Props) {
  const [logs, setLogs] = useState<DowntimeLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'activity' | 'history'>('activity');

  const isDowntime = campaign?.current_state === 'downtime' ||
                     campaign?.current_state === 'long_rest' ||
                     campaign?.current_state === 'town';

  const hasPendingActivity = logs.some(l => l.status === 'pending');
  const daysAvailable = campaign?.downtime_days_available || 7;

  const handleActivitySubmitted = async () => {
    // Refresh logs
    const res = await fetch(`/api/portal/downtime?campaignId=${campaignId}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  const handleCancelActivity = async (id: string) => {
    const res = await fetch('/api/portal/downtime', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    });

    if (res.ok) {
      setLogs(logs.map(l => l.id === id ? { ...l, status: 'cancelled' as const } : l));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/10 px-4 py-4">
        <h1 className="text-xl font-display text-white flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-400" />
          Downtime
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Activities between adventures
        </p>
      </div>

      {/* Campaign State Banner */}
      <div className={cn(
        "mx-4 mt-4 p-3 rounded-xl border flex items-center gap-3",
        isDowntime
          ? "bg-indigo-500/10 border-indigo-500/30"
          : "bg-slate-800/50 border-white/10"
      )}>
        {isDowntime ? (
          <>
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-white text-sm font-medium">Downtime Active</p>
              <p className="text-slate-400 text-xs">
                The party is resting. You have {daysAvailable} days to spend.
              </p>
            </div>
          </>
        ) : (
          <>
            <Sun className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-white text-sm font-medium">Adventure in Progress</p>
              <p className="text-slate-400 text-xs">
                Downtime activities will be available when the party rests.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mt-4 mx-4">
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === 'activity'
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          {hasPendingActivity ? 'Current Activity' : 'New Activity'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === 'history'
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          History ({logs.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'activity' && (
          <>
            {!isDowntime ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Downtime not available</p>
                <p className="text-slate-500 text-sm mt-1">
                  Your DM will start downtime between sessions
                </p>
              </div>
            ) : hasPendingActivity ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  You have a pending activity. Wait for your DM to resolve it, or cancel to choose something else.
                </p>
                <DowntimeActivityList
                  logs={logs.filter(l => l.status === 'pending')}
                  onCancel={handleCancelActivity}
                />
              </div>
            ) : character ? (
              <DowntimeSelector
                campaignId={campaignId}
                characterId={character.id}
                characterName={character.name}
                daysAvailable={daysAvailable}
                onActivitySubmitted={handleActivitySubmitted}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">No character claimed</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <DowntimeActivityList
            logs={logs}
            onCancel={handleCancelActivity}
          />
        )}
      </div>
    </div>
  );
}
