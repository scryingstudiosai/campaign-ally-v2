'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CombatState, Condition, Combatant } from '@/types/combat';
import { SortableCombatantCard } from './SortableCombatantCard';
import { AddCombatantDialog, NewCombatantData } from './AddCombatantDialog';
import { Button } from '@/components/ui/button';
import {
  Swords, SkipForward, SkipBack, Flag, Plus,
  Trophy, Scroll, Users
} from 'lucide-react';

interface CombatTrackerProps {
  combatState: CombatState;
  campaignId: string;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onEndCombat: (generateLoot: boolean) => void;
  onHpChange: (combatantId: string, change: number, isDamage: boolean) => void;
  onInitiativeChange: (combatantId: string, value: number) => void;
  onConditionToggle: (combatantId: string, condition: Condition) => void;
  onAddCombatant: (combatant: NewCombatantData) => void;
  onRemoveCombatant: (combatantId: string) => void;
  onReorderCombatants: (combatants: Combatant[]) => void;
}

export function CombatTracker({
  combatState,
  campaignId,
  onNextTurn,
  onPreviousTurn,
  onEndCombat,
  onHpChange,
  onInitiativeChange,
  onConditionToggle,
  onAddCombatant,
  onRemoveCombatant,
  onReorderCombatants,
}: CombatTrackerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Drop zone for entities from library
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'combat-drop-zone',
  });

  const activeCombatant = combatState.combatants[combatState.turnIndex];
  const aliveCount = combatState.combatants.filter(c => !c.isDefeated).length;
  const monstersAlive = combatState.combatants.filter(c => c.type === 'monster' && !c.isDefeated).length;
  const playersAlive = combatState.combatants.filter(c => c.type === 'player' && !c.isDefeated).length;

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = combatState.combatants.findIndex(c => c.id === active.id);
      const newIndex = combatState.combatants.findIndex(c => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCombatants = [...combatState.combatants];
        const [removed] = newCombatants.splice(oldIndex, 1);
        newCombatants.splice(newIndex, 0, removed);
        onReorderCombatants(newCombatants);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Combat Header */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-red-900/20 to-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/50 rounded-lg">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-300">COMBAT</h2>
              <p className="text-sm text-slate-400">
                Round {combatState.round} - {aliveCount} combatants
              </p>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-blue-400">
              <Users className="w-4 h-4 inline mr-1" />
              {playersAlive} Players
            </div>
            <div className="text-red-400">
              <Swords className="w-4 h-4 inline mr-1" />
              {monstersAlive} Enemies
            </div>
          </div>
        </div>

        {/* Current Turn Banner */}
        {activeCombatant && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-medium">Current Turn:</span>
              <span className="text-lg font-bold text-white">{activeCombatant.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousTurn}
                className="border-slate-600"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                onClick={onNextTurn}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Next Turn
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Combatant List with DnD and Drop Zone */}
      <div ref={setDropRef} className={`flex-1 overflow-y-auto p-4 space-y-2 transition-colors ${
        isOver ? 'bg-green-900/20 ring-2 ring-green-500/50 ring-inset' : ''
      }`}>
        {isOver && (
          <div className="flex items-center justify-center gap-2 py-3 text-green-400 text-sm bg-green-900/30 rounded-lg border-2 border-dashed border-green-500/50 animate-pulse">
            <Plus className="w-4 h-4" />
            Drop to add to combat
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={combatState.combatants.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {combatState.combatants.map((combatant, index) => (
              <SortableCombatantCard
                key={combatant.id}
                combatant={combatant}
                isActive={index === combatState.turnIndex}
                onHpChange={(change, isDamage) => onHpChange(combatant.id, change, isDamage)}
                onInitiativeChange={(value) => onInitiativeChange(combatant.id, value)}
                onConditionToggle={(condition) => onConditionToggle(combatant.id, condition)}
                onRemove={() => onRemoveCombatant(combatant.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Combat Footer */}
      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          {/* Add Combatant */}
          <Button
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="border-slate-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Combatant
          </Button>

          {/* Combat Log Toggle */}
          <Button variant="ghost" className="text-slate-400">
            <Scroll className="w-4 h-4 mr-1" />
            Combat Log ({combatState.combatLog.length})
          </Button>

          {/* End Combat */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEndCombat(false)}
              className="border-slate-600 text-slate-400"
            >
              <Flag className="w-4 h-4 mr-1" />
              End (No Loot)
            </Button>
            <Button
              onClick={() => onEndCombat(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Victory & Loot
            </Button>
          </div>
        </div>
      </div>

      {/* Add Combatant Dialog */}
      <AddCombatantDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        campaignId={campaignId}
        onAddCombatant={(data) => {
          onAddCombatant(data);
          // Keep dialog open for adding more
        }}
      />
    </div>
  );
}
