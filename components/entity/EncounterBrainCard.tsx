'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Swords, Lock, AlertTriangle, Zap, Scale } from 'lucide-react'
import type { EncounterBrain } from '@/types/living-entity'

interface EncounterBrainCardProps {
  brain: EncounterBrain
  subType?: string
}

export function EncounterBrainCard({ brain, subType }: EncounterBrainCardProps): JSX.Element | null {
  if (!brain || Object.keys(brain).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4 text-red-400" />
          Encounter Brain
          {subType && (
            <span className="text-xs text-slate-500 ml-auto capitalize">
              {subType.replace('_', ' ')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Purpose */}
        {brain.purpose && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Purpose</span>
            </div>
            <p className="text-sm text-slate-300">{brain.purpose}</p>
          </div>
        )}

        {/* Objective */}
        {brain.objective && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <span className="text-xs font-medium text-blue-400 uppercase">Win Condition</span>
            <p className="text-sm text-slate-300 mt-1">{brain.objective}</p>
          </div>
        )}

        {/* Trigger */}
        {brain.trigger && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Trigger</span>
            </div>
            <p className="text-sm text-slate-300">{brain.trigger}</p>
          </div>
        )}

        {/* Tactics */}
        {brain.tactics && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Swords className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-orange-400 uppercase">Tactics</span>
            </div>
            <p className="text-sm text-slate-300">{brain.tactics}</p>
          </div>
        )}

        {/* Scaling */}
        {brain.scaling && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Scaling Tips</span>
            </div>
            <p className="text-sm text-slate-300">{brain.scaling}</p>
          </div>
        )}

        {/* Resolution */}
        {brain.resolution && (
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Possible Outcomes</span>
            <p className="text-sm text-slate-300 mt-1">{brain.resolution}</p>
          </div>
        )}

        {/* Secret - DM Only */}
        {brain.secret && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400 uppercase">Secret (DM Only)</span>
            </div>
            <p className="text-sm text-slate-300">{brain.secret}</p>
          </div>
        )}

        {/* Failure Consequence */}
        {brain.failure_consequence && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-red-400 uppercase">On Failure</span>
            </div>
            <p className="text-sm text-slate-300">{brain.failure_consequence}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
