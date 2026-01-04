'use client'

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const ENTITY_COLORS: Record<string, string> = {
  npc: 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30',
  location: 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30',
  item: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30',
  faction: 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30',
  creature: 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30',
  quest: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30',
  encounter: 'bg-pink-500/20 text-pink-400 border-pink-500/50 hover:bg-pink-500/30',
}

interface EntityBadgeProps {
  name: string
  type: string
  onRemove?: () => void
  onClick?: () => void
}

export function EntityBadge({ name, type, onRemove, onClick }: EntityBadgeProps): JSX.Element {
  return (
    <Badge
      variant="outline"
      className={`${ENTITY_COLORS[type] || 'bg-zinc-500/20 text-zinc-400'} cursor-pointer inline-flex items-center gap-1`}
      onClick={onClick}
    >
      <span>@{name}</span>
      {onRemove && (
        <X
          className="h-3 w-3 hover:text-white"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      )}
    </Badge>
  )
}
