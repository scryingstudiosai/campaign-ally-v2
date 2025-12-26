'use client'

import { NpcMechanics, NpcCombatRole } from '@/types/living-entity'
import {
  Shield, Heart, Activity, Swords,
  Eye, Languages, Star, Zap, RotateCcw, Crown, User
} from 'lucide-react'

interface NpcMechanicsCardProps {
  mechanics: NpcMechanics
  name?: string
}

// Combat role display config
const COMBAT_ROLE_CONFIG: Record<NpcCombatRole, { label: string; color: string }> = {
  'non-combatant': { label: 'Non-Combatant', color: 'text-slate-400' },
  'minion': { label: 'Minion', color: 'text-green-400' },
  'elite': { label: 'Elite', color: 'text-blue-400' },
  'villain': { label: 'Villain', color: 'text-red-400' },
  'hero': { label: 'Hero', color: 'text-amber-400' },
}

// Format ability modifier
const formatMod = (score?: number): string => {
  if (score === undefined) return '+0'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// Format speeds
const formatSpeeds = (speed?: NpcMechanics['speed']): string => {
  if (!speed) return 'Unknown'
  const parts: string[] = []
  if (speed.walk) parts.push(`${speed.walk} ft.`)
  if (speed.fly) parts.push(`fly ${speed.fly} ft.`)
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`)
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`)
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`)
  return parts.length > 0 ? parts.join(', ') : 'Unknown'
}

// Format senses
const formatSenses = (senses?: NpcMechanics['senses']): string => {
  if (!senses) return '—'
  const parts: string[] = []
  if (senses.darkvision) parts.push(`darkvision ${senses.darkvision} ft.`)
  if (senses.blindsight) parts.push(`blindsight ${senses.blindsight} ft.`)
  if (senses.tremorsense) parts.push(`tremorsense ${senses.tremorsense} ft.`)
  if (senses.truesight) parts.push(`truesight ${senses.truesight} ft.`)
  if (senses.passive_perception) parts.push(`passive Perception ${senses.passive_perception}`)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function NpcMechanicsCard({ mechanics, name }: NpcMechanicsCardProps): JSX.Element | null {
  if (!mechanics || Object.keys(mechanics).length === 0) return null

  const roleConfig = COMBAT_ROLE_CONFIG[mechanics.combat_role] || COMBAT_ROLE_CONFIG['non-combatant']
  const isMinimal = mechanics.combat_role === 'non-combatant'

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/20 pb-2">
        <User className="w-5 h-5" />
        <span>{name || 'Combat Stats'}</span>
        <span className={`ml-auto text-sm ${roleConfig.color}`}>{roleConfig.label}</span>
        {mechanics.cr && (
          <span className="text-amber-400 text-sm">CR {mechanics.cr}</span>
        )}
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400">AC</span>
          <span className="text-slate-200 font-medium">{mechanics.ac || '—'}</span>
          {mechanics.ac_type && <span className="text-slate-500 text-xs">({mechanics.ac_type})</span>}
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-slate-400">HP</span>
          <span className="text-slate-200 font-medium">{mechanics.hp || '—'}</span>
          {mechanics.hit_dice && <span className="text-slate-500 text-xs">({mechanics.hit_dice})</span>}
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-slate-400">Speed</span>
          <span className="text-slate-200 text-xs">{formatSpeeds(mechanics.speed)}</span>
        </div>
      </div>

      {/* Ability Scores */}
      {mechanics.abilities && (
        <div className="grid grid-cols-6 gap-2 text-center py-2 bg-slate-800/50 rounded">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
            <div key={stat} className="space-y-0.5">
              <span className="text-xs text-slate-500 uppercase">{stat}</span>
              <div className="text-slate-200 font-medium">
                {mechanics.abilities?.[stat] ?? '—'}
              </div>
              <div className="text-xs text-slate-400">
                {formatMod(mechanics.abilities?.[stat])}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* For minimal (non-combatant) NPCs, stop here */}
      {isMinimal && !mechanics.actions?.length && !mechanics.special_abilities?.length && (
        <p className="text-xs text-slate-500 italic">Non-combatant - minimal combat statistics</p>
      )}

      {/* Saving Throws & Skills (for combat-capable NPCs) */}
      {!isMinimal && (
        <div className="space-y-1 text-sm">
          {mechanics.saving_throws && mechanics.saving_throws.length > 0 && (
            <div>
              <span className="text-slate-500">Saving Throws: </span>
              <span className="text-slate-300">
                {mechanics.saving_throws.map(st =>
                  `${st.ability.charAt(0).toUpperCase() + st.ability.slice(1)} ${st.modifier >= 0 ? '+' : ''}${st.modifier}`
                ).join(', ')}
              </span>
            </div>
          )}
          {mechanics.skills && mechanics.skills.length > 0 && (
            <div>
              <span className="text-slate-500">Skills: </span>
              <span className="text-slate-300">
                {mechanics.skills.map(sk =>
                  `${sk.name} ${sk.modifier >= 0 ? '+' : ''}${sk.modifier}`
                ).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Defenses */}
      {(mechanics.damage_resistances?.length || mechanics.damage_immunities?.length || mechanics.condition_immunities?.length) && (
        <div className="space-y-1 text-sm">
          {mechanics.damage_resistances && mechanics.damage_resistances.length > 0 && (
            <div>
              <span className="text-slate-500">Damage Resistances: </span>
              <span className="text-slate-300">{mechanics.damage_resistances.join(', ')}</span>
            </div>
          )}
          {mechanics.damage_immunities && mechanics.damage_immunities.length > 0 && (
            <div>
              <span className="text-slate-500">Damage Immunities: </span>
              <span className="text-slate-300">{mechanics.damage_immunities.join(', ')}</span>
            </div>
          )}
          {mechanics.condition_immunities && mechanics.condition_immunities.length > 0 && (
            <div>
              <span className="text-slate-500">Condition Immunities: </span>
              <span className="text-slate-300">{mechanics.condition_immunities.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Senses & Languages */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {mechanics.senses && Object.keys(mechanics.senses).length > 0 && (
          <div>
            <span className="flex items-center gap-1 text-slate-500 mb-1">
              <Eye className="w-3 h-3" /> Senses
            </span>
            <span className="text-slate-300 text-xs">{formatSenses(mechanics.senses)}</span>
          </div>
        )}
        {mechanics.languages && mechanics.languages.length > 0 && (
          <div>
            <span className="flex items-center gap-1 text-slate-500 mb-1">
              <Languages className="w-3 h-3" /> Languages
            </span>
            <span className="text-slate-300 text-xs">{mechanics.languages.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Challenge & XP */}
      {(mechanics.cr || mechanics.xp) && (
        <div className="flex items-center gap-4 text-sm pt-2 border-t border-slate-700">
          {mechanics.cr && (
            <div>
              <span className="text-slate-500">Challenge: </span>
              <span className="text-amber-400 font-medium">{mechanics.cr}</span>
            </div>
          )}
          {mechanics.xp && (
            <div>
              <span className="text-slate-500">XP: </span>
              <span className="text-slate-300">{mechanics.xp.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Special Abilities */}
      {mechanics.special_abilities && mechanics.special_abilities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
            <Star className="w-3 h-3" /> Special Abilities
          </span>
          {mechanics.special_abilities.map((ability, i) => (
            <div key={i} className="text-sm">
              <span className="text-purple-400 font-medium">{ability.name}. </span>
              <span className="text-slate-300">{ability.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {mechanics.actions && mechanics.actions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
            <Swords className="w-3 h-3" /> Actions
          </span>
          {mechanics.actions.map((action, i) => (
            <div key={i} className="text-sm">
              <span className="text-red-400 font-medium">{action.name}. </span>
              <span className="text-slate-300">{action.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bonus Actions */}
      {mechanics.bonus_actions && mechanics.bonus_actions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
            <Zap className="w-3 h-3" /> Bonus Actions
          </span>
          {mechanics.bonus_actions.map((action, i) => (
            <div key={i} className="text-sm">
              <span className="text-orange-400 font-medium">{action.name}. </span>
              <span className="text-slate-300">{action.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      {mechanics.reactions && mechanics.reactions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
            <RotateCcw className="w-3 h-3" /> Reactions
          </span>
          {mechanics.reactions.map((reaction, i) => (
            <div key={i} className="text-sm">
              <span className="text-blue-400 font-medium">{reaction.name}. </span>
              <span className="text-slate-300">{reaction.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legendary Actions */}
      {mechanics.legendary_actions && mechanics.legendary_actions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-amber-400 text-xs uppercase">
            <Crown className="w-3 h-3" /> Legendary Actions
          </span>
          <p className="text-xs text-slate-400 italic">
            The NPC can take 3 legendary actions, choosing from the options below.
            Only one legendary action option can be used at a time and only at the end of
            another creature&apos;s turn. The NPC regains spent legendary actions at the
            start of its turn.
          </p>
          {mechanics.legendary_actions.map((action, i) => (
            <div key={i} className="text-sm">
              <span className="text-amber-400 font-medium">
                {action.name}
                {action.cost && action.cost > 1 && ` (Costs ${action.cost} Actions)`}.{' '}
              </span>
              <span className="text-slate-300">{action.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* SRD Base Reference */}
      {mechanics.srd_base && (
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
          Based on: <span className="text-primary">{mechanics.srd_base.name}</span>
        </div>
      )}
    </div>
  )
}
