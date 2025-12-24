'use client'

import { SrdCreature } from '@/types/srd'
import { Skull, Heart, Shield, Swords, Activity, Eye, Languages } from 'lucide-react'

interface SrdCreatureCardProps {
  creature: SrdCreature
  compact?: boolean
  onSelect?: (creature: SrdCreature) => void
}

export function SrdCreatureCard({ creature, compact = false, onSelect }: SrdCreatureCardProps): JSX.Element {
  const handleClick = () => {
    if (onSelect) {
      onSelect(creature)
    }
  }

  // Format ability modifier
  const formatMod = (score?: number): string => {
    if (score === undefined) return '+0'
    const mod = Math.floor((score - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  // Format speeds
  const formatSpeeds = (): string => {
    if (!creature.speeds) return 'Unknown'
    const speeds = creature.speeds as Record<string, number | string>
    return Object.entries(speeds)
      .map(([type, value]) => (type === 'walk' ? `${value} ft.` : `${type} ${value} ft.`))
      .join(', ')
  }

  if (compact) {
    return (
      <div
        className={`p-3 bg-slate-800/50 rounded-lg border border-slate-700 ${onSelect ? 'cursor-pointer hover:bg-slate-700/50 hover:border-rose-500/30 transition-colors' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            <span className="font-medium text-slate-200">{creature.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {creature.cr && <span className="text-amber-400">CR {creature.cr}</span>}
            {creature.creature_type && <span className="capitalize">{creature.creature_type}</span>}
          </div>
        </div>
        {creature.size && creature.alignment && (
          <p className="text-xs text-slate-500 mt-1 capitalize">
            {creature.size} {creature.creature_type || 'creature'}, {creature.alignment}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={`ca-card p-4 space-y-4 ${onSelect ? 'cursor-pointer hover:border-rose-500/30 transition-colors' : ''}`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-rose-400 font-medium border-b border-rose-500/20 pb-2">
        <Skull className="w-4 h-4" />
        <span>{creature.name}</span>
        {creature.cr && (
          <span className="ml-auto text-amber-400 text-sm">CR {creature.cr}</span>
        )}
      </div>

      {/* Type & Size */}
      {(creature.size || creature.creature_type || creature.alignment) && (
        <p className="text-sm text-slate-400 italic capitalize">
          {creature.size} {creature.creature_type}
          {creature.subtype && ` (${creature.subtype})`}, {creature.alignment}
        </p>
      )}

      {/* Core Stats */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400">AC</span>
          <span className="text-slate-200 font-medium">{creature.ac || '—'}</span>
          {creature.ac_type && <span className="text-slate-500 text-xs">({creature.ac_type})</span>}
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-slate-400">HP</span>
          <span className="text-slate-200 font-medium">{creature.hp || '—'}</span>
          {creature.hp_formula && <span className="text-slate-500 text-xs">({creature.hp_formula})</span>}
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-slate-400">Speed</span>
          <span className="text-slate-200 text-xs">{formatSpeeds()}</span>
        </div>
      </div>

      {/* Ability Scores */}
      {creature.stats && (
        <div className="grid grid-cols-6 gap-2 text-center py-2 bg-slate-800/50 rounded">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
            <div key={stat} className="space-y-0.5">
              <span className="text-xs text-slate-500 uppercase">{stat}</span>
              <div className="text-slate-200 font-medium">
                {creature.stats?.[stat] ?? '—'}
              </div>
              <div className="text-xs text-slate-400">
                {formatMod(creature.stats?.[stat])}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Defenses */}
      {(creature.damage_resistances?.length || creature.damage_immunities?.length || creature.condition_immunities?.length) && (
        <div className="space-y-1 text-sm">
          {creature.damage_resistances && creature.damage_resistances.length > 0 && (
            <div>
              <span className="text-slate-500">Damage Resistances: </span>
              <span className="text-slate-300">{creature.damage_resistances.join(', ')}</span>
            </div>
          )}
          {creature.damage_immunities && creature.damage_immunities.length > 0 && (
            <div>
              <span className="text-slate-500">Damage Immunities: </span>
              <span className="text-slate-300">{creature.damage_immunities.join(', ')}</span>
            </div>
          )}
          {creature.condition_immunities && creature.condition_immunities.length > 0 && (
            <div>
              <span className="text-slate-500">Condition Immunities: </span>
              <span className="text-slate-300">{creature.condition_immunities.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Senses & Languages */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {creature.senses && Object.keys(creature.senses).length > 0 && (
          <div>
            <span className="flex items-center gap-1 text-slate-500 mb-1">
              <Eye className="w-3 h-3" /> Senses
            </span>
            <span className="text-slate-300 text-xs">
              {typeof creature.senses === 'object' && 'raw' in creature.senses
                ? creature.senses.raw
                : Object.entries(creature.senses).map(([k, v]) => `${k} ${v}`).join(', ')}
            </span>
          </div>
        )}
        {creature.languages && creature.languages.length > 0 && (
          <div>
            <span className="flex items-center gap-1 text-slate-500 mb-1">
              <Languages className="w-3 h-3" /> Languages
            </span>
            <span className="text-slate-300 text-xs">{creature.languages.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Traits */}
      {creature.traits && creature.traits.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="text-slate-500 text-xs uppercase">Traits</span>
          {creature.traits.slice(0, 3).map((trait, i) => (
            <div key={i} className="text-sm">
              <span className="text-amber-400 font-medium">{trait.name}. </span>
              <span className="text-slate-300">{trait.description?.substring(0, 200)}...</span>
            </div>
          ))}
          {creature.traits.length > 3 && (
            <span className="text-slate-500 text-xs">+{creature.traits.length - 3} more traits</span>
          )}
        </div>
      )}

      {/* Actions Preview */}
      {creature.actions && creature.actions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
            <Swords className="w-3 h-3" /> Actions
          </span>
          {creature.actions.slice(0, 2).map((action, i) => (
            <div key={i} className="text-sm">
              <span className="text-red-400 font-medium">{action.name}. </span>
              <span className="text-slate-300">{action.description?.substring(0, 150)}...</span>
            </div>
          ))}
          {creature.actions.length > 2 && (
            <span className="text-slate-500 text-xs">+{creature.actions.length - 2} more actions</span>
          )}
        </div>
      )}

      {/* Source Info */}
      <div className="pt-2 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Source: {creature.source}</span>
        <span>{creature.license}</span>
      </div>
    </div>
  )
}
