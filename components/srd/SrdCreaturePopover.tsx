'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2 } from 'lucide-react'
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

  // Calculate ability modifier
  const getModifier = (score: number | undefined): string => {
    if (score === undefined) return '+0'
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  // Format saving throws
  const formatSaves = (saves: Record<string, number> | undefined): string => {
    if (!saves || Object.keys(saves).length === 0) return ''
    const statNames: Record<string, string> = {
      str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha'
    }
    return Object.entries(saves)
      .map(([stat, bonus]) => `${statNames[stat] || stat} ${bonus >= 0 ? '+' : ''}${bonus}`)
      .join(', ')
  }

  // Format skills
  const formatSkills = (skills: Record<string, number> | undefined): string => {
    if (!skills || Object.keys(skills).length === 0) return ''
    return Object.entries(skills)
      .map(([skill, bonus]) => `${skill} ${bonus >= 0 ? '+' : ''}${bonus}`)
      .join(', ')
  }

  // Format senses
  const formatSenses = (senses: Record<string, number | string> | undefined): string => {
    if (!senses || Object.keys(senses).length === 0) return ''
    return Object.entries(senses)
      .map(([sense, value]) => {
        if (typeof value === 'number') {
          return `${sense} ${value} ft.`
        }
        return `${sense} ${value}`
      })
      .join(', ')
  }

  // Format speeds
  const formatSpeeds = (speeds: Record<string, number> | undefined): string => {
    if (!speeds) return '30 ft.'
    return Object.entries(speeds)
      .map(([type, speed]) => {
        if (type === 'walk') return `${speed} ft.`
        return `${type} ${speed} ft.`
      })
      .join(', ')
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 bg-slate-900 border-slate-700"
        align="end"
        side="left"
      >
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
          <div className="max-h-[500px] overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* ===== HEADER ===== */}
              <div className="border-b-2 border-red-800 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-red-400">{creature.name}</h3>
                  <SrdBadge license={creature.license} />
                </div>
                <p className="text-xs text-slate-400 italic">
                  {creature.size} {creature.creature_type}
                  {creature.subtype && ` (${creature.subtype})`}
                  {creature.alignment && `, ${creature.alignment}`}
                </p>
              </div>

              {/* ===== CORE STATS: AC, HP, Speed ===== */}
              <div className="space-y-1 text-sm border-b border-red-800/50 pb-3">
                <p>
                  <span className="font-bold text-red-400">Armor Class</span>{' '}
                  <span className="text-slate-200">
                    {creature.ac || '10'}
                    {creature.ac_type && ` (${creature.ac_type})`}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-red-400">Hit Points</span>{' '}
                  <span className="text-slate-200">
                    {creature.hp || '0'}
                    {creature.hp_formula && ` (${creature.hp_formula})`}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-red-400">Speed</span>{' '}
                  <span className="text-slate-200">{formatSpeeds(creature.speeds)}</span>
                </p>
              </div>

              {/* ===== ABILITY SCORES ===== */}
              {creature.stats && (
                <div className="border-b border-red-800/50 pb-3">
                  <div className="grid grid-cols-6 gap-1 text-center text-xs">
                    {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                      <div key={stat} className="bg-slate-800/50 p-1.5 rounded">
                        <span className="text-red-400 uppercase font-bold text-[10px]">{stat}</span>
                        <p className="font-bold text-slate-200">
                          {creature.stats?.[stat] || 10} ({getModifier(creature.stats?.[stat])})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== PROFICIENCIES & TRAITS ===== */}
              <div className="space-y-1 text-sm border-b border-red-800/50 pb-3">
                {/* Saving Throws */}
                {creature.saves && Object.keys(creature.saves).length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Saving Throws</span>{' '}
                    <span className="text-slate-200">{formatSaves(creature.saves)}</span>
                  </p>
                )}

                {/* Skills */}
                {creature.skills && Object.keys(creature.skills).length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Skills</span>{' '}
                    <span className="text-slate-200">{formatSkills(creature.skills)}</span>
                  </p>
                )}

                {/* Damage Vulnerabilities */}
                {creature.damage_vulnerabilities && creature.damage_vulnerabilities.length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Damage Vulnerabilities</span>{' '}
                    <span className="text-slate-200">{creature.damage_vulnerabilities.join(', ')}</span>
                  </p>
                )}

                {/* Damage Resistances */}
                {creature.damage_resistances && creature.damage_resistances.length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Damage Resistances</span>{' '}
                    <span className="text-slate-200">{creature.damage_resistances.join(', ')}</span>
                  </p>
                )}

                {/* Damage Immunities */}
                {creature.damage_immunities && creature.damage_immunities.length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Damage Immunities</span>{' '}
                    <span className="text-slate-200">{creature.damage_immunities.join(', ')}</span>
                  </p>
                )}

                {/* Condition Immunities */}
                {creature.condition_immunities && creature.condition_immunities.length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Condition Immunities</span>{' '}
                    <span className="text-slate-200">{creature.condition_immunities.join(', ')}</span>
                  </p>
                )}

                {/* Senses */}
                {creature.senses && Object.keys(creature.senses).length > 0 && (
                  <p>
                    <span className="font-bold text-red-400">Senses</span>{' '}
                    <span className="text-slate-200">{formatSenses(creature.senses)}</span>
                  </p>
                )}

                {/* Languages */}
                <p>
                  <span className="font-bold text-red-400">Languages</span>{' '}
                  <span className="text-slate-200">
                    {creature.languages && creature.languages.length > 0
                      ? creature.languages.join(', ')
                      : '—'}
                  </span>
                </p>

                {/* Challenge */}
                <p>
                  <span className="font-bold text-red-400">Challenge</span>{' '}
                  <span className="text-slate-200">
                    {creature.cr || '0'}
                    {creature.xp_value && ` (${creature.xp_value.toLocaleString()} XP)`}
                  </span>
                </p>
              </div>

              {/* ===== SPECIAL TRAITS ===== */}
              {creature.traits && creature.traits.length > 0 && (
                <div className="space-y-2 border-b border-red-800/50 pb-3">
                  {creature.traits.map((trait, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{trait.name}.</span>{' '}
                        <span className="text-slate-300">{trait.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== ACTIONS ===== */}
              {creature.actions && creature.actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-400 border-b border-red-800 pb-1">Actions</h4>
                  {creature.actions.map((action, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{action.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== BONUS ACTIONS ===== */}
              {creature.bonus_actions && creature.bonus_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-400 border-b border-red-800 pb-1">Bonus Actions</h4>
                  {creature.bonus_actions.map((action, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{action.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== REACTIONS ===== */}
              {creature.reactions && creature.reactions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-400 border-b border-red-800 pb-1">Reactions</h4>
                  {creature.reactions.map((reaction, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{reaction.name}.</span>{' '}
                        <span className="text-slate-300">{reaction.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== LEGENDARY ACTIONS ===== */}
              {creature.legendary_actions && creature.legendary_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-400 border-b border-red-800 pb-1">Legendary Actions</h4>
                  {creature.legendary_description && (
                    <p className="text-sm text-slate-300 italic">{creature.legendary_description}</p>
                  )}
                  {creature.legendary_actions.map((action, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{action.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
