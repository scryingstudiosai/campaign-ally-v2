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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-0"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={`
          flex items-center justify-center w-6 -mr-1 rounded-l-lg
          cursor-grab active:cursor-grabbing
          ${isDragging ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}
          transition-colors
        `}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>

      {/* Existing Combatant Card */}
      <div className="flex-1">
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
