'use client';

import { useState, useCallback, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Session } from '@/types/session';
import { SessionHeader } from './SessionHeader';
import { SessionPlanner } from './planner/SessionPlanner';
import { ToolkitPanel } from './toolkit/ToolkitPanel';
import { StagePanel } from './stage/StagePanel';
import { EntityQuickView } from './EntityQuickView';
import { Entity } from './toolkit/LibraryPanel';
import { rollInitiative } from '@/lib/dice';

interface SessionShellProps {
  session: Session;
  campaignId: string;
}

export function SessionShell({ session, campaignId }: SessionShellProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quickViewEntityId, setQuickViewEntityId] = useState<string | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isCombatActive, setIsCombatActive] = useState(!!session.combat_state);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over?.id === 'session-planner-editor' && active.data.current) {
      const data = active.data.current;

      // Check if this is a quest objective
      if (data.type === 'quest_objective') {
        const insertObjective = (window as Window & {
          __sessionPlannerInsertObjective?: (objective: {
            id: string;
            title: string;
            description?: string;
            questId: string;
            questName: string;
          }) => void;
        }).__sessionPlannerInsertObjective;

        if (insertObjective) {
          insertObjective({
            id: data.id as string,
            title: data.title as string,
            description: data.description as string | undefined,
            questId: data.questId as string,
            questName: data.questName as string,
          });
        }
      } else {
        // Regular entity
        const insertEntity = (window as Window & {
          __sessionPlannerInsertEntity?: (entity: { id: string; name: string; entityType: string }) => void;
        }).__sessionPlannerInsertEntity;

        if (insertEntity) {
          insertEntity({
            id: data.id as string,
            name: data.name as string,
            entityType: data.entityType as string,
          });
        }
      }
    }
  }, []);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  // Listen for entity quick view events
  useEffect(() => {
    const handleOpenQuickView = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; name: string; entityType: string }>;
      const { id } = customEvent.detail;
      console.log('Opening quick view for entity:', id);
      setQuickViewEntityId(id);
      setShowQuickView(true);
    };

    window.addEventListener('open-entity-quickview', handleOpenQuickView);
    return () => {
      window.removeEventListener('open-entity-quickview', handleOpenQuickView);
    };
  }, []);

  // Listen for run-encounter events from prep notes
  useEffect(() => {
    const handleRunEncounter = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; name: string }>;
      const { id, name } = customEvent.detail;
      console.log('Running encounter:', name, 'ID:', id);

      // Dispatch event for StagePanel to start combat with this encounter
      window.dispatchEvent(new CustomEvent('trigger-start-combat', {
        detail: { encounterId: id }
      }));
    };

    window.addEventListener('run-encounter', handleRunEncounter);
    return () => {
      window.removeEventListener('run-encounter', handleRunEncounter);
    };
  }, []);

  // Listen for combat state changes
  useEffect(() => {
    const handleCombatStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isActive: boolean }>;
      setIsCombatActive(customEvent.detail.isActive);
    };

    window.addEventListener('combat-state-change', handleCombatStateChange);
    return () => {
      window.removeEventListener('combat-state-change', handleCombatStateChange);
    };
  }, []);

  // Handle adding entity to combat from library
  const handleAddEntityToCombat = useCallback((entity: Entity) => {
    const dex = entity.mechanics?.abilities?.dex || 10;
    const dexMod = Math.floor((dex - 10) / 2);
    const initiative = rollInitiative(dexMod);
    const hp = entity.mechanics?.hp_current || entity.mechanics?.hp_max || entity.mechanics?.hp || 10;

    const combatant = {
      id: `${entity.entity_type}-${entity.id}-${Date.now()}`,
      entityId: entity.id,
      name: entity.name,
      displayName: entity.name,
      type: entity.entity_type === 'player' ? 'player' as const :
            entity.entity_type === 'npc' ? 'npc' as const : 'monster' as const,
      initiative,
      initiativeModifier: dexMod,
      hp,
      maxHp: entity.mechanics?.hp_max || hp,
      ac: entity.mechanics?.ac || 10,
      statBlock: entity.mechanics,
      fullEntity: entity,
    };

    // Dispatch event for StagePanel/useCombat to add the combatant
    window.dispatchEvent(new CustomEvent('add-entity-to-combat', {
      detail: combatant
    }));
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
        {/* Top HUD */}
        <SessionHeader
          session={currentSession}
          campaignId={campaignId}
          onSessionUpdate={setCurrentSession}
        />

        {/* 3-Column Layout */}
        <div className="flex-1 h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel: The Plan */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full bg-slate-900 border-r border-slate-800 p-4 overflow-hidden flex flex-col">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Session Prep
                </h2>
                <div className="flex-1 overflow-hidden">
                  <SessionPlanner
                    sessionId={currentSession.id}
                    initialContent={currentSession.prep_content}
                    onContentChange={(content) => {
                      setCurrentSession(prev => ({ ...prev, prep_content: content as Session['prep_content'] }));
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Panel: The Stage */}
            <ResizablePanel defaultSize={45} minSize={30}>
              <div className="h-full bg-slate-950 overflow-hidden">
                <StagePanel session={currentSession} campaignId={campaignId} />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel: The Toolkit */}
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full bg-slate-900 border-l border-slate-800 overflow-hidden">
                <ToolkitPanel
                  campaignId={campaignId}
                  sessionStatus={currentSession.status}
                  isCombatActive={isCombatActive}
                  onAddToCombat={handleAddEntityToCombat}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className={`rounded-lg px-3 py-2 shadow-lg border ${
            activeId.toString().startsWith('objective-')
              ? 'bg-amber-900/90 border-amber-500 text-amber-200'
              : 'bg-slate-800 border-teal-500 text-slate-200'
          }`}>
            <span className="text-sm">
              {activeId.toString().startsWith('objective-') ? '🎯 ' : ''}
              Dragging...
            </span>
          </div>
        ) : null}
      </DragOverlay>

      {/* Entity Quick View Modal */}
      <EntityQuickView
        entityId={quickViewEntityId}
        isOpen={showQuickView}
        onClose={() => {
          setShowQuickView(false);
          setQuickViewEntityId(null);
        }}
        campaignId={campaignId}
      />
    </DndContext>
  );
}
