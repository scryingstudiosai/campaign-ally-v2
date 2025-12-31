'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollReveal } from './scroll-reveal'
import { AlertTriangle, Sparkles } from 'lucide-react'

export default function BeforeAfter() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const handleMouseDown = () => {
    isDragging.current = true
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Generic AI vs. Campaign-Aware AI
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Drag the slider to see the difference between disconnected AI content
          and Campaign Ally's world-aware generation.
        </p>
      </div>

      {/* Slider Container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-white/10 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before (Generic AI) - Left side */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-8">
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">Generic AI</span>
            </div>
          </div>

          {/* Generic content card */}
          <div className="rounded-xl bg-slate-800/60 border border-rose-500/20 p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-white mb-3">Generated Tavern Keeper</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              "Barrick is a friendly dwarf who runs the local tavern. He has a bushy beard and
              serves good ale. He knows rumors about the surrounding area and may have a quest
              for adventurers."
            </p>
            <div className="flex items-center gap-2 text-xs text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              No connection to your world
            </div>
          </div>

          {/* Problems list */}
          <div className="mt-4 space-y-2">
            {[
              'Generic fantasy tropes',
              'No faction ties',
              'No location context',
              'No relationship hooks',
            ].map((problem, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                {problem}
              </div>
            ))}
          </div>
        </div>

        {/* After (Campaign Ally) - Right side, clipped */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-8"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-300">Campaign Ally</span>
            </div>
          </div>

          {/* Campaign-aware content card */}
          <div className="rounded-xl bg-slate-800/60 border border-teal-500/20 p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-white mb-3">Generated Tavern Keeper</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              "Thordak Ironvow runs The Broken Crown in Thornhaven. A former Silver Covenant
              operative, he now uses his tavern to shelter refugees from the Crown's persecution.
              He's heard whispers that Commander Stonefist may be sympathetic to the cause."
            </p>

            {/* Connections */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-purple-300">Member of The Silver Covenant</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-teal-300">Located in Thornhaven Outpost</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-blue-300">Knows about Grimjaw Stonefist</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Sparkles className="w-3 h-3" />
              Automatically connected to your world
            </div>
          </div>

          {/* Benefits list */}
          <div className="mt-4 space-y-2">
            {[
              'Matches your campaign tone',
              'Ties to existing factions',
              'References known NPCs',
              'Built-in story hooks',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-teal-400">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}
