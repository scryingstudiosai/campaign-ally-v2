'use client'

import { ScrollReveal } from './scroll-reveal'
import SpiderwebMini from './spiderweb-mini'
import {
  Brain,
  Sparkles,
  Users,
  Map,
  Scroll,
  Swords,
  Shield,
  BookOpen,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Campaign Memory',
    description: 'Every entity you create is remembered and used to inform future generations. Your world builds on itself.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI Forges',
    description: 'Generate NPCs, locations, quests, items, and encounters that automatically connect to your existing lore.',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  {
    icon: Users,
    title: 'Player Portal',
    description: 'Share specific content with your players. They see what you reveal—nothing more, nothing less.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Map,
    title: 'Location Hierarchy',
    description: 'Build nested locations from continents to rooms. NPCs and items inherit context from their surroundings.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: Scroll,
    title: 'Session Playbooks',
    description: 'Plan your sessions with structured beats, encounters, and NPC roleplaying notes all in one place.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: Swords,
    title: 'Encounter Builder',
    description: 'Design balanced encounters with CR calculations, terrain effects, and integrated creature stats.',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
]

export default function Features() {
  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Everything Connected
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Campaign Ally weaves your NPCs, locations, factions, and quests into a living world graph.
          Every piece of content knows about the others.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Large Feature Card - Relationship Graph */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Brain className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Relationship Web</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Watch your world come alive as entities form connections. Click any node to explore relationships.
            </p>
          </div>
          <SpiderwebMini />
        </div>

        {/* Feature Cards */}
        {features.slice(0, 4).map((feature, index) => (
          <ScrollReveal key={feature.title} delay={index * 0.1}>
            <div
              className={`h-full rounded-2xl border ${feature.borderColor} bg-slate-900/50 backdrop-blur p-6 transition-all hover:border-white/20 hover:bg-slate-900/70`}
            >
              <div className={`inline-flex p-2.5 rounded-xl ${feature.bgColor} mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </ScrollReveal>
        ))}

        {/* Bottom row features */}
        {features.slice(4).map((feature, index) => (
          <ScrollReveal key={feature.title} delay={(index + 4) * 0.1}>
            <div
              className={`h-full rounded-2xl border ${feature.borderColor} bg-slate-900/50 backdrop-blur p-6 transition-all hover:border-white/20 hover:bg-slate-900/70`}
            >
              <div className={`inline-flex p-2.5 rounded-xl ${feature.bgColor} mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </ScrollReveal>
        ))}

        {/* Additional highlight card */}
        <ScrollReveal delay={0.6}>
          <div className="h-full rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 backdrop-blur p-6">
            <div className="inline-flex p-2.5 rounded-xl bg-amber-500/10 mb-4">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">5e SRD Integrated</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Access spells, monsters, and items from the D&D 5e SRD. Add them directly to your campaign with one click.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </ScrollReveal>
  )
}
