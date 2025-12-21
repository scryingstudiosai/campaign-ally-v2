'use client'

import { ItemMechanics } from '@/types/living-entity'
import { Sword, Shield, Sparkles, Zap } from 'lucide-react'

interface ItemMechanicsCardProps {
  mechanics: ItemMechanics
  category?: string
}

export function ItemMechanicsCard({ mechanics, category }: ItemMechanicsCardProps): JSX.Element | null {
  if (!mechanics || Object.keys(mechanics).length === 0) {
    return null
  }

  const isWeapon = category === 'weapon'
  const isArmor = category === 'armor'

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-blue-400 font-medium border-b border-blue-500/20 pb-2">
        {isWeapon ? <Sword className="w-4 h-4" /> : isArmor ? <Shield className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        <span>Mechanics</span>
      </div>

      {/* Base Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {mechanics.base_item && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Base Item</span>
            <span className="text-slate-200 capitalize">{mechanics.base_item}</span>
          </div>
        )}

        {mechanics.damage && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Damage</span>
            <span className="text-slate-200">
              {mechanics.bonus && <span className="text-green-400">{mechanics.bonus} </span>}
              {mechanics.damage}
            </span>
          </div>
        )}

        {mechanics.ac_bonus !== undefined && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">AC</span>
            <span className="text-slate-200">+{mechanics.ac_bonus}</span>
          </div>
        )}

        {mechanics.charges && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Charges</span>
            <span className="text-slate-200">
              {mechanics.charges.current ?? mechanics.charges.max}/{mechanics.charges.max}
              {mechanics.charges.recharge && (
                <span className="text-slate-400 text-xs ml-1">({mechanics.charges.recharge})</span>
              )}
            </span>
          </div>
        )}

        {mechanics.spell_save_dc && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Spell Save DC</span>
            <span className="text-slate-200">{mechanics.spell_save_dc}</span>
          </div>
        )}

        {mechanics.spell_attack_bonus && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Spell Attack</span>
            <span className="text-slate-200">+{mechanics.spell_attack_bonus}</span>
          </div>
        )}

        {mechanics.range && (
          <div>
            <span className="text-slate-500 text-xs uppercase block">Range</span>
            <span className="text-slate-200">{mechanics.range}</span>
          </div>
        )}
      </div>

      {/* Properties */}
      {mechanics.properties && mechanics.properties.length > 0 && (
        <div>
          <span className="text-slate-500 text-xs uppercase block mb-1">Properties</span>
          <div className="flex flex-wrap gap-1">
            {mechanics.properties.map((p, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Abilities */}
      {mechanics.abilities && mechanics.abilities.length > 0 && (
        <div className="space-y-2">
          <span className="text-slate-500 text-xs uppercase block">Abilities</span>
          {mechanics.abilities.map((ability, i) => (
            <div key={i} className="p-3 bg-slate-800/50 rounded border border-slate-700">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {ability.name}
                </span>
                {ability.cost && (
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                    {ability.cost}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{ability.description}</p>
              {ability.duration && (
                <span className="text-xs text-slate-500 block mt-1">Duration: {ability.duration}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attunement */}
      {mechanics.attunement && (
        <div className="pt-3 border-t border-slate-700">
          <span className="text-purple-400 text-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Requires Attunement
            {mechanics.attunement_requirements && (
              <span className="text-purple-300 font-normal"> by {mechanics.attunement_requirements}</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
