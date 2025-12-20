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
  Zap,
  TrendingUp,
  Heart,
  Lock,
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Scheme
                  </span>
                  {brain.scheme_phase && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      brain.scheme_phase === 'planning' ? 'bg-blue-500/20 text-blue-400' :
                      brain.scheme_phase === 'executing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {brain.scheme_phase}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{brain.scheme}</p>
              </div>
            </div>

            {brain.resources && brain.resources.length > 0 && (
              <div className="flex gap-3">
                <Zap className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Resources
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {brain.resources.map((resource, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Shield className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Escape Plan
                </span>
                <p className="text-sm text-slate-300">{brain.escape_plan}</p>
              </div>
            </div>

            {brain.escalation && (
              <div className="ca-panel p-3 border-l-2 border-red-500/50 bg-red-500/5">
                <div className="flex gap-3">
                  <TrendingUp className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-xs text-red-400 uppercase tracking-wide">
                      Escalation (If Unchecked)
                    </span>
                    <p className="text-sm text-slate-300">{brain.escalation}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Hero-specific fields */}
        {isHeroBrain(brain) && (
          <>
            <div className="ca-panel p-3 border-l-2 border-amber-500/50 bg-amber-500/5">
              <div className="flex gap-3">
                <Lock className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-amber-400 uppercase tracking-wide">
                    Limitation (Why They Can&apos;t Solve It)
                  </span>
                  <p className="text-sm text-slate-300">{brain.limitation}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-700">
              <Heart className="w-4 h-4 text-teal-400 mt-1 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">
                  Support Role
                </span>
                <p className="text-sm text-slate-300">{brain.support_role}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
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
