'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Combatant, Condition } from '@/types/combat';
import { CombatantCard } from './CombatantCard';
import { GripVertical } from 'lucide-react';

interface SortableCombatantCardProps {
  combatant: Combatant;
  isActive: boolean;
  onHpChange: (change: number, isDamage: boolean) => void;
  onInitiativeChange: (value: number) => void;
  onConditionToggle: (condition: Condition) => void;
  onRemove: () => void;
}

export function SortableCombatantCard({
  combatant,
  isActive,
  onHpChange,
  onInitiativeChange,
  onConditionToggle,
  onRemove,
}: SortableCombatantCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: combatant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="w-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-slate-800 hover:bg-slate-700 rounded-l-lg border-y border-l border-slate-700 flex-shrink-0"
      >
        <GripVertical className="w-3 h-3 text-slate-500" />
      </div>

      {/* Card - remove left border radius since handle is there */}
      <div className="flex-1 [&>div]:rounded-l-none [&>div]:border-l-0">
        <CombatantCard
          combatant={combatant}
          isActive={isActive}
          onHpChange={onHpChange}
          onInitiativeChange={onInitiativeChange}
          onConditionToggle={onConditionToggle}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
