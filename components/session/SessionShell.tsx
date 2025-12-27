'use client';

import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Session } from '@/types/session';
import { SessionHeader } from './SessionHeader';
import { GripVertical } from 'lucide-react';

interface SessionShellProps {
  session: Session;
  campaignId: string;
}

export function SessionShell({ session, campaignId }: SessionShellProps): JSX.Element {
  const [currentSession, setCurrentSession] = useState(session);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Top HUD */}
      <SessionHeader
        session={currentSession}
        campaignId={campaignId}
        onSessionUpdate={setCurrentSession}
      />

      {/* 3-Column Layout */}
      <Group orientation="horizontal" className="flex-1">
        {/* Left Panel: The Plan */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              The Plan
            </h2>
            <div className="text-slate-500 text-sm">
              {currentSession.status === 'planning' ? (
                <p>Prep content will appear here...</p>
              ) : (
                <p>Reference your prep notes during play</p>
              )}
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <Separator className="w-2 bg-slate-800 hover:bg-teal-900/50 transition-colors flex items-center justify-center group">
          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-teal-400" />
        </Separator>

        {/* Center Panel: The Stage */}
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full bg-slate-950 border-x border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  currentSession.status === 'active' ? 'bg-green-500 animate-pulse' :
                  currentSession.status === 'review' ? 'bg-amber-500' : 'bg-slate-500'
                }`}></span>
                {currentSession.status === 'planning' ? 'Session Prep' :
                 currentSession.status === 'active' ? 'Live Session' :
                 currentSession.status === 'review' ? 'Session Review' : 'Session Archive'}
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-slate-500 text-sm">
                {currentSession.status === 'planning' && (
                  <div className="text-center py-12">
                    <p className="mb-2">Write your session notes and plans here</p>
                    <p className="text-xs text-slate-600">Drag entities from the toolkit to reference them</p>
                  </div>
                )}
                {currentSession.status === 'active' && (
                  <div className="text-center py-12">
                    <p className="mb-2">Live event log will appear here</p>
                    <p className="text-xs text-slate-600">Record what happens during your session</p>
                  </div>
                )}
                {currentSession.status === 'review' && (
                  <div className="text-center py-12">
                    <p className="mb-2">Review and commit session changes</p>
                    <p className="text-xs text-slate-600">AI will help identify consequences</p>
                  </div>
                )}
                {currentSession.status === 'archived' && (
                  <div className="text-center py-12">
                    <p className="mb-2">This session has been archived</p>
                    <p className="text-xs text-slate-600">{currentSession.summary || 'No summary available'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <Separator className="w-2 bg-slate-800 hover:bg-teal-900/50 transition-colors flex items-center justify-center group">
          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-teal-400" />
        </Separator>

        {/* Right Panel: The Toolkit */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Toolkit
            </h2>
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <h3 className="text-xs font-medium text-slate-400 mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                    Roll Dice
                  </button>
                  <button className="px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                    Combat
                  </button>
                  <button className="px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                    Quick NPC
                  </button>
                  <button className="px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                    Location
                  </button>
                </div>
              </div>

              {/* Entity Library Placeholder */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <h3 className="text-xs font-medium text-slate-400 mb-2">Entity Library</h3>
                <p className="text-xs text-slate-500">Drag entities here to add to your notes...</p>
              </div>
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
