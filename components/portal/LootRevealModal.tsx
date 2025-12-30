'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LootItem {
  id: string;
  srd_item?: { name: string; rarity: string; item_type: string } | null;
  custom_item?: { name: string; image_url: string } | null;
}

interface Props {
  item: LootItem | null;
  onClose: () => void;
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-300', glow: '' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  'very rare': { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' },
  artifact: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-400', glow: 'shadow-rose-500/50' },
};

export function LootRevealModal({ item, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (item) {
      // Trigger animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [item]);

  if (!item) return null;

  const name = item.srd_item?.name || item.custom_item?.name || 'Mysterious Item';
  const rarity = item.srd_item?.rarity?.toLowerCase() || 'common';
  const itemType = item.srd_item?.item_type || 'Item';
  const imageUrl = item.custom_item?.image_url;
  const colors = rarityColors[rarity] || rarityColors.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-sm transform transition-all duration-500",
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-slate-800 hover:bg-slate-700 z-10"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* Card */}
        <div
          className={cn(
            "rounded-2xl border-2 overflow-hidden shadow-2xl",
            colors.border,
            colors.glow && `shadow-lg ${colors.glow}`
          )}
        >
          {/* Header glow effect */}
          <div className={cn("h-2", colors.bg)} />

          <div className="bg-slate-900 p-6 text-center">
            {/* Sparkle animation */}
            <div className="relative mb-4">
              <div className={cn(
                "w-24 h-24 mx-auto rounded-2xl flex items-center justify-center",
                colors.bg
              )}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-20 h-20 object-cover rounded-xl" />
                ) : (
                  <Sparkles className={cn("w-12 h-12", colors.text)} />
                )}
              </div>

              {/* Animated sparkles */}
              <div className="absolute inset-0 animate-ping opacity-30">
                <div className={cn(
                  "w-24 h-24 mx-auto rounded-2xl",
                  colors.bg
                )} />
              </div>
            </div>

            {/* Label */}
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">
              New Loot!
            </p>

            {/* Item name */}
            <h2 className={cn("text-2xl font-display mb-1", colors.text)}>
              {name}
            </h2>

            {/* Rarity & Type */}
            <p className="text-slate-400 text-sm">
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)} {itemType}
            </p>

            {/* Keep button */}
            <button
              onClick={onClose}
              className={cn(
                "mt-6 w-full py-3 rounded-xl font-display text-white transition-all",
                "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
              )}
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
