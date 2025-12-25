'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Skull, AlertTriangle, Zap, ChevronRight, Clock, Users } from 'lucide-react'
import type { EncounterMechanics, EncounterCreature, EncounterPhase } from '@/types/living-entity'

interface EncounterMechanicsCardProps {
  mechanics: EncounterMechanics
}

const DIFFICULTY_COLORS: Record<string, string> = {
  trivial: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  deadly: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ROLE_COLORS: Record<string, string> = {
  minion: 'text-slate-400',
  brute: 'text-orange-400',
  controller: 'text-purple-400',
  leader: 'text-yellow-400',
  artillery: 'text-cyan-400',
  skirmisher: 'text-green-400',
  boss: 'text-red-400',
}

export function EncounterMechanicsCard({ mechanics }: EncounterMechanicsCardProps): JSX.Element | null {
  if (!mechanics || Object.keys(mechanics).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-400" />
          Encounter Mechanics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {mechanics.difficulty && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Difficulty</span>
              <Badge className={DIFFICULTY_COLORS[mechanics.difficulty]}>
                {mechanics.difficulty}
              </Badge>
            </div>
          )}
          {mechanics.party_size && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Party Size</span>
              <div className="flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">{mechanics.party_size}</span>
              </div>
            </div>
          )}
          {mechanics.party_level && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Party Level</span>
              <span className="text-sm font-medium text-slate-300">Lvl {mechanics.party_level}</span>
            </div>
          )}
          {mechanics.duration && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Duration</span>
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">{mechanics.duration}</span>
              </div>
            </div>
          )}
        </div>

        {/* Creatures */}
        {mechanics.creatures && mechanics.creatures.length > 0 && (
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Creatures</span>
            </div>
            <div className="space-y-2">
              {mechanics.creatures.map((creature: EncounterCreature, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Skull className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-slate-300">{creature.name}</span>
                    {creature.role && (
                      <span className={`text-xs ${ROLE_COLORS[creature.role] || 'text-slate-400'}`}>
                        ({creature.role})
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400 font-mono">x{creature.count}</span>
                </div>
              ))}
            </div>
            {mechanics.creatures.some((c: EncounterCreature) => c.notes) && (
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {mechanics.creatures
                  .filter((c: EncounterCreature) => c.notes)
                  .map((c: EncounterCreature, i: number) => (
                    <div key={i}>
                      <strong className="text-slate-400">{c.name}:</strong> {c.notes}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Terrain & Hazards */}
        <div className="grid grid-cols-2 gap-3">
          {mechanics.terrain && mechanics.terrain.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase">Terrain</span>
              <ul className="space-y-1 mt-1">
                {mechanics.terrain.map((t, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-teal-400">-</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {mechanics.hazards && mechanics.hazards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium text-orange-400 uppercase">Hazards</span>
              </div>
              <ul className="space-y-1">
                {mechanics.hazards.map((h, i) => (
                  <li key={i} className="text-sm text-orange-300 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Phases */}
        {mechanics.phases && mechanics.phases.length > 0 && (
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Combat Phases</span>
            </div>
            <div className="space-y-2">
              {mechanics.phases.map((phase: EncounterPhase, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                  <ChevronRight className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-yellow-400">{phase.trigger}</span>
                    <p className="text-sm text-slate-300">{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
