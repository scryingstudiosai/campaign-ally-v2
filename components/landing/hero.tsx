'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ChevronRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-amber-500/10 to-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-radial from-slate-800/50 to-transparent rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-300 font-medium">AI-Powered for D&D 5e</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              The AI Co-Pilot That{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Actually Knows
              </span>{' '}
              Your World
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Stop generating generic filler. Campaign Ally remembers your NPCs, tracks your
              factions, and connects your lore automatically.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 px-8 py-4 rounded-xl transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40"
              >
                Start Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 text-lg font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 px-8 py-4 rounded-xl transition-all hover:bg-white/5"
              >
                See Campaign Awareness
              </a>
            </div>

            {/* Trust line */}
            <p className="text-sm text-slate-500">
              Built for DMs who want less prep panic and more cinematic sessions.
            </p>
          </motion.div>

          {/* Right Column - 3D Device Mock */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            style={{ perspective: 1000 }}
          >
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 shadow-2xl"
              style={{
                transform: 'rotateY(-5deg) rotateX(5deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center">
                    campaignally.ai/dashboard
                  </div>
                </div>
              </div>

              {/* App Screenshot/Mock */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-900 to-slate-800">
                {/* Sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-slate-800/80 border-r border-white/10 flex flex-col items-center py-4 gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg bg-slate-700/50" />
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="absolute left-16 right-0 top-0 bottom-0 p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20" />
                    <div>
                      <div className="h-4 w-32 bg-slate-700 rounded mb-1" />
                      <div className="h-3 w-24 bg-slate-700/50 rounded" />
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* NPC Card */}
                    <div className="rounded-lg bg-slate-800/60 border border-white/10 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/30" />
                        <div className="h-3 w-16 bg-slate-700 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-700/50 rounded" />
                        <div className="h-2 w-3/4 bg-slate-700/50 rounded" />
                      </div>
                    </div>

                    {/* Location Card */}
                    <div className="rounded-lg bg-slate-800/60 border border-teal-500/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-teal-500/30" />
                        <div className="h-3 w-20 bg-slate-700 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-700/50 rounded" />
                        <div className="h-2 w-2/3 bg-slate-700/50 rounded" />
                      </div>
                    </div>

                    {/* Quest Card */}
                    <div className="rounded-lg bg-slate-800/60 border border-amber-500/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/30" />
                        <div className="h-3 w-24 bg-slate-700 rounded" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-700/50 rounded" />
                        <div className="h-2 w-5/6 bg-slate-700/50 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* AI Generation Indicator */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs text-teal-300">AI Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-white/10 shadow-xl backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                  K
                </div>
                <div>
                  <div className="text-xs text-slate-400">Connected NPC</div>
                  <div className="text-sm text-white font-medium">Kira Shadowmend</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-teal-500/20 shadow-xl backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-teal-300">Campaign-Aware</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
