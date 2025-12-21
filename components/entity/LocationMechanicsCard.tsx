'use client'

import { LocationMechanics } from '@/types/living-entity'
import { Swords, AlertTriangle, Tent, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LocationMechanicsCardProps {
  mechanics: LocationMechanics
}

export function LocationMechanicsCard({ mechanics }: LocationMechanicsCardProps): JSX.Element | null {
  if (!mechanics || Object.keys(mechanics).length === 0) return null

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-blue-400 font-medium border-b border-blue-500/20 pb-2">
        <Swords className="w-5 h-5" />
        <span>Mechanics</span>
      </div>

      {/* Size & Terrain */}
      <div className="grid grid-cols-2 gap-3">
        {mechanics.size && (
          <div>
            <span className="text-xs text-slate-500 uppercase">Size</span>
            <p className="text-slate-300">{mechanics.size}</p>
          </div>
        )}

        {mechanics.terrain && mechanics.terrain.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase">Terrain</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {mechanics.terrain.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hazards */}
      {mechanics.hazards && mechanics.hazards.length > 0 && (
        <div>
          <span className="text-xs text-red-400 uppercase flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" /> Hazards
          </span>
          <div className="space-y-2">
            {mechanics.hazards.map((hazard, i) => (
              <div key={i} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-red-400">{hazard.name}</span>
                  {hazard.dc && (
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 rounded">DC {hazard.dc}</span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{hazard.description}</p>
                {hazard.damage && <span className="text-xs text-red-300">Damage: {hazard.damage}</span>}
                {hazard.effect && <span className="text-xs text-red-300 block">Effect: {hazard.effect}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encounters */}
      {mechanics.encounters && mechanics.encounters.length > 0 && (
        <div>
          <span className="text-xs text-orange-400 uppercase flex items-center gap-1 mb-2">
            <Swords className="w-3 h-3" /> Encounters
          </span>
          <div className="space-y-1">
            {mechanics.encounters.map((enc, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                <span className="text-slate-300">{enc.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{enc.likelihood}</Badge>
                  {enc.cr_range && <span className="text-xs text-slate-500">CR {enc.cr_range}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resting */}
      {mechanics.resting && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
          <span className="text-xs text-green-400 uppercase flex items-center gap-1 mb-1">
            <Tent className="w-3 h-3" /> Resting
          </span>
          <div className="text-sm text-slate-300 grid grid-cols-2 gap-2">
            <p>Safe Rest: {mechanics.resting.safe_rest ? 'Yes' : 'No'}</p>
            <p>Long Rest: {mechanics.resting.long_rest_available ? 'Yes' : 'No'}</p>
            {mechanics.resting.cost && <p className="col-span-2">Cost: {mechanics.resting.cost}</p>}
          </div>
        </div>
      )}

      {/* Travel Time */}
      {mechanics.travel_time && (
        <div>
          <span className="text-xs text-slate-500 uppercase">Travel Time</span>
          <div className="text-sm text-slate-300">
            {mechanics.travel_time.from && <span>From: {mechanics.travel_time.from}</span>}
            {mechanics.travel_time.duration && <span className="ml-2">Duration: {mechanics.travel_time.duration}</span>}
            {mechanics.travel_time.method && <span className="ml-2">({mechanics.travel_time.method})</span>}
          </div>
        </div>
      )}

      {/* Resources */}
      {mechanics.resources && mechanics.resources.length > 0 && (
        <div>
          <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Package className="w-3 h-3" /> Resources
          </span>
          <div className="flex flex-wrap gap-1">
            {mechanics.resources.map((r, i) => (
              <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
