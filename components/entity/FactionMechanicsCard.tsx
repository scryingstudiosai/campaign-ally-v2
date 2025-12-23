'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, MapPin, Coins, Award, UserPlus } from 'lucide-react'
import type { FactionMechanics } from '@/types/living-entity'

interface FactionMechanicsCardProps {
  mechanics: FactionMechanics
}

const INFLUENCE_COLORS: Record<string, string> = {
  negligible: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  dominant: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const WEALTH_COLORS: Record<string, string> = {
  destitute: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  poor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  wealthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  vast: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

const MILITARY_COLORS: Record<string, string> = {
  none: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  militia: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  guards: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  army: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  elite_forces: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STABILITY_COLORS: Record<string, string> = {
  crumbling: 'bg-red-500/20 text-red-400 border-red-500/30',
  unstable: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  stable: 'bg-green-500/20 text-green-400 border-green-500/30',
  thriving: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  unshakeable: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

export function FactionMechanicsCard({ mechanics }: FactionMechanicsCardProps): JSX.Element | null {
  if (!mechanics || Object.keys(mechanics).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Faction Power
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mechanics.influence && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Influence</span>
              <Badge className={INFLUENCE_COLORS[mechanics.influence] || 'bg-slate-700'}>
                {mechanics.influence}
              </Badge>
            </div>
          )}
          {mechanics.wealth && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Wealth</span>
              <Badge className={WEALTH_COLORS[mechanics.wealth] || 'bg-slate-700'}>
                {mechanics.wealth}
              </Badge>
            </div>
          )}
          {mechanics.military && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Military</span>
              <Badge className={MILITARY_COLORS[mechanics.military] || 'bg-slate-700'}>
                {mechanics.military.replace('_', ' ')}
              </Badge>
            </div>
          )}
          {mechanics.reach && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Reach</span>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {mechanics.reach}
              </Badge>
            </div>
          )}
          {mechanics.stability && (
            <div className="text-center p-2 rounded bg-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Stability</span>
              <Badge className={STABILITY_COLORS[mechanics.stability] || 'bg-slate-700'}>
                {mechanics.stability}
              </Badge>
            </div>
          )}
        </div>

        {/* Territory */}
        {mechanics.territory && mechanics.territory.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Territory</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mechanics.territory.map((loc, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {mechanics.resources && mechanics.resources.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Resources</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mechanics.resources.map((resource, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300"
                >
                  {resource}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {mechanics.benefits && mechanics.benefits.length > 0 && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-teal-400 uppercase">Member Benefits</span>
            </div>
            <ul className="space-y-1">
              {mechanics.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5">•</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {mechanics.requirements && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Joining Requirements</span>
            </div>
            <p className="text-sm text-slate-300">{mechanics.requirements}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
