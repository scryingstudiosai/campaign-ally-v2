import Navbar from '@/components/landing/navbar'
import Hero from '@/components/landing/hero'
import InteractiveDemo from '@/components/landing/interactive-demo'
import BeforeAfter from '@/components/landing/before-after'
import Features from '@/components/landing/features'
import HowItWorks from '@/components/landing/how-it-works'
import Testimonials from '@/components/landing/testimonials'
import Pricing from '@/components/landing/pricing'
import FAQ from '@/components/landing/faq'
import FinalCTA from '@/components/landing/final-cta'
import Footer from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-white">
      <Navbar />
      <Hero />

      <section id="demo" className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <InteractiveDemo />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <BeforeAfter />
        </div>
      </section>

      <section id="features" className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <Features />
        </div>
      </section>

      <section id="how" className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <HowItWorks />
        </div>
      </section>

      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <Testimonials />
        </div>
      </section>

      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <Pricing />
        </div>
      </section>

      <section id="faq" className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <FAQ />
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  )
}
