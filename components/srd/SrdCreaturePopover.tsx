'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Shield, Heart, Gauge, Footprints, Loader2 } from 'lucide-react'
import { SrdBadge } from './SrdBadge'
import type { SrdCreature } from '@/types/srd'

interface SrdCreaturePopoverProps {
  creatureId: string
  trigger: ReactNode
  onOpenChange?: (open: boolean) => void
}

export function SrdCreaturePopover({
  creatureId,
  trigger,
  onOpenChange
}: SrdCreaturePopoverProps): JSX.Element {
  const [creature, setCreature] = useState<SrdCreature | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCreature = useCallback(async () => {
    if (creature) return // Already loaded

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/srd/creature/${creatureId}`)
      if (!res.ok) {
        throw new Error('Failed to load creature')
      }
      const data = await res.json()
      setCreature(data)
    } catch (err) {
      console.error('Failed to load creature:', err)
      setError('Failed to load creature stats')
    } finally {
      setLoading(false)
    }
  }, [creatureId, creature])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadCreature()
    }
    onOpenChange?.(open)
  }

  // Format speed for display
  const formatSpeeds = (speeds: Record<string, number> | undefined): string => {
    if (!speeds) return ''
    return Object.entries(speeds)
      .map(([type, speed]) => `${type} ${speed} ft.`)
      .join(', ')
  }

  // Calculate ability modifier
  const getModifier = (score: number | undefined): string => {
    if (score === undefined) return '+0'
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-700" align="end">
        {loading ? (
          <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        ) : creature ? (
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-100">{creature.name}</h3>
                <p className="text-xs text-slate-400">
                  {creature.size} {creature.creature_type}
                  {creature.subtype && ` (${creature.subtype})`}
                  {creature.alignment && `, ${creature.alignment}`}
                </p>
              </div>
              <SrdBadge license={creature.license} />
            </div>

            {/* Quick Stats - AC, HP, CR */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800 p-2 rounded text-center">
                <Shield className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <span className="text-lg font-bold text-slate-100">{creature.ac || '?'}</span>
                <p className="text-[10px] text-slate-500">AC</p>
              </div>
              <div className="bg-slate-800 p-2 rounded text-center">
                <Heart className="w-4 h-4 mx-auto text-red-400 mb-1" />
                <span className="text-lg font-bold text-slate-100">{creature.hp || '?'}</span>
                <p className="text-[10px] text-slate-500">HP</p>
              </div>
              <div className="bg-slate-800 p-2 rounded text-center">
                <Gauge className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <span className="text-lg font-bold text-slate-100">{creature.cr || '?'}</span>
                <p className="text-[10px] text-slate-500">CR</p>
              </div>
            </div>

            {/* Speed */}
            {creature.speeds && Object.keys(creature.speeds).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Footprints className="w-3 h-3 shrink-0" />
                <span className="truncate">{formatSpeeds(creature.speeds)}</span>
              </div>
            )}

            {/* Ability Scores */}
            {creature.stats && (
              <div className="grid grid-cols-6 gap-1 text-center text-xs">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                  <div key={stat} className="bg-slate-800/50 p-1.5 rounded">
                    <span className="text-slate-500 uppercase text-[10px]">{stat}</span>
                    <p className="font-bold text-slate-200">{creature.stats?.[stat] || 10}</p>
                    <p className="text-[10px] text-slate-500">{getModifier(creature.stats?.[stat])}</p>
                  </div>
                ))}
              </div>
            )}

            {/* HP Formula */}
            {creature.hp_formula && (
              <p className="text-[10px] text-slate-500 text-center">
                Hit Dice: {creature.hp_formula}
              </p>
            )}

            {/* XP */}
            {creature.xp_value && (
              <p className="text-xs text-purple-400 text-center">
                {creature.xp_value.toLocaleString()} XP
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-sm">
            Click to load creature stats
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
