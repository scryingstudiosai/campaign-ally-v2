'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Type,
  Box,
  Layers,
  Move,
  ArrowUpFromLine,
  Keyboard,
  GripVertical,
  AtSign,
} from 'lucide-react';
import { ReactNode } from 'react';

interface PrepHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HelpSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white">
        <span className="text-teal-400">{icon}</span>
        <h3 className="font-medium">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-slate-300">{description}</p>
      )}
      {children}
    </div>
  );
}

export function PrepHelpDialog({ open, onOpenChange }: PrepHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Session Prep Guide</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-6">
            {/* Font Size */}
            <HelpSection
              icon={<Type className="h-4 w-4" />}
              title="Font Size"
              description="Adjust text size for comfortable reading. Your preference is saved automatically."
            >
              <ul className="text-sm text-slate-400 space-y-1 ml-4 list-disc">
                <li><strong className="text-slate-300">S</strong> = Small - Fit more on screen</li>
                <li><strong className="text-slate-300">M</strong> = Medium - Default</li>
                <li><strong className="text-slate-300">L</strong> = Large - Easier reading during play</li>
              </ul>
            </HelpSection>

            {/* Adding Entities */}
            <HelpSection
              icon={<Box className="h-4 w-4" />}
              title="Adding Entities"
              description="Drag entities from the Library panel to embed them in your notes."
            >
              <ul className="text-sm text-slate-400 space-y-1 ml-4 list-disc">
                <li>Drop anywhere in your notes to create a reference</li>
                <li>Quests and Encounters become full blocks at root level</li>
                <li>NPCs, Locations, Items become inline mentions</li>
              </ul>
            </HelpSection>

            {/* Nesting Entities */}
            <HelpSection
              icon={<Layers className="h-4 w-4" />}
              title="Nesting Entities"
              description="Group related content by nesting entities inside blocks."
            >
              <ol className="text-sm text-slate-400 space-y-1 ml-4 list-decimal">
                <li>Hold <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-300">Shift</kbd> while dragging</li>
                <li>Drop into your notes while holding Shift</li>
                <li>Entities become inline mentions instead of blocks</li>
                <li>Look for the <span className="text-teal-400">[+N]</span> badge showing nested count</li>
              </ol>
              <p className="text-xs text-slate-500 mt-2 italic">
                Tip: Nested count shows how many entities are inside a block.
              </p>
            </HelpSection>

            {/* @ Mentions */}
            <HelpSection
              icon={<AtSign className="h-4 w-4" />}
              title="Quick Mentions"
              description="Type @ to quickly search and insert entity references."
            >
              <p className="text-sm text-slate-400">
                Start typing after @ to filter entities by name. Press Enter or click to insert.
              </p>
            </HelpSection>

            {/* Blocks */}
            <HelpSection
              icon={<Layers className="h-4 w-4" />}
              title="Content Blocks"
              description="Use the Block dropdown to add structured content."
            >
              <ul className="text-sm text-slate-400 space-y-1 ml-4 list-disc">
                <li><span className="text-blue-400">Scene</span> - Roleplay and exploration moments</li>
                <li><span className="text-orange-400">Encounter</span> - Combat with creature lists</li>
                <li><span className="text-purple-400">Quest</span> - Track objectives and milestones</li>
                <li><span className="text-slate-300">Note</span> - DM notes, warnings, secrets, lore</li>
              </ul>
            </HelpSection>

            {/* Moving Blocks */}
            <HelpSection
              icon={<Move className="h-4 w-4" />}
              title="Moving Blocks"
              description="Drag blocks to rearrange your notes."
            >
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                <GripVertical className="h-4 w-4 text-slate-500" />
                <span>Use the grip handle on the left to drag and reorder blocks</span>
              </div>
            </HelpSection>

            {/* Block Status */}
            <HelpSection
              icon={<ArrowUpFromLine className="h-4 w-4" />}
              title="Block Status"
              description="Track your session progress with block statuses."
            >
              <ul className="text-sm text-slate-400 space-y-1 ml-4 list-disc">
                <li><span className="text-slate-300">Pending</span> - Not yet started</li>
                <li><span className="text-blue-400">Active</span> - Currently running</li>
                <li><span className="text-green-400">Completed</span> - Done</li>
                <li><span className="text-slate-500">Skipped</span> - Passed over</li>
              </ul>
            </HelpSection>

            {/* Keyboard Shortcuts */}
            <HelpSection
              icon={<Keyboard className="h-4 w-4" />}
              title="Shortcuts"
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Bold</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Ctrl + B</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Italic</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Ctrl + I</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Undo</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Ctrl + Z</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Redo</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Ctrl + Y</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Entity mention</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">@</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Nest entity (while dragging)</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Shift + Drop</kbd>
                </div>
              </div>
            </HelpSection>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
