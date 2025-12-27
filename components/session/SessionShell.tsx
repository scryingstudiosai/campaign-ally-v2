'use client';

import { useState, useCallback } from 'react';
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

interface SessionShellProps {
  session: Session;
  campaignId: string;
}

export function SessionShell({ session, campaignId }: SessionShellProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      // Insert entity into editor
      const insertEntity = (window as Window & { __sessionPlannerInsertEntity?: (entity: { id: string; name: string; entityType: string }) => void }).__sessionPlannerInsertEntity;
      if (insertEntity) {
        insertEntity({
          id: active.data.current.id as string,
          name: active.data.current.name as string,
          entityType: active.data.current.entityType as string,
        });
      }
    }
  }, []);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
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
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="bg-slate-800 border border-teal-500 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm text-slate-200">Dragging entity...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
