'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Users, MapPin, Package, Scroll, Shield, Skull, Swords, Sparkles, Crown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EntityNodeData {
  id: string;
  name: string;
  entityType: string;
  subtitle?: string;
  imageUrl?: string;
  status?: string;
  onClick?: (id: string) => void;
}

// Semantic Palette Colors - organized by conceptual groupings
// THE LIVING (Identity): player=amber, npc=sky, deity=fuchsia
// THE THREATS (Danger): creature=rose, encounter=orange
// THE WORLD (Environment): location=emerald, faction=indigo, event=slate
// OBJECTIVES (Rewards): item=violet, quest=cyan
const entityConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  // THE LIVING (Identity)
  player: {
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/50',
  },
  npc: {
    icon: Users,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/50',
  },
  deity: {
    icon: Crown,
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-500/50',
  },
  // THE THREATS (Danger)
  creature: {
    icon: Skull,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/50',
  },
  encounter: {
    icon: Swords,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/50',
  },
  // THE WORLD (Environment)
  location: {
    icon: MapPin,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/50',
  },
  faction: {
    icon: Shield,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/50',
  },
  event: {
    icon: Sparkles,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/50',
  },
  // OBJECTIVES (Rewards)
  item: {
    icon: Package,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/50',
  },
  quest: {
    icon: Scroll,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
  },
};

function EntityNodeComponent({ data, selected }: NodeProps<EntityNodeData>) {
  const config = entityConfig[data.entityType] || {
    icon: HelpCircle,
    color: 'text-stone-400',
    bgColor: 'bg-stone-500/10',
    borderColor: 'border-stone-500/50',
  };

  const Icon = config.icon;
  const isNPC = data.entityType === 'npc';

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-stone-600 !border-stone-500 !w-2 !h-2"
      />

      <div
        onClick={() => data.onClick?.(data.id)}
        className={cn(
          'px-4 py-3 border-2 cursor-pointer transition-all duration-200',
          'hover:scale-105 hover:shadow-lg hover:shadow-black/50',
          config.bgColor,
          config.borderColor,
          isNPC ? 'rounded-full min-w-[140px]' : 'rounded-lg min-w-[160px]',
          selected && 'ring-2 ring-teal-500 ring-offset-2 ring-offset-stone-950',
          'backdrop-blur-sm'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Icon or Image */}
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            config.bgColor,
            'border',
            config.borderColor
          )}>
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={data.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Icon className={cn('w-4 h-4', config.color)} />
            )}
          </div>

          {/* Name & Subtitle */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{data.name}</p>
            {data.subtitle && (
              <p className="text-xs text-stone-400 truncate">{data.subtitle}</p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        {data.status === 'dead' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[10px]">&#128128;</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-stone-600 !border-stone-500 !w-2 !h-2"
      />
    </>
  );
}

export const EntityNode = memo(EntityNodeComponent);
