'use client'

import { cn } from '@/lib/utils'
import { Eye, Swords, Users, MapPin, Layers } from 'lucide-react'

export type Lens = 'all' | 'active' | 'threat' | 'social' | 'places'

interface AtlasLensControlProps {
  activeLens: Lens
  onLensChange: (lens: Lens) => void
}

const LENSES: { id: Lens; label: string; icon: typeof Layers; description: string }[] = [
  { id: 'all', label: 'All', icon: Layers, description: 'Show everything' },
  { id: 'active', label: 'Active', icon: Eye, description: 'Current session/quests' },
  { id: 'threat', label: 'Threats', icon: Swords, description: 'Creatures & encounters' },
  { id: 'social', label: 'Social', icon: Users, description: 'NPCs & factions' },
  { id: 'places', label: 'Places', icon: MapPin, description: 'Locations only' },
]

export function AtlasLensControl({ activeLens, onLensChange }: AtlasLensControlProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-slate-700">
        {LENSES.map((lens) => {
          const Icon = lens.icon
          const isActive = activeLens === lens.id

          return (
            <button
              key={lens.id}
              onClick={() => onLensChange(lens.id)}
              title={lens.description}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{lens.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
