'use client'

import { Target, Users, Lock, AlertTriangle, Crosshair, Network } from 'lucide-react'
import type { FactionBrain } from '@/types/living-entity'
import { MaterialCard } from '@/components/ui/material-card'

interface FactionBrainCardProps {
  brain: FactionBrain
  subType?: string
}

export function FactionBrainCard({ brain, subType }: FactionBrainCardProps): JSX.Element | null {
  if (!brain || Object.keys(brain).length === 0) {
    return null
  }

  return (
    <MaterialCard entityType="faction" className="p-0">
      <div className="p-4 pb-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Target className="w-5 h-5 text-rose-400" />
            Faction Brain
          </h3>
          {subType && (
            <span className="text-xs text-smoke capitalize">
              {subType.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
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

        {/* Goals */}
        {brain.goals && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Long-term Goals</span>
            </div>
            <p className="text-sm text-slate-300">{brain.goals}</p>
          </div>
        )}

        {/* Current Agenda */}
        {brain.current_agenda && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <span className="text-xs font-medium text-amber-400 uppercase">Current Agenda</span>
            <p className="text-sm text-slate-300 mt-1">{brain.current_agenda}</p>
          </div>
        )}

        {/* Methods */}
        {brain.methods && (
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Methods</span>
            <p className="text-sm text-slate-300 mt-1">{brain.methods}</p>
          </div>
        )}

        {/* Hierarchy */}
        {brain.hierarchy && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Network className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Hierarchy</span>
            </div>
            <p className="text-sm text-slate-300">{brain.hierarchy}</p>
          </div>
        )}

        {/* Key Members */}
        {brain.key_members && brain.key_members.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Key Members</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {brain.key_members.map((member, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-300"
                >
                  {member}
                </span>
              ))}
            </div>
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

        {/* Weakness */}
        {brain.weakness && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400 uppercase">Weakness</span>
            </div>
            <p className="text-sm text-slate-300">{brain.weakness}</p>
          </div>
        )}
      </div>
    </MaterialCard>
  )
}
