'use client';

import { useState, useEffect } from 'react';
import { Session, SessionStatus } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, ChevronRight, Scroll } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface SessionsListProps {
  campaignId: string;
}

export function SessionsList({ campaignId }: SessionsListProps): JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

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
        router.push(`/dashboard/campaigns/${campaignId}/sessions/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    setIsCreating(false);
  };

  const statusConfig: Record<SessionStatus, { color: string; label: string }> = {
    planning: { color: 'bg-blue-900/50 text-blue-400', label: 'Planning' },
    active: { color: 'bg-green-900/50 text-green-400', label: 'Live' },
    review: { color: 'bg-amber-900/50 text-amber-400', label: 'Review' },
    archived: { color: 'bg-slate-800 text-slate-400', label: 'Archived' },
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
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">No sessions yet</p>
            <p className="text-slate-600 text-sm mb-4">Start your first session to begin tracking your campaign</p>
            <Button onClick={handleNewSession} disabled={isCreating}>
              <Plus className="w-4 h-4 mr-1" /> Start First Session
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/dashboard/campaigns/${campaignId}/sessions/${session.id}`)}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group"
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
