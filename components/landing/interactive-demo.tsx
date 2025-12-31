'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollReveal } from './scroll-reveal'
import { Sparkles, Loader2, MapPin, Users, Swords, Link2 } from 'lucide-react'

// Mock campaign context
const mockContext = {
  campaign: 'The Shattered Crown',
  tone: 'Dark Fantasy',
  faction: 'The Silver Covenant',
  location: 'Thornhaven Outpost',
}

// Mock generated NPCs
const mockNpcs = [
  {
    name: 'Elara Nighthollow',
    role: 'Covenant Spy',
    description: 'A half-elf with silver-streaked hair who operates from the shadows of Thornhaven. She gathers intelligence for the Silver Covenant while posing as a traveling herbalist.',
    connections: ['Member of The Silver Covenant', 'Based in Thornhaven Outpost'],
    personality: 'Calculating, patient, secretly compassionate',
  },
  {
    name: 'Grimjaw Stonefist',
    role: 'Outpost Commander',
    description: 'A battle-scarred dwarf who commands the garrison at Thornhaven. Despite his gruff exterior, he harbors doubts about the Crown\'s recent decrees.',
    connections: ['Commands Thornhaven Outpost', 'Conflicted about The Silver Covenant'],
    personality: 'Dutiful, conflicted, protective of his soldiers',
  },
  {
    name: 'Vesper Moonsong',
    role: 'Covenant Emissary',
    description: 'An enigmatic tiefling bard who travels between Covenant cells. Her songs carry coded messages, and her arrival in Thornhaven signals something significant.',
    connections: ['Envoy of The Silver Covenant', 'Recently arrived at Thornhaven'],
    personality: 'Charismatic, mysterious, fiercely loyal',
  },
]

export default function InteractiveDemo() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedNpc, setGeneratedNpc] = useState<typeof mockNpcs[0] | null>(null)
  const [npcIndex, setNpcIndex] = useState(0)

  const handleForge = () => {
    setIsGenerating(true)
    setGeneratedNpc(null)

    // Simulate generation delay
    setTimeout(() => {
      setGeneratedNpc(mockNpcs[npcIndex])
      setNpcIndex((prev) => (prev + 1) % mockNpcs.length)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <ScrollReveal className="py-20">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          See Campaign Awareness in Action
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Watch how Campaign Ally generates content that connects to your existing world.
          Every NPC, location, and quest ties back to your campaign lore.
        </p>
      </div>

      {/* Demo Container */}
      <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur overflow-hidden">
        {/* Note banner */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-teal-500/20 px-4 py-2 text-center">
          <span className="text-xs text-teal-300">
            ✨ Mocked for landing page speed. The real Forge follows this flow.
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-0 pt-10">
          {/* Left Side - Campaign Context */}
          <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Your Campaign Context
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Campaign</div>
                  <div className="text-white font-medium">{mockContext.campaign}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500/30 to-slate-600/30 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tone</div>
                  <div className="text-white font-medium">{mockContext.tone}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-purple-500/10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Faction</div>
                  <div className="text-purple-300 font-medium">{mockContext.faction}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-teal-500/10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Location</div>
                  <div className="text-teal-300 font-medium">{mockContext.location}</div>
                </div>
              </div>
            </div>

            {/* Forge Button */}
            <button
              onClick={handleForge}
              disabled={isGenerating}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Forging NPC...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Forge Connected NPC
                </>
              )}
            </button>
          </div>

          {/* Right Side - Generated Result */}
          <div className="p-6 lg:p-8 min-h-[400px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Generated Result
            </h3>

            <AnimatePresence mode="wait">
              {isGenerating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-teal-400" />
                  </div>
                  <p className="mt-4 text-slate-400 text-sm">Weaving campaign connections...</p>
                </motion.div>
              )}

              {!isGenerating && !generatedNpc && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-dashed border-slate-700 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-500">
                    Click "Forge Connected NPC" to see<br />campaign-aware generation
                  </p>
                </motion.div>
              )}

              {!isGenerating && generatedNpc && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1"
                >
                  {/* NPC Card */}
                  <div className="rounded-xl bg-slate-800/60 border border-white/10 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {generatedNpc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{generatedNpc.name}</div>
                          <div className="text-sm text-blue-300">{generatedNpc.role}</div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {generatedNpc.description}
                      </p>

                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Personality</div>
                        <p className="text-sm text-slate-400">{generatedNpc.personality}</p>
                      </div>

                      {/* Connections */}
                      <div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wider mb-2">
                          <Link2 className="w-3 h-3" />
                          Campaign Connections
                        </div>
                        <div className="space-y-2">
                          {generatedNpc.connections.map((connection, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                              <span className="text-teal-300">{connection}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection callout */}
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span className="text-xs text-teal-300">
                      This NPC is automatically connected to your campaign's faction and location
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}
