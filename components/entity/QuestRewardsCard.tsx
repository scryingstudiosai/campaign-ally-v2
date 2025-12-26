'use client';

import { useState } from 'react';
import { QuestRewards } from '@/types/living-entity';
import { Gift, Coins, Sparkles, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InventoryList } from '@/components/inventory/InventoryList';
import { TransferItemDialog } from '@/components/inventory/TransferItemDialog';
import { InventoryInstanceWithItem } from '@/types/inventory';

interface QuestRewardsCardProps {
  rewards: QuestRewards;
  questId?: string;
  campaignId?: string;
}

export function QuestRewardsCard({
  rewards,
  questId,
  campaignId,
}: QuestRewardsCardProps): JSX.Element | null {
  const [transferItem, setTransferItem] = useState<InventoryInstanceWithItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!rewards || Object.keys(rewards).length === 0) return null;

  const hasXpOrGold = (rewards.xp && rewards.xp > 0) || rewards.gold;
  const hasReputation = rewards.reputation && rewards.reputation.length > 0;
  const canShowInventory = !!questId && !!campaignId;

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

      {/* Item Rewards - Now as Inventory */}
      {canShowInventory ? (
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <Gift className="w-4 h-4" />
            <span>Item Rewards</span>
          </div>
          <InventoryList
            campaignId={campaignId}
            ownerType="quest"
            ownerId={questId}
            viewMode="rewards"
            showHeader={false}
            onTransfer={(item) => setTransferItem(item)}
            emptyMessage="No item rewards for this quest"
            refreshKey={refreshKey}
          />
        </div>
      ) : rewards.items && rewards.items.length > 0 ? (
        // Fallback to static display if no questId/campaignId
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Gift className="w-4 h-4" />
            <span>Item Rewards</span>
          </div>
          <div className="space-y-2">
            {rewards.items.map((item, i) => (
              <div key={i} className="p-3 bg-slate-800 rounded-lg flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  {item.rarity && (
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs capitalize ${getRarityColor(item.rarity)}`}
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
      ) : null}

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
            <Star className="w-4 h-4" />
            <span>Special Reward</span>
          </div>
          <p className="text-sm text-slate-300">{rewards.special}</p>
        </div>
      )}

      {/* Transfer Dialog for awarding items to players */}
      {canShowInventory && (
        <TransferItemDialog
          item={transferItem}
          campaignId={campaignId}
          isShopMode={false}
          onClose={() => setTransferItem(null)}
          onTransferComplete={() => {
            setTransferItem(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'border-slate-500 text-slate-400',
    uncommon: 'border-green-500 text-green-400',
    rare: 'border-blue-500 text-blue-400',
    'very rare': 'border-purple-500 text-purple-400',
    legendary: 'border-orange-500 text-orange-400',
  };
  return colors[rarity] || '';
}
