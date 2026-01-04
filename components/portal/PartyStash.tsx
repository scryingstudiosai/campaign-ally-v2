'use client';

import { useState } from 'react';
import { Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StashItem {
  id: string;
  quantity: number;
  custom_name?: string | null;
  srd_item?: { name: string; rarity: string; item_type: string } | null;
  custom_item?: { name: string; image_url: string } | null;
}

interface Props {
  items: StashItem[];
  campaignId: string;
  characterId: string;
  onClaim: (itemId: string) => void;
}

const rarityColors: Record<string, string> = {
  common: 'border-slate-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  'very rare': 'border-purple-500/30',
  legendary: 'border-amber-500/30',
};

export function PartyStash({ items, campaignId, characterId, onClaim }: Props) {
  const [claiming, setClaiming] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleClaim = async (itemId: string) => {
    setClaiming(itemId);

    try {
      const res = await fetch('/api/portal/inventory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, characterId, campaignId }),
      });

      if (res.ok) {
        onClaim(itemId);
      }
    } catch (error) {
      console.error('Claim error:', error);
    }

    setClaiming(null);
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-5 h-5 text-amber-400" />
        <h2 className="font-display text-amber-400">Party Stash</h2>
        <span className="text-sm text-amber-400/60">({items.length} items)</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          // Check SRD item, then custom entity, then custom_name field
          const name = item.srd_item?.name || item.custom_item?.name || item.custom_name || 'Unknown';
          const rarity = item.srd_item?.rarity?.toLowerCase() || 'common';

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border",
                rarityColors[rarity] || 'border-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-white">
                  {name}
                  {item.quantity > 1 && <span className="text-slate-400"> ×{item.quantity}</span>}
                </span>
              </div>
              <button
                onClick={() => handleClaim(item.id)}
                disabled={claiming === item.id}
                className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
              >
                {claiming === item.id ? 'Claiming...' : 'Claim'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
