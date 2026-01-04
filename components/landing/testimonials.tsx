'use client'

import { ScrollReveal } from './scroll-reveal'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Campaign Ally finally solved my biggest DM problem: keeping track of who knows what. Now my NPCs remember past interactions automatically.",
    author: "Sarah M.",
    role: "DM for 8 years",
    avatar: "S",
    color: "from-blue-500 to-indigo-500",
  },
  {
    quote: "The AI-generated content actually fits my world. It references my factions, uses my locations. It's like having an assistant who's read all my notes.",
    author: "Marcus T.",
    role: "Forever DM",
    avatar: "M",
    color: "from-teal-500 to-cyan-500",
  },
  {
    quote: "Session prep went from 4 hours to 45 minutes. The playbook feature with quick NPC references is a game-changer for running sessions.",
    author: "Elena K.",
    role: "Weekly DM",
    avatar: "E",
    color: "from-purple-500 to-violet-500",
  },
]

export default function Testimonials() {
  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Trusted by Dungeon Masters
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Join DMs who've transformed their prep workflow and created more immersive campaigns.
        </p>
      </div>

      {/* Testimonial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <ScrollReveal key={index} delay={index * 0.15}>
            <div className="h-full rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur p-6 transition-all hover:border-white/20">
              {/* Quote icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-slate-700" />
              </div>

              {/* Quote text */}
              <blockquote className="text-slate-300 leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold`}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-medium">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Social proof stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { value: '1,000+', label: 'Campaigns Created' },
          { value: '50,000+', label: 'NPCs Generated' },
          { value: '4.9★', label: 'Average Rating' },
          { value: '2hrs', label: 'Avg. Prep Saved/Week' },
        ].map((stat, index) => (
          <ScrollReveal key={index} delay={0.3 + index * 0.1}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}
