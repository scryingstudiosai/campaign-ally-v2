'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  User,
  Bug,
  MapPin,
  Package,
  Users,
  Swords,
  Scroll,
  Crown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ForgeType = 'npc' | 'creature' | 'location' | 'item' | 'faction' | 'encounter' | 'quest' | 'player';

interface ForgeButtonProps {
  href: string;
  forgeType: ForgeType;
  label: string;
}

const FORGE_CONFIG: Record<ForgeType, { icon: typeof User; hover: string; iconColor: string; tooltip: string }> = {
  npc: {
    icon: User,
    hover: 'hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:border-teal-500/30',
    iconColor: 'text-teal-400',
    tooltip: 'Generate memorable characters with secrets and hooks',
  },
  creature: {
    icon: Bug,
    hover: 'hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:border-rose-500/30',
    iconColor: 'text-rose-400',
    tooltip: 'Design monsters and beasts with full stat blocks',
  },
  location: {
    icon: MapPin,
    hover: 'hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:border-emerald-500/30',
    iconColor: 'text-emerald-400',
    tooltip: 'Create immersive places with atmosphere and secrets',
  },
  item: {
    icon: Package,
    hover: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:border-blue-500/30',
    iconColor: 'text-blue-400',
    tooltip: 'Forge unique items with lore and mechanics',
  },
  faction: {
    icon: Users,
    hover: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-orange-500/30',
    iconColor: 'text-orange-400',
    tooltip: 'Build organizations with goals and influence',
  },
  encounter: {
    icon: Swords,
    hover: 'hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:border-amber-500/30',
    iconColor: 'text-amber-400',
    tooltip: 'Design combat, social, or exploration encounters',
  },
  quest: {
    icon: Scroll,
    hover: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:border-purple-500/30',
    iconColor: 'text-purple-400',
    tooltip: 'Create adventures with objectives and rewards',
  },
  player: {
    icon: Crown,
    hover: 'hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:border-yellow-500/40',
    iconColor: 'text-yellow-400',
    tooltip: 'Create a player character with stats and starting gear',
  },
};

export function ForgeButton({ href, forgeType, label }: ForgeButtonProps) {
  const config = FORGE_CONFIG[forgeType];
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg',
                'bg-slate-800/50 border border-white/5',
                'hover:-translate-y-0.5 transition-all duration-200',
                config.hover
              )}
            >
              <Icon className={cn('w-4 h-4', config.iconColor)} />
              <span className="text-sm text-slate-200">{label}</span>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-slate-800 border-white/10 text-xs max-w-[200px]"
        >
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
