'use client'

import { getEntityStyle } from '@/lib/constants/entity-styles'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
import type { LivingEntity } from '@/types/living-entity'

interface AtlasMarkerProps {
  entity: LivingEntity
  x: number
  y: number
  isRevealed: boolean
  hasActiveQuest?: boolean
  isFocused: boolean
  emphasis: 'full' | 'faded' | 'hidden'
  isDrillDown?: boolean
  onClick: () => void
}

// Shape based on category
const getCategoryShape = (entityType: string): string => {
  const livingTypes = ['npc', 'player', 'deity']
  const threatTypes = ['creature', 'encounter']
  const worldTypes = ['location', 'faction']
  const objectiveTypes = ['item', 'quest']

  if (livingTypes.includes(entityType)) return 'rounded-full' // Circle
  if (threatTypes.includes(entityType)) return 'rotate-45 rounded-sm' // Diamond
  if (worldTypes.includes(entityType)) return 'rounded-md' // Rounded Square
  if (objectiveTypes.includes(entityType)) return 'rounded-md' // Hexagon would need CSS, using rounded for now

  return 'rounded-full'
}

// Get border color class from style
const getBorderColor = (entityType: string): string => {
  const style = getEntityStyle(entityType)
  // Extract the color from the accent class (e.g., 'border-l-amber-500' -> 'border-amber-500')
  return style.accent.replace('border-l-', 'border-')
}

export function AtlasMarker({
  entity,
  x,
  y,
  isRevealed,
  hasActiveQuest = false,
  isFocused,
  emphasis,
  isDrillDown = false,
  onClick,
}: AtlasMarkerProps) {
  const style = getEntityStyle(entity.entity_type)
  const Icon = style.icon
  const shape = getCategoryShape(entity.entity_type)
  const borderColor = getBorderColor(entity.entity_type)

  // Hidden markers don't render
  if (emphasis === 'hidden') return null

  // Rumored (not revealed) markers show as "?"
  const isRumored = !isRevealed

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <HoverCard openDelay={100} closeDelay={50}>
        <HoverCardTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative flex items-center justify-center transition-all duration-300',
              // Size - smaller and more subtle
              'w-5 h-5',
              // Shape
              shape,
              // Base styling
              'shadow-md',
              // Color based on entity type (or gray if rumored)
              isRumored
                ? 'bg-slate-500/80 text-slate-300'
                : `bg-slate-900/90 ${style.text} border`,
              // Border color
              !isRumored && borderColor,
              // Emphasis (lens filtering)
              emphasis === 'faded' && 'opacity-20 pointer-events-none',
              // Focus state
              isFocused && 'ring-2 ring-white/50 scale-150',
              // Hover
              'hover:scale-150 hover:z-20',
              // Drill-down markers get special styling
              isDrillDown && 'ring-1 ring-white/40 w-6 h-6'
            )}
          >
            {/* Icon or ? */}
            {isRumored ? (
              <HelpCircle className="w-3 h-3" />
            ) : (
              <Icon className={cn('w-3 h-3', shape === 'rotate-45 rounded-sm' && '-rotate-45')} />
            )}

            {/* Active Quest Pulse */}
            {hasActiveQuest && !isRumored && (
              <>
                <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border border-slate-900" />
              </>
            )}

            {/* Focus Glow */}
            {isFocused && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />}

            {/* Drill-down indicator - subtle arrow below */}
            {isDrillDown && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[6px] text-teal-400 font-bold">
                ▼
              </div>
            )}
          </button>
        </HoverCardTrigger>

        {/* Hover Card Content */}
        <HoverCardContent
          side="top"
          className="w-64 p-0 overflow-hidden bg-slate-900 border-slate-700"
          sideOffset={8}
        >
          {isRumored ? (
            // Rumored - minimal info
            <div className="p-4 text-center">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Rumored Location</p>
              <p className="text-xs text-slate-600 mt-1">Explore to reveal</p>
            </div>
          ) : (
            // Revealed - full details
            <>
              {/* Image */}
              {entity.attributes?.image_url && (
                <div className="h-24 overflow-hidden">
                  <img
                    src={entity.attributes.image_url as string}
                    alt={entity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-white">{entity.name}</h4>
                    <p className="text-xs text-slate-400">{entity.sub_type || style.label}</p>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full', style.bg, style.text)}>
                    {style.label}
                  </span>
                </div>

                {entity.dm_slug && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{entity.dm_slug}</p>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded transition-colors">
                    Quick View
                  </button>
                  {isDrillDown && (
                    <button className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white py-1.5 rounded transition-colors">
                      Explore →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
