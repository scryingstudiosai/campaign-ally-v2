'use client'

import { CreatureBrain } from '@/types/living-entity'
import { Brain, Target, Shield, Lightbulb, Home, Crown, Map, Scroll, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreatureBrainCardProps {
  brain: CreatureBrain
}

export function CreatureBrainCard({ brain }: CreatureBrainCardProps): JSX.Element | null {
  if (!brain || Object.keys(brain).length === 0) return null

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-amber-400 font-medium border-b border-amber-500/20 pb-2">
        <Brain className="w-5 h-5" />
        <span>Creature Brain (DM Info)</span>
      </div>

      {/* Tactics & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brain.tactics && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
            <span className="text-xs text-red-400 uppercase flex items-center gap-1 mb-1">
              <Target className="w-3 h-3" /> Combat Tactics
            </span>
            <p className="text-slate-200 text-sm">{brain.tactics}</p>
          </div>
        )}
        {brain.weaknesses && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
            <span className="text-xs text-green-400 uppercase flex items-center gap-1 mb-1">
              <Shield className="w-3 h-3" /> Exploitable Weaknesses
            </span>
            <p className="text-slate-200 text-sm">{brain.weaknesses}</p>
          </div>
        )}
      </div>

      {/* Motivations */}
      {brain.motivations && (
        <div>
          <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Lightbulb className="w-3 h-3" /> Motivations
          </span>
          <p className="text-slate-300 text-sm">{brain.motivations}</p>
        </div>
      )}

      {/* Lair Description */}
      {brain.lair_description && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-purple-400 uppercase flex items-center gap-1 mb-1">
            <Home className="w-3 h-3" /> Lair
          </span>
          <p className="text-slate-300 text-sm">{brain.lair_description}</p>
        </div>
      )}

      {/* Lair Actions */}
      {brain.lair_actions && brain.lair_actions.length > 0 && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
          <span className="text-xs text-purple-400 uppercase mb-2 block">Lair Actions</span>
          <ul className="text-sm text-slate-300 space-y-1">
            {brain.lair_actions.map((action, i) => (
              <li key={i}>• {action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Legendary Actions */}
      {brain.legendary_actions && brain.legendary_actions.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-amber-400 uppercase flex items-center gap-1 mb-2">
            <Crown className="w-3 h-3" /> Legendary Actions
          </span>
          <div className="space-y-2">
            {brain.legendary_actions.map((action, i) => (
              <div key={i} className="p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-400">{action.name}</span>
                  <Badge variant="outline" className="text-[10px] border-amber-600 text-amber-400">
                    {action.cost} {action.cost === 1 ? 'action' : 'actions'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 mt-1">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional Effects */}
      {brain.regional_effects && brain.regional_effects.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-teal-400 uppercase flex items-center gap-1 mb-2">
            <Map className="w-3 h-3" /> Regional Effects
          </span>
          <ul className="text-sm text-slate-300 space-y-1">
            {brain.regional_effects.map((effect, i) => (
              <li key={i}>• {effect}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Plot Hooks */}
      {brain.plot_hooks && brain.plot_hooks.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-blue-400 uppercase flex items-center gap-1 mb-2">
            <Scroll className="w-3 h-3" /> Plot Hooks
          </span>
          <ul className="text-sm text-slate-300 space-y-1">
            {brain.plot_hooks.map((hook, i) => (
              <li key={i} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                {hook}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Secret */}
      {brain.secret && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded">
          <div className="flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-red-400 uppercase">Secret (DM Only)</span>
              <p className="text-slate-200 text-sm mt-1">{brain.secret}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
