'use client'

import { ItemBrain } from '@/types/living-entity'
import { Sparkles, History, Scroll, Zap, AlertTriangle, Key } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MaterialCard } from '@/components/ui/material-card'

interface ItemBrainCardProps {
  brain: ItemBrain
  subType?: string | null
}

export function ItemBrainCard({ brain, subType }: ItemBrainCardProps): JSX.Element | null {
  // Don't render if brain is empty
  if (!brain || Object.keys(brain).length === 0) return null

  return (
    <MaterialCard entityType="item" className="p-0">
      <div className="p-4 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Item Soul
          </h3>
          {subType && (
            <Badge variant="outline" className="text-xs capitalize">
              {subType}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Origin & History */}
        {(brain.origin || brain.history) && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <History className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Origin & Lore
                </span>
                {brain.origin && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Origin:</span> {brain.origin}
                  </p>
                )}
                {brain.history && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">History:</span> {brain.history}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mechanics: Trigger & Secret */}
        <div className="grid grid-cols-1 gap-3">
          {brain.trigger && (
            <div className="flex gap-3">
              <Zap className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Trigger Condition
                </span>
                <p className="text-sm text-slate-300">{brain.trigger}</p>
              </div>
            </div>
          )}

          {brain.secret && (
            <div className="ca-panel p-3 border-l-2 border-amber-500/50 bg-amber-500/5">
              <div className="flex gap-3">
                <Key className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-amber-500 uppercase tracking-wide">
                    Hidden Property (DM Only)
                  </span>
                  <p className="text-sm text-slate-300">{brain.secret}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cost / Drawback */}
        {brain.cost && (
          <div className="ca-panel p-3 border-l-2 border-red-500/50 bg-red-500/5">
            <div className="flex gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-red-400 uppercase tracking-wide">
                  Cost / Drawback
                </span>
                <p className="text-sm text-slate-300">{brain.cost}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sentience Hunger */}
        {brain.hunger && (
          <div className="flex gap-3 pt-2 border-t border-slate-700/50">
            <Scroll className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Sentience Hunger
              </span>
              <p className="text-sm text-slate-300">{brain.hunger}</p>
            </div>
          </div>
        )}
      </div>
    </MaterialCard>
  )
}
