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
} from 'lucide-react';

type ForgeType = 'npc' | 'creature' | 'location' | 'item' | 'faction' | 'encounter' | 'quest';

interface ForgeButtonProps {
  href: string;
  forgeType: ForgeType;
  label: string;
}

const FORGE_CONFIG: Record<ForgeType, { icon: typeof User; hover: string; iconColor: string }> = {
  npc: {
    icon: User,
    hover: 'hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:border-teal-500/30',
    iconColor: 'text-teal-400',
  },
  creature: {
    icon: Bug,
    hover: 'hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:border-rose-500/30',
    iconColor: 'text-rose-400',
  },
  location: {
    icon: MapPin,
    hover: 'hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  item: {
    icon: Package,
    hover: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  faction: {
    icon: Users,
    hover: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  encounter: {
    icon: Swords,
    hover: 'hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  quest: {
    icon: Scroll,
    hover: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:border-purple-500/30',
    iconColor: 'text-purple-400',
  },
};

export function ForgeButton({ href, forgeType, label }: ForgeButtonProps) {
  const config = FORGE_CONFIG[forgeType];
  const Icon = config.icon;

  return (
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
  );
}
