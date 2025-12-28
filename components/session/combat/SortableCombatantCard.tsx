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
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Full-width active indicator - covers entire card including drag handle */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-amber-500 bg-amber-900/10 pointer-events-none z-0" />
      )}

      <div className="relative z-10 flex items-stretch">
        {/* Drag Handle - visually integrated with the card */}
        <button
          {...attributes}
          {...listeners}
          className={`
            flex items-center justify-center w-8 rounded-l-lg
            cursor-grab active:cursor-grabbing transition-colors
            ${isActive
              ? 'bg-amber-800/50 hover:bg-amber-700/50'
              : isDragging
                ? 'bg-amber-600'
                : 'bg-slate-800 hover:bg-slate-700'
            }
          `}
          aria-label="Drag to reorder"
        >
          <GripVertical className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
        </button>

        {/* Combatant Card - pass isActive=false since we handle indicator here */}
        <div className="flex-1">
          <CombatantCard
            combatant={combatant}
            isActive={isActive}
            onHpChange={onHpChange}
            onInitiativeChange={onInitiativeChange}
            onConditionToggle={onConditionToggle}
            onRemove={onRemove}
            hideActiveRing={true}
          />
        </div>
      </div>
    </div>
  );
}
