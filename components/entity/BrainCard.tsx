'use client'

import {
  NpcBrain,
  VillainBrain,
  HeroBrain,
  isVillainBrain,
  isHeroBrain,
} from '@/types/living-entity'
import {
  Brain,
  Target,
  AlertTriangle,
  Key,
  Ban,
  Skull,
  Shield,
  Clock,
} from 'lucide-react'

interface BrainCardProps {
  brain: NpcBrain | VillainBrain | HeroBrain
  viewMode?: 'dm' | 'player'
}

export function BrainCard({
  brain,
  viewMode = 'dm',
}: BrainCardProps): JSX.Element | null {
  // Players don't see the brain - it's DM info
  if (viewMode === 'player') return null

  return (
    <div className="ca-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-400 font-medium">
        <Brain className="w-5 h-5" />
        <span>NPC Brain</span>
      </div>

      <div className="space-y-2">
        <div className="flex gap-3">
          <Target className="w-4 h-4 text-teal-400 mt-1 shrink-0" />
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Desire
            </span>
            <p className="text-sm text-slate-300">{brain.desire}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-1 shrink-0" />
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Fear
            </span>
            <p className="text-sm text-slate-300">{brain.fear}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Key className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Leverage
            </span>
            <p className="text-sm text-slate-300">{brain.leverage}</p>
          </div>
        </div>

        <div className="ca-panel p-3 border-l-2 border-red-500/50">
          <div className="flex gap-3">
            <Ban className="w-4 h-4 text-red-500 mt-1 shrink-0" />
            <div>
              <span className="text-xs text-red-400 uppercase tracking-wide">
                Line They Won&apos;t Cross
              </span>
              <p className="text-sm text-slate-300">{brain.line}</p>
            </div>
          </div>
        </div>

        {/* Villain-specific fields */}
        {isVillainBrain(brain) && (
          <>
            <div className="flex gap-3 pt-2 border-t border-slate-700">
              <Skull className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Scheme
                </span>
                <p className="text-sm text-slate-300">{brain.scheme}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Shield className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Escape Plan
                </span>
                <p className="text-sm text-slate-300">{brain.escape_plan}</p>
              </div>
            </div>
          </>
        )}

        {/* Hero-specific fields */}
        {isHeroBrain(brain) && (
          <>
            <div className="flex gap-3 pt-2 border-t border-slate-700">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Limitation
                </span>
                <p className="text-sm text-slate-300">{brain.limitation}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="w-4 h-4 text-teal-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Availability
                </span>
                <p className="text-sm text-slate-300">{brain.availability}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
