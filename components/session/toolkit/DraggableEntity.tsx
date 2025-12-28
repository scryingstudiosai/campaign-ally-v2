'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Users, MapPin, Package, Skull, Flag, Sword, GripVertical } from 'lucide-react';

interface DraggableEntityProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
  };
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  npc: { icon: Users, color: 'text-blue-400' },
  player: { icon: Users, color: 'text-green-400' },
  location: { icon: MapPin, color: 'text-emerald-400' },
  item: { icon: Package, color: 'text-amber-400' },
  creature: { icon: Skull, color: 'text-red-400' },
  faction: { icon: Flag, color: 'text-purple-400' },
  quest: { icon: Sword, color: 'text-teal-400' },
};

export function DraggableEntity({ entity }: DraggableEntityProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entity.id,
    data: {
      id: entity.id,
      name: entity.name,
      entityType: entity.entity_type,
    },
  });

  const config = typeConfig[entity.entity_type] || typeConfig.npc;
  const Icon = config.icon;

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors group ${
        isDragging ? 'ring-2 ring-teal-500 shadow-lg' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
      <Icon className={`w-4 h-4 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{entity.name}</p>
        {entity.sub_type && (
          <p className="text-xs text-slate-500 truncate">{entity.sub_type}</p>
        )}
      </div>
    </div>
  );
}
