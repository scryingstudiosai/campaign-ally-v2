'use client'

import { ItemVoice } from '@/types/living-entity'
import { Volume2 } from 'lucide-react'

interface ItemVoiceCardProps {
  voice: ItemVoice
}

export function ItemVoiceCard({ voice }: ItemVoiceCardProps): JSX.Element | null {
  if (!voice || Object.keys(voice).length === 0) return null

  return (
    <div className="ca-panel p-4 space-y-3 border-l-2 border-purple-500/50">
      <div className="flex items-center gap-2 text-purple-400 font-medium">
        <Volume2 className="w-4 h-4" />
        <span className="text-sm">Sentient Personality</span>
      </div>

      {voice.personality && (
        <p className="text-sm text-slate-300 italic">&quot;{voice.personality}&quot;</p>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs">
        {voice.style && voice.style.length > 0 && (
          <div>
            <span className="text-slate-500 block mb-1">Style</span>
            <div className="flex flex-wrap gap-1">
              {voice.style.map((s, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {voice.communication && (
          <div>
            <span className="text-slate-500 block mb-1">Communication</span>
            <span className="text-slate-300 capitalize">{voice.communication}</span>
          </div>
        )}
      </div>

      {voice.desires && (
        <div className="pt-2 border-t border-slate-700/50">
          <span className="text-slate-500 text-xs block mb-1">
            It wants the wielder to...
          </span>
          <p className="text-sm text-slate-300">{voice.desires}</p>
        </div>
      )}
    </div>
  )
}
