'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sword, Shield, Sparkles, Coins, Weight, Star, FlaskConical, Scroll, Package } from 'lucide-react'
import { SrdBadge } from './SrdBadge'
import type { SrdItem } from '@/types/srd'

interface SrdItemDisplayProps {
  item: SrdItem
  compact?: boolean
  onSelect?: (item: SrdItem) => void
}

// Rarity color schemes
const RARITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  common: { text: 'text-slate-300', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
  uncommon: { text: 'text-green-300', border: 'border-green-500/30', bg: 'bg-green-500/10' },
  rare: { text: 'text-blue-300', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  'very rare': { text: 'text-purple-300', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  legendary: { text: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  artifact: { text: 'text-rose-300', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
}

// Get icon based on item type
function getItemIcon(itemType: string): typeof Sword {
  const type = itemType.toLowerCase()
  if (type.includes('weapon') || type.includes('sword') || type.includes('axe') || type.includes('dagger')) {
    return Sword
  }
  if (type.includes('armor') || type.includes('shield')) {
    return Shield
  }
  if (type.includes('potion')) {
    return FlaskConical
  }
  if (type.includes('scroll')) {
    return Scroll
  }
  if (type.includes('wondrous') || type.includes('magic')) {
    return Sparkles
  }
  if (type.includes('gear') || type.includes('adventuring') || type.includes('tool')) {
    return Package
  }
  return Sparkles
}

// Get rarity colors with fallback
function getRarityColors(rarity?: string) {
  if (!rarity) return RARITY_COLORS.common
  return RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common
}

// Format item type for display
function formatItemType(itemType: string): string {
  return itemType
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function SrdItemDisplay({ item, compact = false, onSelect }: SrdItemDisplayProps): JSX.Element {
  const handleClick = () => {
    if (onSelect) {
      onSelect(item)
    }
  }

  const Icon = getItemIcon(item.item_type)
  const rarityColors = getRarityColors(item.rarity)
  const mechanics = item.mechanics || {}

  // Compact view for search results
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
              <span className={`px-2 py-0.5 rounded text-xs border ${rarityColors.text} ${rarityColors.border} ${rarityColors.bg}`}>
                {item.rarity}
              </span>
            )}
            <span className="text-xs text-slate-400">{formatItemType(item.item_type)}</span>
          </div>
        </div>
        {item.subtype && (
          <p className="text-xs text-slate-500 mt-1">{formatItemType(item.subtype)}</p>
        )}
      </div>
    )
  }

  // Full expanded view
  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-lg overflow-hidden ${onSelect ? 'cursor-pointer hover:border-amber-500/30 transition-colors' : ''}`}
      onClick={onSelect ? handleClick : undefined}
    >
      {/* Header with rarity accent */}
      <div className={`p-4 border-b-2 ${rarityColors.border.replace('/30', '/50')}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${rarityColors.text}`} />
            <h3 className={`font-bold text-lg ${rarityColors.text}`}>{item.name}</h3>
          </div>
          <SrdBadge license={item.license} />
        </div>
        <p className="text-sm text-slate-400 italic mt-1">
          {formatItemType(item.item_type)}
          {item.subtype && ` (${formatItemType(item.subtype)})`}
          {item.rarity && (
            <span className={`ml-2 ${rarityColors.text}`}>• {item.rarity}</span>
          )}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats Row */}
        <div className="flex flex-wrap gap-4 text-sm">
          {item.value_gp != null && item.value_gp > 0 && (
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-300">{item.value_gp.toLocaleString()} gp</span>
            </div>
          )}
          {item.weight != null && item.weight > 0 && (
            <div className="flex items-center gap-1.5">
              <Weight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{item.weight} lb.</span>
            </div>
          )}
          {item.requires_attunement && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-xs">
                Requires Attunement
                {item.attunement_requirements && ` (${item.attunement_requirements})`}
              </span>
            </div>
          )}
        </div>

        {/* Mechanics Section - Render whatever is available */}
        {Object.keys(mechanics).length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {/* Damage */}
            {mechanics.damage && (
              <div>
                <span className="text-slate-500 text-xs uppercase block">Damage</span>
                <span className="text-slate-200">
                  {mechanics.damage}
                  {mechanics.damage_type && ` ${mechanics.damage_type}`}
                </span>
              </div>
            )}

            {/* AC (armor) */}
            {mechanics.ac != null && (
              <div>
                <span className="text-slate-500 text-xs uppercase block">AC</span>
                <span className="text-slate-200">{mechanics.ac}</span>
              </div>
            )}

            {/* AC Bonus (shields, magic armor) */}
            {mechanics.ac_bonus != null && (
              <div>
                <span className="text-slate-500 text-xs uppercase block">AC Bonus</span>
                <span className="text-slate-200">+{mechanics.ac_bonus}</span>
              </div>
            )}

            {/* Strength Requirement */}
            {mechanics.str_minimum != null && (
              <div>
                <span className="text-slate-500 text-xs uppercase block">Str Required</span>
                <span className="text-slate-200">{mechanics.str_minimum}</span>
              </div>
            )}

            {/* Charges */}
            {mechanics.charges != null && (
              <div>
                <span className="text-slate-500 text-xs uppercase block">Charges</span>
                <span className="text-slate-200">
                  {mechanics.charges}
                  {mechanics.recharge && ` (${mechanics.recharge})`}
                </span>
              </div>
            )}

            {/* Stealth Disadvantage */}
            {mechanics.stealth_disadvantage && (
              <div className="col-span-2">
                <span className="text-red-400 text-xs">Stealth Disadvantage</span>
              </div>
            )}

            {/* Effect (for potions, scrolls, etc.) */}
            {mechanics.effect && (
              <div className="col-span-2">
                <span className="text-slate-500 text-xs uppercase block">Effect</span>
                <span className="text-slate-200">{mechanics.effect}</span>
              </div>
            )}
          </div>
        )}

        {/* Properties (weapons) */}
        {mechanics.properties && mechanics.properties.length > 0 && (
          <div>
            <span className="text-slate-500 text-xs uppercase block mb-1.5">Properties</span>
            <div className="flex flex-wrap gap-1.5">
              {mechanics.properties.map((prop: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300"
                >
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description with Markdown Support */}
        {item.description && (
          <div className="pt-3 border-t border-slate-700">
            <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-p:my-2 prose-headings:text-slate-200 prose-strong:text-slate-100 prose-em:text-slate-300 prose-table:text-sm prose-th:text-slate-300 prose-th:bg-slate-800/50 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-td:border-slate-700 prose-tr:border-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.description}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Source Footer */}
        <div className="pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <span>Source: {item.source || 'Open5e'}</span>
          <span className="text-slate-600">{item.license || 'OGL 1.0a'}</span>
        </div>
      </div>
    </div>
  )
}
