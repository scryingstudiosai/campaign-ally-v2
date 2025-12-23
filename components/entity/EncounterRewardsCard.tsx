'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift, Coins, Package, Scroll } from 'lucide-react'
import type { EncounterRewards, EncounterRewardItem } from '@/types/living-entity'

interface EncounterRewardsCardProps {
  rewards: EncounterRewards
}

export function EncounterRewardsCard({ rewards }: EncounterRewardsCardProps): JSX.Element | null {
  if (!rewards || Object.keys(rewards).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP & Gold */}
        <div className="grid grid-cols-2 gap-3">
          {rewards.xp !== undefined && (
            <div className="text-center p-3 rounded bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs text-purple-400 uppercase block mb-1">Experience</span>
              <span className="text-xl font-bold text-purple-300">{rewards.xp} XP</span>
            </div>
          )}
          {rewards.gold !== undefined && (
            <div className="text-center p-3 rounded bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-amber-400 uppercase block mb-1">Treasure</span>
              <div className="flex items-center justify-center gap-1">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-xl font-bold text-amber-300">{rewards.gold} gp</span>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        {rewards.items && rewards.items.length > 0 && (
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Loot</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rewards.items.map((item: EncounterRewardItem, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-sm text-amber-300"
                >
                  <Package className="w-3 h-3" />
                  {item.name}
                  {item.type && (
                    <span className="text-xs text-slate-500">({item.type})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Story Rewards */}
        {rewards.story && (
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Scroll className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Story Reward</span>
            </div>
            <p className="text-sm text-slate-300">{rewards.story}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
