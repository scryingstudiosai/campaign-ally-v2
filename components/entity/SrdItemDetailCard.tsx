'use client'

import { Coins, Weight, Sparkles, Shield, Swords } from 'lucide-react'
import { SrdBadge } from '@/components/srd/SrdBadge'

interface SrdItemMechanics {
  rarity?: string
  requires_attunement?: boolean
  attunement_requirements?: string
  value_gp?: number
  weight?: number
  damage?: string
  damage_type?: string
  properties?: string[]
  ac?: number
  ac_bonus?: number
  stealth_disadvantage?: boolean
  str_minimum?: number
  effect?: string
  charges?: number
  recharge?: string
}

interface SrdItemDetailCardProps {
  item: {
    name: string
    sub_type?: string
    mechanics?: SrdItemMechanics
    dm_description?: string
    attributes?: {
      srd_source?: {
        license?: string
      }
    }
  }
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-300 bg-slate-500/20 border-slate-500/30',
  uncommon: 'text-green-300 bg-green-500/20 border-green-500/30',
  rare: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  'very rare': 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  legendary: 'text-orange-300 bg-orange-500/20 border-orange-500/30',
  artifact: 'text-red-300 bg-red-500/20 border-red-500/30',
}

export function SrdItemDetailCard({ item }: SrdItemDetailCardProps): JSX.Element {
  const { mechanics = {}, dm_description, sub_type, attributes } = item
  const rarity = mechanics.rarity?.toLowerCase() || 'common'
  const rarityClass = RARITY_COLORS[rarity] || RARITY_COLORS.common
  const license = attributes?.srd_source?.license || 'ogl_1.0a'

  // Determine item category for display
  const isWeapon = sub_type === 'weapon' || !!mechanics.damage
  const isArmor = sub_type === 'armor' || mechanics.ac !== undefined || mechanics.ac_bonus !== undefined
  const isPotion = sub_type?.includes('potion') || item.name.toLowerCase().includes('potion')
  const isScroll = sub_type?.includes('scroll') || item.name.toLowerCase().includes('scroll')

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${rarityClass}`}>
              {rarity}
            </span>
            <span className="text-slate-400 capitalize">{sub_type || 'Item'}</span>
          </div>
          <div className="flex items-center gap-2">
            {mechanics.requires_attunement && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                ✦ Attunement
                {mechanics.attunement_requirements && (
                  <span className="text-amber-300/70 ml-1">({mechanics.attunement_requirements})</span>
                )}
              </span>
            )}
            <SrdBadge license={license} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Effect/Description - Primary Content */}
        {(mechanics.effect || dm_description) && (
          <div className="p-4 bg-teal-500/5 rounded-lg border border-teal-500/20">
            <h4 className="text-sm font-semibold text-teal-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {isPotion ? 'Effect' : isScroll ? 'Spell' : 'Description'}
            </h4>
            <p className="text-slate-200 leading-relaxed">
              {mechanics.effect || dm_description}
            </p>
          </div>
        )}

        {/* Weapon Stats */}
        {isWeapon && mechanics.damage && (
          <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
            <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4" /> Weapon Stats
            </h4>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-100">{mechanics.damage}</span>
              <span className="text-slate-400 capitalize">{mechanics.damage_type}</span>
            </div>
            {mechanics.properties && mechanics.properties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mechanics.properties.map((prop: string) => (
                  <span
                    key={prop}
                    className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300 capitalize"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Armor Stats */}
        {isArmor && (mechanics.ac !== undefined || mechanics.ac_bonus !== undefined) && (
          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Armor Stats
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {mechanics.ac !== undefined ? `AC ${mechanics.ac}` : `+${mechanics.ac_bonus}`}
              </span>
              {mechanics.ac_bonus !== undefined && mechanics.ac === undefined && (
                <span className="text-slate-400">bonus to AC</span>
              )}
            </div>
            {mechanics.str_minimum && (
              <p className="text-sm text-slate-400 mt-2">Requires Strength {mechanics.str_minimum}</p>
            )}
            {mechanics.stealth_disadvantage && (
              <p className="text-sm text-amber-400 mt-2">⚠ Stealth Disadvantage</p>
            )}
          </div>
        )}

        {/* Charges */}
        {mechanics.charges && (
          <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-400">Charges</span>
              <span className="text-slate-200 font-medium">{mechanics.charges}</span>
            </div>
            {mechanics.recharge && (
              <p className="text-xs text-slate-400 mt-1">Recharge: {mechanics.recharge}</p>
            )}
          </div>
        )}

        {/* Value & Weight Footer */}
        {(mechanics.value_gp || mechanics.weight) && (
          <div className="flex items-center gap-6 pt-2 border-t border-slate-700/50">
            {mechanics.value_gp && (
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">{mechanics.value_gp.toLocaleString()} gp</span>
              </div>
            )}
            {mechanics.weight && (
              <div className="flex items-center gap-2 text-sm">
                <Weight className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">{mechanics.weight} lb.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
