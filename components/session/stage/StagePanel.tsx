'use client';

import { useCallback } from 'react';
import { Session, SessionEvent } from '@/types/session';
import { LiveLog } from './LiveLog';
import { SmartInput } from './SmartInput';

interface StagePanelProps {
  session: Session;
  campaignId: string;
}

export function StagePanel({ session, campaignId }: StagePanelProps) {
  const handleSend = useCallback(async (event: {
    type: string;
    title?: string;
    description?: string;
    payload?: Record<string, unknown>;
  }) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: event.type,
          title: event.title,
          description: event.description,
          payload: event.payload,
          is_private: event.payload?.isPrivate || false,
        }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        // Add to live log
        const addEvent = (window as Window & { __liveLogAddEvent?: (event: SessionEvent) => void }).__liveLogAddEvent;
        if (addEvent) {
          addEvent(newEvent);
        }
      }
    } catch (error) {
      console.error('Failed to send event:', error);
    }
  }, [session.id]);

  const isActive = session.status === 'active';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            session.status === 'active' ? 'bg-green-500 animate-pulse' :
            session.status === 'review' ? 'bg-amber-500' : 'bg-slate-500'
          }`}></span>
          {session.status === 'planning' ? 'Session Preview' :
           session.status === 'active' ? 'Live Session' :
           session.status === 'review' ? 'Session Review' : 'Session Archive'}
        </h2>
      </div>

      {/* Live Log */}
      <LiveLog sessionId={session.id} campaignId={campaignId} />

      {/* Smart Input - only show when active */}
      {isActive ? (
        <SmartInput onSend={handleSend} />
      ) : (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
          <p className="text-sm text-slate-500">
            {session.status === 'planning'
              ? 'Start the session to enable the event log'
              : 'Session ended - event log is read-only'}
          </p>
        </div>
      )}
    </div>
  );
}
