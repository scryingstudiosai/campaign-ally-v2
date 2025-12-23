'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Scroll, MapPin } from 'lucide-react'
import type { EncounterSoul } from '@/types/living-entity'

interface EncounterSoulCardProps {
  soul: EncounterSoul
}

export function EncounterSoulCard({ soul }: EncounterSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) {
    return null
  }

  return (
    <Card className="ca-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          Encounter Soul
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Read Aloud */}
        {soul.read_aloud && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scroll className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400 uppercase">Read Aloud</span>
            </div>
            <p className="text-sm text-slate-300 italic">{soul.read_aloud}</p>
          </div>
        )}

        {/* Tension */}
        {soul.tension && (
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase">Tension</span>
            <p className="text-sm text-slate-300 mt-1">{soul.tension}</p>
          </div>
        )}

        {/* Sights & Sounds */}
        <div className="grid grid-cols-2 gap-3">
          {soul.sights && soul.sights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-400 uppercase">Sights</span>
              </div>
              <ul className="space-y-1">
                {soul.sights.map((sight, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400">-</span>
                    {sight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {soul.sounds && soul.sounds.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase">Sounds</span>
              <ul className="space-y-1 mt-1">
                {soul.sounds.map((sound, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400">-</span>
                    {sound}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Environmental Features */}
        {soul.environmental_features && soul.environmental_features.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-slate-400 uppercase">Interactive Features</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {soul.environmental_features.map((feature, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded text-sm text-teal-300"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
