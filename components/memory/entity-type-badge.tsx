'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  User,
  MapPin,
  Sword,
  Users,
  Scroll,
  HelpCircle,
  Skull,
  Shield,
  Swords,
  Bug,
  Crown,
  BookOpen,
  Sun,
} from 'lucide-react'

export type EntityType = 'npc' | 'player' | 'location' | 'item' | 'faction' | 'quest' | 'encounter' | 'creature' | 'event' | 'deity' | 'other'
export type EntitySubType = 'standard' | 'villain' | 'hero' | string

interface EntityTypeBadgeProps {
  type: EntityType
  subtype?: EntitySubType
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface TypeConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof User
}

// Subtype-specific config for NPCs (villain=threat-like, hero=player-like)
const NPC_SUBTYPE_CONFIG: Record<string, TypeConfig> = {
  villain: {
    label: 'Villain',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: Skull,
  },
  hero: {
    label: 'Hero',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Shield,
  },
}

// Semantic Palette Colors - organized by conceptual groupings
// THE LIVING (Identity): player=amber, npc=sky, deity=fuchsia
// THE THREATS (Danger): creature=rose, encounter=orange
// THE WORLD (Environment): location=emerald, faction=indigo, event=slate
// OBJECTIVES (Rewards): item=violet, quest=cyan
const TYPE_CONFIG: Record<EntityType, TypeConfig> = {
  // THE LIVING (Identity)
  player: {
    label: 'Player',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: Crown,
  },
  npc: {
    label: 'NPC',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/30',
    icon: User,
  },
  deity: {
    label: 'Deity',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/30',
    icon: Sun,
  },
  // THE THREATS (Danger)
  creature: {
    label: 'Creature',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30',
    icon: Bug,
  },
  encounter: {
    label: 'Encounter',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: Swords,
  },
  // THE WORLD (Environment)
  location: {
    label: 'Location',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: MapPin,
  },
  faction: {
    label: 'Faction',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    icon: Users,
  },
  event: {
    label: 'Lore',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    icon: BookOpen,
  },
  // OBJECTIVES (Rewards)
  item: {
    label: 'Item',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    icon: Sword,
  },
  quest: {
    label: 'Quest',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: Scroll,
  },
  other: {
    label: 'Other',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    icon: HelpCircle,
  },
}

export function EntityTypeBadge({
  type,
  subtype,
  showIcon = true,
  size = 'md',
  className,
}: EntityTypeBadgeProps): JSX.Element {
  // For NPCs, check if there's a subtype-specific config
  const config = type === 'npc' && subtype && NPC_SUBTYPE_CONFIG[subtype]
    ? NPC_SUBTYPE_CONFIG[subtype]
    : TYPE_CONFIG[type] || TYPE_CONFIG.other
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        'flex items-center gap-1 font-medium',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}

export function getEntityTypeColor(type: EntityType): string {
  return TYPE_CONFIG[type]?.color || TYPE_CONFIG.other.color
}

export function getEntityTypeBgColor(type: EntityType): string {
  return TYPE_CONFIG[type]?.bgColor || TYPE_CONFIG.other.bgColor
}
