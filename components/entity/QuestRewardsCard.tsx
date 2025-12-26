'use client';

import { QuestRewards } from '@/types/living-entity';
import { Gift, Coins, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestRewardsCardProps {
  rewards: QuestRewards;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-500 text-slate-400',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-blue-500 text-blue-400',
  'very rare': 'border-purple-500 text-purple-400',
  legendary: 'border-orange-500 text-orange-400',
};

export function QuestRewardsCard({ rewards }: QuestRewardsCardProps): JSX.Element | null {
  if (!rewards || Object.keys(rewards).length === 0) return null;

  const hasXpOrGold = (rewards.xp && rewards.xp > 0) || rewards.gold;
  const hasItems = rewards.items && rewards.items.length > 0;
  const hasReputation = rewards.reputation && rewards.reputation.length > 0;

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-400 font-medium border-b border-amber-400/20 pb-2">
        <Gift className="w-5 h-5" />
        <span>Rewards</span>
      </div>

      {/* XP and Gold */}
      {hasXpOrGold && (
        <div className="grid grid-cols-2 gap-4">
          {rewards.xp && rewards.xp > 0 && (
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Sparkles className="w-3 h-3" />
                Experience
              </div>
              <p className="text-xl font-bold text-amber-400">{rewards.xp} XP</p>
            </div>
          )}
          {rewards.gold && (
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Coins className="w-3 h-3" />
                Gold
              </div>
              <p className="text-xl font-bold text-amber-400">{rewards.gold} gp</p>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      {hasItems && (
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Gift className="w-4 h-4" />
            <span>Item Rewards</span>
          </div>
          <div className="space-y-2">
            {rewards.items!.map((item, i) => (
              <div key={i} className="p-3 bg-slate-800 rounded-lg flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  {item.rarity && (
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs capitalize ${RARITY_COLORS[item.rarity] || ''}`}
                    >
                      {item.rarity}
                    </Badge>
                  )}
                  {item.type && (
                    <span className="text-xs text-slate-500 ml-2 capitalize">{item.type}</span>
                  )}
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reputation */}
      {hasReputation && (
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            <span>Reputation Changes</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {rewards.reputation!.map((rep, i) => (
              <Badge
                key={i}
                variant="outline"
                className={
                  rep.change?.startsWith('+')
                    ? 'border-green-600 text-green-400'
                    : 'border-red-600 text-red-400'
                }
              >
                {rep.faction}: {rep.change}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Special Reward */}
      {rewards.special && (
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Special Reward</span>
          </div>
          <p className="text-sm text-slate-300">{rewards.special}</p>
        </div>
      )}
    </div>
  );
}
