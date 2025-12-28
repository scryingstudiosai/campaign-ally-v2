'use client';

import { useCallback, useEffect } from 'react';
import { Session, SessionEvent } from '@/types/session';
import { LiveLog } from './LiveLog';
import { SmartInput } from './SmartInput';
import { CombatTracker } from '../combat/CombatTracker';
import { useCombat } from '@/hooks/useCombat';

interface StagePanelProps {
  session: Session;
  campaignId: string;
}

export function StagePanel({ session, campaignId }: StagePanelProps) {
  const {
    combatState,
    isLoading,
    startCombat,
    endCombat,
    loadCombat,
    nextTurn,
    previousTurn,
    updateHp,
    updateInitiative,
    toggleCondition,
    addCombatant,
    removeCombatant,
    reorderCombatants,
  } = useCombat({
    sessionId: session.id,
    campaignId,
    onCombatEvent: handleCombatEvent,
  });

  // Load existing combat state from session
  useEffect(() => {
    if (session.combat_state && !combatState) {
      loadCombat(session.combat_state);
    }
  }, [session.combat_state, combatState, loadCombat]);

  // Listen for trigger-start-combat events from encounter nodes
  useEffect(() => {
    const handleTriggerCombat = (event: Event) => {
      const customEvent = event as CustomEvent<{ encounterId: string }>;
      const { encounterId } = customEvent.detail;
      console.log('Starting combat with encounter:', encounterId);
      startCombat(encounterId);
    };

    window.addEventListener('trigger-start-combat', handleTriggerCombat);
    return () => {
      window.removeEventListener('trigger-start-combat', handleTriggerCombat);
    };
  }, [startCombat]);

  // Handle combat events (log to session_events)
  function handleCombatEvent(event: { type: string; title: string; description: string; payload: Record<string, unknown> }) {
    fetch(`/api/sessions/${session.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: event.type,
        title: event.title,
        description: event.description,
        payload: event.payload,
      }),
    }).catch(console.error);
  }

  const handleSend = useCallback(async (event: {
    type: string;
    title?: string;
    description?: string;
    payload?: Record<string, unknown>;
  }) => {
    // Check for combat commands
    if (event.type === 'custom' && event.payload?.forgeType === 'combat') {
      await startCombat();
      return;
    }

    console.log('=== STAGE PANEL DEBUG ===');
    console.log('Received event:', event);
    console.log('Session ID:', session.id);

    try {
      const body = {
        event_type: event.type,
        title: event.title,
        description: event.description,
        payload: event.payload,
        is_private: event.payload?.isPrivate || false,
      };
      console.log('POST body:', body);

      const response = await fetch(`/api/sessions/${session.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const newEvent = await response.json();
        console.log('New event from API:', newEvent);
        // Add to live log
        const addEvent = (window as Window & { __liveLogAddEvent?: (event: SessionEvent) => void }).__liveLogAddEvent;
        if (addEvent) {
          addEvent(newEvent);
        } else {
          console.warn('__liveLogAddEvent not found on window');
        }
      } else {
        const errorText = await response.text();
        console.error('API error:', errorText);
      }
    } catch (error) {
      console.error('Failed to send event:', error);
    }
  }, [session.id, startCombat]);

  const isActive = session.status === 'active';

  // Render Combat Tracker if combat is active
  if (combatState?.isActive) {
    return (
      <CombatTracker
        combatState={combatState}
        campaignId={campaignId}
        onNextTurn={nextTurn}
        onPreviousTurn={previousTurn}
        onEndCombat={endCombat}
        onHpChange={updateHp}
        onInitiativeChange={updateInitiative}
        onConditionToggle={toggleCondition}
        onAddCombatant={addCombatant}
        onRemoveCombatant={removeCombatant}
        onReorderCombatants={reorderCombatants}
      />
    );
  }

  // Render Live Log (default)
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
        <SmartInput
          onSend={handleSend}
          onStartCombat={() => startCombat()}
        />
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
