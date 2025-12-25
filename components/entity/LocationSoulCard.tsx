'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LocationSoul } from '@/types/living-entity'
import { Sparkles, Eye, Ear, Wind, Thermometer, Lightbulb, Users } from 'lucide-react'

interface LocationSoulCardProps {
  soul: LocationSoul
}

export function LocationSoulCard({ soul }: LocationSoulCardProps): JSX.Element | null {
  const params = useParams()
  const campaignId = params?.id as string

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

      {/* Key Figures */}
      {soul.key_figures && soul.key_figures.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-2">
            <Users className="w-3 h-3" /> Key Figures
          </span>
          <div className="space-y-2">
            {soul.key_figures.map((figure, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700"
              >
                <div>
                  <span className="font-medium text-slate-200">{figure.name}</span>
                  <div className="text-xs text-slate-500">{figure.role}</div>
                </div>
                {figure.entity_id && campaignId && (
                  <Link
                    href={`/dashboard/campaigns/${campaignId}/memory/${figure.entity_id}`}
                    className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
