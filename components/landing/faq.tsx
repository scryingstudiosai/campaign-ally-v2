'use client'

import { useState } from 'react'
import { ScrollReveal } from './scroll-reveal'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'What makes Campaign Ally different from other AI tools?',
    answer: 'Campaign Ally is campaign-aware. Unlike generic AI that produces disconnected content, our AI understands your world. It knows your NPCs, remembers your factions, and references your locations. Every piece of generated content ties into your existing lore automatically.',
  },
  {
    question: 'Do I need to know D&D 5e rules to use Campaign Ally?',
    answer: 'Not at all! While we integrate D&D 5e SRD content for things like monsters and spells, Campaign Ally works great for any tabletop RPG or even system-agnostic campaigns. The core features—world building, session planning, and content generation—work regardless of your game system.',
  },
  {
    question: 'Can players see my DM notes?',
    answer: 'Never. Player Portal access is completely separate from your DM view. Players only see content you explicitly share with them. Your secret plots, NPC motivations, and hidden connections remain private until you choose to reveal them.',
  },
  {
    question: 'What happens if I hit my generation limit?',
    answer: 'You can keep using Campaign Ally normally—you just won\'t be able to generate new AI content until the next billing cycle. All your existing content, session planning, and manual editing features remain fully accessible. You can upgrade anytime for more generations.',
  },
  {
    question: 'Can I export my campaign data?',
    answer: 'Yes! You own your data completely. Export your entire campaign as JSON, or export individual entities as markdown files. We believe your world belongs to you, whether you stay with us or not.',
  },
  {
    question: 'Is my campaign data private and secure?',
    answer: 'Absolutely. We never sell your data or use it to train AI models. Your campaigns are encrypted and stored securely. Only you and the players you invite can access your content. Read our privacy policy for full details.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <ScrollReveal>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Got questions? We've got answers. If you need more help, reach out to our support team.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index

          return (
            <ScrollReveal key={index} delay={index * 0.05}>
              <div
                className={`rounded-xl border transition-all ${
                  isOpen
                    ? 'border-teal-500/30 bg-slate-900/70'
                    : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </ScrollReveal>
  )
}
