'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Target, GripVertical, CheckCircle } from 'lucide-react';

interface DraggableObjectiveProps {
  objective: {
    id: string;
    title: string;
    description?: string;
    status?: string;
    questId: string;
    questName: string;
  };
}

export function DraggableObjective({ objective }: DraggableObjectiveProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `objective-${objective.id}`,
    data: {
      type: 'quest_objective',
      id: objective.id,
      title: objective.title,
      description: objective.description,
      questId: objective.questId,
      questName: objective.questName,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isComplete = objective.status === 'complete';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/50 cursor-grab active:cursor-grabbing transition-colors group ${
        isDragging ? 'ring-2 ring-amber-500 shadow-lg' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="w-3 h-3 text-amber-700 group-hover:text-amber-500" />
      {isComplete ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <Target className="w-4 h-4 text-amber-500" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isComplete ? 'text-slate-500 line-through' : 'text-amber-200'}`}>
          {objective.title}
        </p>
      </div>
    </div>
  );
}
