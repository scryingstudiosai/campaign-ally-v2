'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from './scroll-reveal'
import { Check, Sparkles, Crown, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    icon: Zap,
    description: 'Perfect for trying Campaign Ally',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '50 AI generations per month',
      'Full access to all forges',
      'Up to 4 player portal users',
      'Unlimited campaigns',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    icon: Sparkles,
    description: 'For serious Dungeon Masters',
    monthlyPrice: 12.99,
    yearlyPrice: 10.39,
    features: [
      '400 AI generations per month',
      'Up to 8 player portal users',
      'Priority AI queue',
      'Advanced session planning',
      'Priority email support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Legendary',
    icon: Crown,
    description: 'For power users and professionals',
    monthlyPrice: 24.99,
    yearlyPrice: 19.99,
    features: [
      'Unlimited AI generations',
      'Unlimited player portal users',
      'Commercial use license',
      'API access (coming soon)',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Go Legendary',
    popular: false,
  },
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-8">
          Start free, upgrade when you need more. All plans include full access to every feature.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 p-1 rounded-full bg-slate-800/50 border border-white/10">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isYearly
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-xs text-teal-400">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-4">
        {plans.map((plan, index) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
          const isPro = plan.popular

          return (
            <ScrollReveal key={plan.name} delay={index * 0.1}>
              <div
                className={`relative h-full rounded-2xl border overflow-hidden transition-all ${
                  isPro
                    ? 'border-teal-500/50 bg-gradient-to-b from-teal-500/10 to-slate-900/50'
                    : 'border-white/10 bg-slate-900/50'
                }`}
              >
                {/* Sheen animation for Pro card */}
                {isPro && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 w-full h-full">
                      <div
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen"
                        style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
                      />
                    </div>
                  </div>
                )}

                {/* Popular badge */}
                {isPro && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500 text-white">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="relative p-6">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isPro ? 'bg-teal-500/20' : 'bg-slate-800/50'
                      }`}
                    >
                      <plan.icon
                        className={`w-5 h-5 ${
                          isPro ? 'text-teal-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>

                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    {isYearly && price > 0 && (
                      <div className="text-sm text-teal-400 mt-1">
                        Billed ${(price * 12).toFixed(2)} annually
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 flex-shrink-0 ${
                            isPro ? 'text-teal-400' : 'text-slate-500'
                          }`}
                        />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/signup"
                    className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all ${
                      isPro
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-teal-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {/* Money back guarantee */}
      <p className="text-center text-sm text-slate-500 mt-8">
        30-day money-back guarantee • No credit card required for free tier
      </p>
    </ScrollReveal>
  )
}
