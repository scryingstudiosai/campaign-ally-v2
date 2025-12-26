'use client'

import { CreatureSoul } from '@/types/living-entity'
import { Sparkles, Eye, VolumeIcon, MapPin, TreePine, Footprints, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreatureSoulCardProps {
  soul: CreatureSoul
}

const SOCIAL_STRUCTURE_LABELS: Record<string, string> = {
  solitary: 'Solitary',
  pair: 'Mated Pairs',
  pack: 'Pack',
  swarm: 'Swarm',
  hive: 'Hive',
  colony: 'Colony',
}

export function CreatureSoulCard({ soul }: CreatureSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) return null

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-rose-400 font-medium border-b border-rose-500/20 pb-2">
        <Sparkles className="w-5 h-5" />
        <span>Creature Soul</span>
      </div>

      {/* Vivid Description */}
      {soul.vivid_description && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded">
          <span className="text-xs text-rose-400 uppercase">Description</span>
          <p className="text-slate-200 mt-1 italic">{soul.vivid_description}</p>
        </div>
      )}

      {/* Distinctive Features */}
      {soul.distinctive_features && soul.distinctive_features.length > 0 && (
        <div>
          <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
            <Eye className="w-3 h-3" /> Distinctive Features
          </span>
          <ul className="text-sm text-slate-300 space-y-1">
            {soul.distinctive_features.map((feature, i) => (
              <li key={i}>• {feature}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Behavior */}
        {soul.behavior && (
          <div>
            <span className="text-xs text-slate-500 uppercase">Behavior</span>
            <p className="text-sm text-slate-300">{soul.behavior}</p>
          </div>
        )}

        {/* Social Structure */}
        {soul.social_structure && (
          <div>
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
              <Users className="w-3 h-3" /> Social Structure
            </span>
            <Badge variant="outline" className="capitalize">
              {SOCIAL_STRUCTURE_LABELS[soul.social_structure] || soul.social_structure}
            </Badge>
          </div>
        )}
      </div>

      {/* Habitat & Ecology */}
      {(soul.habitat || soul.ecology) && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
          {soul.habitat && (
            <div>
              <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> Habitat
              </span>
              <p className="text-sm text-slate-300">{soul.habitat}</p>
            </div>
          )}
          {soul.ecology && (
            <div>
              <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                <TreePine className="w-3 h-3" /> Ecology
              </span>
              <p className="text-sm text-slate-300">{soul.ecology}</p>
            </div>
          )}
        </div>
      )}

      {/* Sounds & Signs */}
      {(soul.sounds || soul.signs_of_presence) && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
          {soul.sounds && (
            <div>
              <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                <VolumeIcon className="w-3 h-3" /> Sounds
              </span>
              <p className="text-sm text-slate-300 italic">{soul.sounds}</p>
            </div>
          )}
          {soul.signs_of_presence && (
            <div>
              <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                <Footprints className="w-3 h-3" /> Signs of Presence
              </span>
              <p className="text-sm text-slate-300">{soul.signs_of_presence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
