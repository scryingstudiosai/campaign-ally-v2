'use client';

import { Sword, Shield, Scroll, FlaskConical, Package, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InventoryItemData } from './InventoryView';

interface Props {
  item: InventoryItemData;
  onClick: () => void;
}

const rarityColors: Record<string, string> = {
  common: 'border-slate-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  'very rare': 'border-purple-500/30',
  legendary: 'border-amber-500/30',
  artifact: 'border-rose-500/30',
};

const rarityTextColors: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  'very rare': 'text-purple-400',
  legendary: 'text-amber-400',
  artifact: 'text-rose-400',
};

function getItemIcon(itemType?: string | null) {
  switch (itemType?.toLowerCase()) {
    case 'weapon':
      return Sword;
    case 'armor':
      return Shield;
    case 'scroll':
      return Scroll;
    case 'potion':
      return FlaskConical;
    case 'wondrous item':
      return Sparkles;
    default:
      return Package;
  }
}

export function InventoryItem({ item, onClick }: Props) {
  const srd = item.srd_item;
  const custom = item.custom_item;

  const name = srd?.name || custom?.name || 'Unknown Item';
  const itemType = srd?.item_type || custom?.sub_type || 'Item';
  const rarity = srd?.rarity?.toLowerCase() || 'common';
  const imageUrl = custom?.image_url;
  const Icon = getItemIcon(itemType);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all",
        "bg-slate-900/50 border",
        rarityColors[rarity] || 'border-white/10',
        "hover:bg-slate-800/50",
        "active:scale-[0.98]",
        item.is_equipped && "ring-1 ring-teal-500/50"
      )}
    >
      <div className="flex gap-4 items-center">
        {/* Icon/Image */}
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Icon className={cn("w-6 h-6", rarityTextColors[rarity] || 'text-slate-500')} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-white truncate">{name}</h3>
            {item.quantity > 1 && (
              <span className="text-sm text-slate-400">×{item.quantity}</span>
            )}
          </div>
          <p className={cn("text-sm truncate", rarityTextColors[rarity] || 'text-slate-500')}>
            {rarity !== 'common' && `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} `}
            {itemType}
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          {item.is_equipped && (
            <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-400">
              Equipped
            </span>
          )}
          {item.is_attuned && (
            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
              Attuned
            </span>
          )}
          {item.charges !== null && item.max_charges && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Zap className="w-3 h-3" />
              {item.charges}/{item.max_charges}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
