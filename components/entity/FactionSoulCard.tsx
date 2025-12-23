'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Users, Palette, MessageCircle } from 'lucide-react'
import type { FactionSoul } from '@/types/living-entity'

interface FactionSoulCardProps {
  soul: FactionSoul
}

export function FactionSoulCard({ soul }: FactionSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          Faction Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Motto */}
        {soul.motto && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3 text-center">
            <p className="text-lg italic text-teal-300">&quot;{soul.motto}&quot;</p>
          </div>
        )}

        {/* Symbol */}
        {soul.symbol && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Symbol</span>
            </div>
            <p className="text-sm text-slate-300">{soul.symbol}</p>
          </div>
        )}

        {/* Reputation */}
        {soul.reputation && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Reputation</span>
            </div>
            <p className="text-sm text-slate-300">{soul.reputation}</p>
          </div>
        )}

        {/* Colors */}
        {soul.colors && soul.colors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Colors</span>
            </div>
            <div className="flex gap-2">
              {soul.colors.map((color, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Culture */}
        {soul.culture && (
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Culture & Values</span>
            <p className="text-sm text-slate-300 mt-1">{soul.culture}</p>
          </div>
        )}

        {/* Greeting */}
        {soul.greeting && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Member Greeting</span>
            </div>
            <p className="text-sm text-slate-300 italic">&quot;{soul.greeting}&quot;</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
