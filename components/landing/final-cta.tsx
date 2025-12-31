'use client'

import Link from 'next/link'
import { ScrollReveal } from './scroll-reveal'
import { Sparkles, ChevronRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <ScrollReveal>
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-slate-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />

            {/* Border glow */}
            <div className="absolute inset-0 rounded-3xl border border-teal-500/30" />

            {/* Content */}
            <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
              {/* Icon */}
              <div className="inline-flex p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-6">
                <Sparkles className="w-8 h-8 text-teal-400" />
              </div>

              {/* Headline */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Campaign?
              </h2>

              {/* Subheadline */}
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                Join thousands of DMs who've discovered the power of campaign-aware AI.
                Start building your interconnected world today.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 px-8 py-4 rounded-xl transition-all shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40"
                >
                  Start Free — No Credit Card
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust line */}
              <p className="mt-6 text-sm text-slate-500">
                50 free generations • Unlimited campaigns • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
