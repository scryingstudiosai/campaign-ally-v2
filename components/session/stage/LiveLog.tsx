'use client';

import { useState, useEffect, useRef } from 'react';
import { SessionEvent } from '@/types/session';
import { EventCard } from './EventCard';
import { Loader2 } from 'lucide-react';

interface LiveLogProps {
  sessionId: string;
  campaignId: string;
}

export function LiveLog({ sessionId }: LiveLogProps) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/events`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
      setIsLoading(false);
    };

    fetchEvents();
  }, [sessionId]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (isAtBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Track scroll position
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  // Add new event (called from parent)
  const addEvent = (event: SessionEvent) => {
    setEvents(prev => [...prev, event]);
  };

  // Expose addEvent for parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { __liveLogAddEvent?: typeof addEvent }).__liveLogAddEvent = addEvent;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as Window & { __liveLogAddEvent?: typeof addEvent }).__liveLogAddEvent;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {events.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="mb-2">No events yet</p>
          <p className="text-xs">Start the session and use the input below to log events</p>
        </div>
      ) : (
        events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))
      )}
    </div>
  );
}
