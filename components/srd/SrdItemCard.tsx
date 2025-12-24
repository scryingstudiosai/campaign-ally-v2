'use client'

import { SrdItem } from '@/types/srd'
import { Sword, Shield, Sparkles, Coins, Weight, Star } from 'lucide-react'

interface SrdItemCardProps {
  item: SrdItem
  compact?: boolean
  onSelect?: (item: SrdItem) => void
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-300 border-slate-500/20 bg-slate-500/10',
  uncommon: 'text-green-300 border-green-500/20 bg-green-500/10',
  rare: 'text-blue-300 border-blue-500/20 bg-blue-500/10',
  'very rare': 'text-purple-300 border-purple-500/20 bg-purple-500/10',
  legendary: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  artifact: 'text-rose-300 border-rose-500/20 bg-rose-500/10',
}

const TYPE_ICONS: Record<string, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  magic_item: Sparkles,
}

export function SrdItemCard({ item, compact = false, onSelect }: SrdItemCardProps): JSX.Element {
  const handleClick = () => {
    if (onSelect) {
      onSelect(item)
    }
  }

  const Icon = TYPE_ICONS[item.item_type] || Sparkles
  const rarityColor = RARITY_COLORS[item.rarity?.toLowerCase() || 'common'] || RARITY_COLORS.common

  if (compact) {
    return (
      <div
        className={`p-3 bg-slate-800/50 rounded-lg border border-slate-700 ${onSelect ? 'cursor-pointer hover:bg-slate-700/50 hover:border-amber-500/30 transition-colors' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-slate-200">{item.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.rarity && (
              <span className={`px-2 py-0.5 rounded text-xs border ${rarityColor}`}>
                {item.rarity}
              </span>
            )}
            <span className="text-xs text-slate-400 capitalize">{item.item_type.replace('_', ' ')}</span>
          </div>
        </div>
        {item.subtype && (
          <p className="text-xs text-slate-500 mt-1 capitalize">{item.subtype}</p>
        )}
      </div>
    )
  }

  return (
    <div
      className={`ca-card p-4 space-y-4 ${onSelect ? 'cursor-pointer hover:border-amber-500/30 transition-colors' : ''}`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-400 font-medium border-b border-amber-500/20 pb-2">
        <Icon className="w-4 h-4" />
        <span>{item.name}</span>
        {item.rarity && (
          <span className={`ml-auto px-2 py-0.5 rounded text-xs border ${rarityColor}`}>
            {item.rarity}
          </span>
        )}
      </div>

      {/* Type & Subtype */}
      <p className="text-sm text-slate-400 italic capitalize">
        {item.item_type.replace('_', ' ')}
        {item.subtype && ` (${item.subtype})`}
      </p>

      {/* Quick Stats */}
      <div className="flex gap-4 text-sm">
        {item.value_gp && (
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{item.value_gp} gp</span>
          </div>
        )}
        {item.weight && (
          <div className="flex items-center gap-1">
            <Weight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{item.weight} lb.</span>
          </div>
        )}
        {item.requires_attunement && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-xs">
              Requires Attunement
              {item.attunement_requirements && ` (${item.attunement_requirements})`}
            </span>
          </div>
        )}
      </div>

      {/* Mechanics */}
      {item.mechanics && Object.keys(item.mechanics).length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-slate-800/50 rounded">
          {item.mechanics.damage && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">Damage</span>
              <span className="text-slate-200">
                {item.mechanics.damage}
                {item.mechanics.damage_type && ` ${item.mechanics.damage_type}`}
              </span>
            </div>
          )}
          {item.mechanics.ac !== undefined && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">AC</span>
              <span className="text-slate-200">{item.mechanics.ac}</span>
            </div>
          )}
          {item.mechanics.ac_bonus !== undefined && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">AC Bonus</span>
              <span className="text-slate-200">+{item.mechanics.ac_bonus}</span>
            </div>
          )}
          {item.mechanics.stealth_disadvantage && (
            <div>
              <span className="text-red-400 text-xs">Stealth Disadvantage</span>
            </div>
          )}
          {item.mechanics.str_minimum && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">Str Required</span>
              <span className="text-slate-200">{item.mechanics.str_minimum}</span>
            </div>
          )}
        </div>
      )}

      {/* Properties */}
      {item.mechanics?.properties && item.mechanics.properties.length > 0 && (
        <div>
          <span className="text-slate-500 text-xs uppercase block mb-1">Properties</span>
          <div className="flex flex-wrap gap-1">
            {item.mechanics.properties.map((p: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-slate-500 text-xs uppercase block mb-1">Description</span>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {item.description.length > 400 ? `${item.description.substring(0, 400)}...` : item.description}
          </p>
        </div>
      )}

      {/* Source Info */}
      <div className="pt-2 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Source: {item.source}</span>
        <span>{item.license}</span>
      </div>
    </div>
  )
}
