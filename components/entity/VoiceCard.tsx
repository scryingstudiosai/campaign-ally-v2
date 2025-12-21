'use client'

import { Voice, getVoiceWithDefaults } from '@/types/living-entity'
import { MessageSquare, Volume2, Quote } from 'lucide-react'

interface VoiceCardProps {
  voice: Partial<Voice>
}

export function VoiceCard({ voice: rawVoice }: VoiceCardProps): JSX.Element {
  const voice = getVoiceWithDefaults(rawVoice)

  return (
    <div className="ca-panel p-4 space-y-3">
      <div className="flex items-center gap-2 text-slate-400 font-medium">
        <Volume2 className="w-4 h-4" />
        <span className="text-sm">Voice Profile</span>
      </div>

      {/* Style tags */}
      {voice.style.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {voice.style.map((s, i) => (
            <span key={i} className="ca-inset px-2 py-1 text-xs text-teal-400">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Speech patterns */}
      {voice.speech_patterns.length > 0 && (
        <div className="space-y-1">
          {voice.speech_patterns.map((pattern, i) => (
            <p
              key={i}
              className="text-xs text-slate-400 flex items-start gap-2"
            >
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              {pattern}
            </p>
          ))}
        </div>
      )}

      {/* Catchphrase */}
      {voice.catchphrase && (
        <div className="flex items-start gap-2 pt-2 border-t border-slate-700">
          <Quote className="w-3 h-3 text-amber-400 mt-1 shrink-0" />
          <p className="text-sm text-amber-400 italic">
            &quot;{voice.catchphrase}&quot;
          </p>
        </div>
      )}

      {/* Energy & Vocabulary */}
      <div className="flex gap-4 text-xs text-slate-500 pt-2">
        <span>
          Energy:{' '}
          <span className="text-slate-400 capitalize">{voice.energy}</span>
        </span>
        <span>
          Vocabulary:{' '}
          <span className="text-slate-400 capitalize">{voice.vocabulary}</span>
        </span>
      </div>

      {/* Tells */}
      {voice.tells && voice.tells.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            Tells
          </span>
          <ul className="mt-1 space-y-1">
            {voice.tells.map((tell, i) => (
              <li key={i} className="text-xs text-slate-400">
                • {tell}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
