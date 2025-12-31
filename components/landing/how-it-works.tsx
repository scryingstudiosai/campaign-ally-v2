'use client'

import { ScrollReveal } from './scroll-reveal'
import { Upload, Sparkles, Link2, Play } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Import or Create',
    description: 'Start fresh or import your existing campaign notes. Campaign Ally parses your content and builds an initial world graph.',
    color: 'from-blue-500 to-indigo-500',
    iconColor: 'text-blue-400',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Forge New Content',
    description: 'Use AI forges to generate NPCs, locations, quests, and more. Each generation is informed by your existing world.',
    color: 'from-teal-500 to-cyan-500',
    iconColor: 'text-teal-400',
  },
  {
    number: '03',
    icon: Link2,
    title: 'Watch Connections Form',
    description: 'As you create, Campaign Ally automatically links related entities. NPCs join factions, locations get inhabitants.',
    color: 'from-purple-500 to-violet-500',
    iconColor: 'text-purple-400',
  },
  {
    number: '04',
    icon: Play,
    title: 'Run Epic Sessions',
    description: 'Plan sessions with all your content at your fingertips. Quick references, NPC notes, and encounter stats ready to go.',
    color: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-400',
  },
]

export default function HowItWorks() {
  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          From Notes to Living World
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Campaign Ally transforms scattered ideas into an interconnected campaign
          that grows richer with every session.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent hidden lg:block" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.15}>
              <div className="relative group">
                {/* Card */}
                <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur p-6 transition-all hover:border-white/20 hover:bg-slate-900/70">
                  {/* Step number */}
                  <div
                    className={`absolute -top-4 left-6 px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-white text-sm font-bold`}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="mt-4 mb-4">
                    <div className={`inline-flex p-3 rounded-xl bg-slate-800/50 border border-white/5`}>
                      <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow connector (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-4 h-4 rotate-45 border-t-2 border-r-2 border-slate-700" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </ScrollReveal>
  )
}
