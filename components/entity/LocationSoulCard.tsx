'use client'

import { LocationSoul } from '@/types/living-entity'
import { Sparkles, Eye, Ear, Wind, Thermometer, Lightbulb } from 'lucide-react'

interface LocationSoulCardProps {
  soul: LocationSoul
}

export function LocationSoulCard({ soul }: LocationSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) return null

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-purple-400 font-medium border-b border-purple-500/20 pb-2">
        <Sparkles className="w-5 h-5" />
        <span>Location Soul</span>
      </div>

      {/* Distinctive Feature */}
      {soul.distinctive_feature && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
          <span className="text-xs text-purple-400 uppercase">Distinctive Feature</span>
          <p className="text-slate-200 mt-1">{soul.distinctive_feature}</p>
        </div>
      )}

      {/* Sensory Grid */}
      <div className="grid grid-cols-2 gap-4">
        {soul.sights && soul.sights.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
              <Eye className="w-3 h-3" /> Sights
            </span>
            <ul className="text-sm text-slate-300 space-y-1">
              {soul.sights.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}

        {soul.sounds && soul.sounds.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
              <Ear className="w-3 h-3" /> Sounds
            </span>
            <ul className="text-sm text-slate-300 space-y-1">
              {soul.sounds.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}

        {soul.smells && soul.smells.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
              <Wind className="w-3 h-3" /> Smells
            </span>
            <ul className="text-sm text-slate-300 space-y-1">
              {soul.smells.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}

        {soul.textures && soul.textures.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
              Textures
            </span>
            <ul className="text-sm text-slate-300 space-y-1">
              {soul.textures.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}

        {(soul.temperature || soul.lighting) && (
          <div className="space-y-2">
            {soul.temperature && (
              <div>
                <span className="text-xs text-slate-500 uppercase flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Temperature
                </span>
                <p className="text-sm text-slate-300">{soul.temperature}</p>
              </div>
            )}
            {soul.lighting && (
              <div>
                <span className="text-xs text-slate-500 uppercase flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Lighting
                </span>
                <p className="text-sm text-slate-300">{soul.lighting}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mood */}
      {soul.mood && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-500 uppercase">Mood</span>
          <p className="text-slate-300 italic">{soul.mood}</p>
        </div>
      )}
    </div>
  )
}
