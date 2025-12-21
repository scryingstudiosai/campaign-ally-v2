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
} from 'lucide-react'

export type EntityType = 'npc' | 'location' | 'item' | 'faction' | 'quest' | 'other'
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

// Subtype-specific config for NPCs
const NPC_SUBTYPE_CONFIG: Record<string, TypeConfig> = {
  villain: {
    label: 'Villain',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
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

const TYPE_CONFIG: Record<EntityType, TypeConfig> = {
  npc: {
    label: 'NPC',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    icon: User,
  },
  location: {
    label: 'Location',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: MapPin,
  },
  item: {
    label: 'Item',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    icon: Sword,
  },
  faction: {
    label: 'Faction',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: Users,
  },
  quest: {
    label: 'Quest',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: Scroll,
  },
  other: {
    label: 'Other',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
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
