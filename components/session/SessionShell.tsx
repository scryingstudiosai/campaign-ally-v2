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
import { PlaybookContainer } from './playbook/PlaybookContainer';
import { ToolkitPanel } from './toolkit/ToolkitPanel';
import { StagePanel } from './stage/StagePanel';
import { Entity } from './toolkit/LibraryPanel';
import { rollInitiative } from '@/lib/dice';

interface SessionShellProps {
  session: Session;
  campaignId: string;
}

export function SessionShell({ session, campaignId }: SessionShellProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCombatActive, setIsCombatActive] = useState(!!session.combat_state);
  const [usePlaybook, setUsePlaybook] = useState(true); // New block-based playbook

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

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

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.data.current) return;

    const data = active.data.current;

    // Check if dropping into combat zone
    if (over.id === 'combat-drop-zone' && isCombatActive) {
      const entityType = data.entityType as string;
      if (data.entity && ['npc', 'creature', 'player'].includes(entityType)) {
        handleAddEntityToCombat(data.entity as Entity);
        return;
      }
    }

    // Check if dropping into session planner
    if (over.id === 'session-planner-editor') {
      const entityType = (data.entityType as string)?.toLowerCase();

      // Get editor to check cursor depth
      type EditorInstance = {
        state: {
          selection: { from: number };
          doc: { resolve: (pos: number) => { depth: number } };
        };
      };
      const editor = (window as Window & {
        __sessionPlannerEditor?: EditorInstance;
      }).__sessionPlannerEditor;

      // Check if cursor is at root level (not inside a block)
      // depth 0 = doc, depth 1 = direct child of doc (root level)
      let isAtRootLevel = true;
      if (editor?.state) {
        try {
          const { from } = editor.state.selection;
          const $pos = editor.state.doc.resolve(from);
          isAtRootLevel = $pos.depth <= 1;
        } catch {
          // If we can't determine depth, assume root level
          isAtRootLevel = true;
        }
      }

      // Check if this is a quest objective
      if (data.type === 'quest_objective') {
        const objectiveData = {
          id: data.id as string,
          title: data.title as string,
          description: data.description as string | undefined,
          questId: data.questId as string,
          questName: data.questName as string,
        };

        if (isAtRootLevel) {
          // At root level - create a QuestBlock with the objective inside
          const insertQuestBlockWithObjective = (window as Window & {
            __sessionPlannerInsertQuestBlockWithObjective?: (objective: {
              id: string;
              title: string;
              description?: string;
              questId: string;
              questName: string;
            }) => void;
          }).__sessionPlannerInsertQuestBlockWithObjective;

          if (insertQuestBlockWithObjective) {
            insertQuestBlockWithObjective(objectiveData);
          }
        } else {
          // Inside a block - just insert the objective node
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
            insertObjective(objectiveData);
          }
        }
      } else if (entityType === 'encounter') {
        if (isAtRootLevel) {
          // Insert encounter as a block at root level
          const insertEncounterBlock = (window as Window & {
            __sessionPlannerInsertEncounterBlock?: (encounter: {
              id: string;
              name: string;
              creatures?: Array<{ name: string; count: number; cr?: string }>;
              difficulty?: string;
            }) => void;
          }).__sessionPlannerInsertEncounterBlock;

          if (insertEncounterBlock && data.entity) {
            const entity = data.entity as Entity;
            insertEncounterBlock({
              id: entity.id,
              name: entity.name,
              creatures: entity.mechanics?.creatures as Array<{ name: string; count: number; cr?: string }> || [],
              difficulty: entity.mechanics?.difficulty as string || 'medium',
            });
          }
        } else {
          // Inside a block - insert as entity mention
          const insertEntity = (window as Window & {
            __sessionPlannerInsertEntity?: (entity: { id: string; name: string; entityType: string }) => void;
          }).__sessionPlannerInsertEntity;

          if (insertEntity && data.entity) {
            const entity = data.entity as Entity;
            insertEntity({
              id: entity.id,
              name: entity.name,
              entityType: 'encounter',
            });
          }
        }
      } else if (entityType === 'quest') {
        if (isAtRootLevel) {
          // Insert quest as a block at root level
          const insertQuestBlock = (window as Window & {
            __sessionPlannerInsertQuestBlock?: (quest: {
              id: string;
              name: string;
              objectives?: Array<{ id: string; text: string; completed?: boolean }>;
            }) => void;
          }).__sessionPlannerInsertQuestBlock;

          if (insertQuestBlock && data.entity) {
            const entity = data.entity as Entity;
            const objectives = entity.mechanics?.objectives || entity.brain?.objectives || [];
            insertQuestBlock({
              id: entity.id,
              name: entity.name,
              objectives: (objectives as Array<{ id?: string; title?: string; text?: string; status?: string }>).map(obj => ({
                id: obj.id || crypto.randomUUID(),
                text: obj.title || obj.text || '',
                completed: obj.status === 'complete',
              })),
            });
          }
        } else {
          // Inside a block - insert as entity mention
          const insertEntity = (window as Window & {
            __sessionPlannerInsertEntity?: (entity: { id: string; name: string; entityType: string }) => void;
          }).__sessionPlannerInsertEntity;

          if (insertEntity && data.entity) {
            const entity = data.entity as Entity;
            insertEntity({
              id: entity.id,
              name: entity.name,
              entityType: 'quest',
            });
          }
        }
      } else {
        // Regular entity - insert as inline mention
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
  }, [isCombatActive, handleAddEntityToCombat]);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  // Listen for run-encounter events from prep notes
  useEffect(() => {
    interface EncounterCreature {
      srdId?: string;
      entityId?: string;
      name: string;
      count: number;
    }

    const handleRunEncounter = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id: string;
        name: string;
        creatures?: EncounterCreature[];
      }>;
      const { id, name, creatures } = customEvent.detail;
      console.log('Running encounter:', name, 'ID:', id, 'Creatures:', creatures);

      // Dispatch event for StagePanel to start combat with this encounter
      window.dispatchEvent(new CustomEvent('trigger-start-combat', {
        detail: { encounterId: id, creatures }
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Session Playbook
                  </h2>
                  <button
                    onClick={() => setUsePlaybook(!usePlaybook)}
                    className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {usePlaybook ? 'Switch to Notes' : 'Switch to Blocks'}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {usePlaybook ? (
                    <PlaybookContainer sessionId={currentSession.id} />
                  ) : (
                    <SessionPlanner
                      sessionId={currentSession.id}
                      initialContent={currentSession.prep_content}
                      onContentChange={(content) => {
                        setCurrentSession(prev => ({ ...prev, prep_content: content as Session['prep_content'] }));
                      }}
                    />
                  )}
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

    </DndContext>
  );
}
