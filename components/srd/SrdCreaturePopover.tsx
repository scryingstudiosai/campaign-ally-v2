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

  // Build saving throws from individual fields, filtering out nulls
  const getSavingThrows = (c: SrdCreature): string => {
    const saves: { name: string; value: number }[] = []

    // Check individual save fields first (Open5e format)
    if (c.strength_save != null) saves.push({ name: 'Str', value: c.strength_save })
    if (c.dexterity_save != null) saves.push({ name: 'Dex', value: c.dexterity_save })
    if (c.constitution_save != null) saves.push({ name: 'Con', value: c.constitution_save })
    if (c.intelligence_save != null) saves.push({ name: 'Int', value: c.intelligence_save })
    if (c.wisdom_save != null) saves.push({ name: 'Wis', value: c.wisdom_save })
    if (c.charisma_save != null) saves.push({ name: 'Cha', value: c.charisma_save })

    // Also check saves object if no individual fields found
    if (saves.length === 0 && c.saves && typeof c.saves === 'object') {
      const statNames: Record<string, string> = {
        str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha'
      }
      Object.entries(c.saves).forEach(([stat, bonus]) => {
        if (bonus != null && typeof bonus === 'number') {
          saves.push({ name: statNames[stat] || stat, value: bonus })
        }
      })
    }

    if (saves.length === 0) return ''
    return saves.map(s => `${s.name} ${s.value >= 0 ? '+' : ''}${s.value}`).join(', ')
  }

  // Format skills - handle string or object, filter nulls
  const getSkills = (c: SrdCreature): string => {
    if (!c.skills) return ''

    // If skills is a string, return it directly
    if (typeof c.skills === 'string') {
      return c.skills
    }

    // If skills is an object, format it
    const skillList: string[] = []
    Object.entries(c.skills).forEach(([skill, bonus]) => {
      if (bonus != null && typeof bonus === 'number') {
        skillList.push(`${skill} ${bonus >= 0 ? '+' : ''}${bonus}`)
      }
    })
    return skillList.join(', ')
  }

  // Format array or string fields
  const formatListField = (field: string[] | string | undefined): string => {
    if (!field) return ''
    if (typeof field === 'string') return field
    return field.join(', ')
  }

  // Format senses - handle string or object
  const getSenses = (c: SrdCreature): string => {
    if (!c.senses) return ''

    if (typeof c.senses === 'string') {
      return c.senses
    }

    return Object.entries(c.senses)
      .map(([sense, value]) => {
        if (typeof value === 'number') {
          return `${sense} ${value} ft.`
        }
        return `${sense} ${value}`
      })
      .join(', ')
  }

  // Format languages - handle string or array
  const getLanguages = (c: SrdCreature): string => {
    if (!c.languages) return '—'
    if (typeof c.languages === 'string') {
      return c.languages || '—'
    }
    return c.languages.length > 0 ? c.languages.join(', ') : '—'
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

  // Get action/trait description (supports both desc and description fields)
  const getDesc = (item: { desc?: string; description?: string }): string => {
    return item.desc || item.description || ''
  }

  // Combine special_abilities and traits
  const getTraits = (c: SrdCreature): Array<{ name: string; desc?: string; description?: string }> => {
    const allTraits: Array<{ name: string; desc?: string; description?: string }> = []
    if (c.special_abilities) allTraits.push(...c.special_abilities)
    if (c.traits) allTraits.push(...c.traits)
    return allTraits
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
                {getSavingThrows(creature) && (
                  <p>
                    <span className="font-bold text-red-400">Saving Throws</span>{' '}
                    <span className="text-slate-200">{getSavingThrows(creature)}</span>
                  </p>
                )}

                {/* Skills */}
                {getSkills(creature) && (
                  <p>
                    <span className="font-bold text-red-400">Skills</span>{' '}
                    <span className="text-slate-200">{getSkills(creature)}</span>
                  </p>
                )}

                {/* Damage Vulnerabilities */}
                {formatListField(creature.damage_vulnerabilities) && (
                  <p>
                    <span className="font-bold text-red-400">Damage Vulnerabilities</span>{' '}
                    <span className="text-slate-200">{formatListField(creature.damage_vulnerabilities)}</span>
                  </p>
                )}

                {/* Damage Resistances */}
                {formatListField(creature.damage_resistances) && (
                  <p>
                    <span className="font-bold text-red-400">Damage Resistances</span>{' '}
                    <span className="text-slate-200">{formatListField(creature.damage_resistances)}</span>
                  </p>
                )}

                {/* Damage Immunities */}
                {formatListField(creature.damage_immunities) && (
                  <p>
                    <span className="font-bold text-red-400">Damage Immunities</span>{' '}
                    <span className="text-slate-200">{formatListField(creature.damage_immunities)}</span>
                  </p>
                )}

                {/* Condition Immunities */}
                {formatListField(creature.condition_immunities) && (
                  <p>
                    <span className="font-bold text-red-400">Condition Immunities</span>{' '}
                    <span className="text-slate-200">{formatListField(creature.condition_immunities)}</span>
                  </p>
                )}

                {/* Senses */}
                {getSenses(creature) && (
                  <p>
                    <span className="font-bold text-red-400">Senses</span>{' '}
                    <span className="text-slate-200">{getSenses(creature)}</span>
                  </p>
                )}

                {/* Languages */}
                <p>
                  <span className="font-bold text-red-400">Languages</span>{' '}
                  <span className="text-slate-200">{getLanguages(creature)}</span>
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

              {/* ===== SPECIAL TRAITS (includes special_abilities) ===== */}
              {getTraits(creature).length > 0 && (
                <div className="space-y-2 border-b border-red-800/50 pb-3">
                  {getTraits(creature).map((trait, i) => (
                    <div key={i} className="text-sm">
                      <p>
                        <span className="font-bold text-slate-100 italic">{trait.name}.</span>{' '}
                        <span className="text-slate-300">{getDesc(trait)}</span>
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
                    <div key={i} className="text-sm mb-2">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{getDesc(action)}</span>
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
                    <div key={i} className="text-sm mb-2">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{getDesc(action)}</span>
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
                    <div key={i} className="text-sm mb-2">
                      <p>
                        <span className="font-bold text-slate-100 italic">{reaction.name}.</span>{' '}
                        <span className="text-slate-300">{getDesc(reaction)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ===== LEGENDARY ACTIONS ===== */}
              {creature.legendary_actions && creature.legendary_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-400 border-b border-red-800 pb-1">Legendary Actions</h4>
                  {(creature.legendary_desc || creature.legendary_description) && (
                    <p className="text-sm text-slate-300 italic">
                      {creature.legendary_desc || creature.legendary_description}
                    </p>
                  )}
                  {creature.legendary_actions.map((action, i) => (
                    <div key={i} className="text-sm mb-2">
                      <p>
                        <span className="font-bold text-slate-100 italic">{action.name}.</span>{' '}
                        <span className="text-slate-300">{getDesc(action)}</span>
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
