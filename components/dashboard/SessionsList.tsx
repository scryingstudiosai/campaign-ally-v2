'use client';

import { useState, useEffect } from 'react';
import { Session, SessionStatus } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, ChevronRight, Scroll } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useSettingsContext } from '@/components/settings/SettingsContext';

interface SessionsListProps {
  campaignId: string;
}

export function SessionsList({ campaignId }: SessionsListProps): JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { markOnboardingComplete } = useSettingsContext();

  useEffect(() => {
    const fetchSessions = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/sessions?campaignId=${campaignId}`);
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
      setIsLoading(false);
    };
    fetchSessions();
  }, [campaignId]);

  const handleNewSession = async (): Promise<void> => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      if (response.ok) {
        const newSession = await response.json();
        // Mark onboarding task complete
        await markOnboardingComplete('create_session');
        router.push(`/dashboard/campaigns/${campaignId}/sessions/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    setIsCreating(false);
  };

  const statusConfig: Record<SessionStatus, { color: string; label: string }> = {
    planning: {
      color: 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]',
      label: 'Planning'
    },
    active: {
      color: 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      label: 'Live'
    },
    review: {
      color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
      label: 'Review'
    },
    archived: {
      color: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
      label: 'Archived'
    },
  };

  const formatDuration = (minutes?: number): string | null => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Scroll className="w-5 h-5 text-teal-400" />
          Sessions
        </h2>
        <Button
          size="sm"
          onClick={handleNewSession}
          disabled={isCreating}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          {isCreating ? 'Creating...' : 'New Session'}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-slate-500 text-sm text-center py-8">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No sessions yet</h3>
            <p className="text-sm text-slate-500 mb-4">Create your first session to start your adventure</p>
            <Button
              onClick={handleNewSession}
              disabled={isCreating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/dashboard/campaigns/${campaignId}/sessions/${session.id}`)}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-lg hover:bg-slate-800/80 hover:border-teal-500/30 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-200 group-hover:text-white truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{format(new Date(session.session_date), 'MMM d, yyyy')}</span>
                      {session.duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration_minutes)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[session.status].color}>
                    {session.status === 'active' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1"></span>
                    )}
                    {statusConfig[session.status].label}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
