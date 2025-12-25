import Link from 'next/link'
import { ArrowLeft, Scale } from 'lucide-react'

export const metadata = {
  title: 'Game Content Licenses | Campaign Ally',
  description: 'Legal information about game content used in Campaign Ally',
}

export default function LicensesPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Scale className="w-8 h-8 text-teal-400" />
          <h1 className="text-3xl font-bold">Game Content Licenses</h1>
        </div>

        {/* D&D 5e SRD Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-teal-400">
            Dungeons &amp; Dragons 5th Edition System Reference Document 5.1
          </h2>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-4">
            <p className="text-slate-300 mb-4">
              This application uses content from the System Reference Document 5.1
              (&quot;SRD 5.1&quot;) published by Wizards of the Coast LLC. The SRD 5.1 content
              includes creature statistics, spell descriptions, and item mechanics.
            </p>
            <p className="text-slate-400 text-sm">
              The SRD 5.1 is used under the terms of the Open Gaming License v1.0a.
            </p>
          </div>

          <details className="bg-slate-900 border border-slate-800 rounded-lg">
            <summary className="p-4 cursor-pointer text-slate-300 hover:text-slate-100 font-medium">
              View Full Open Game License v1.0a
            </summary>
            <div className="p-6 pt-0 max-h-96 overflow-y-auto text-sm border-t border-slate-800 mt-4">
              <h3 className="font-bold text-slate-200 mb-4">OPEN GAME LICENSE Version 1.0a</h3>

              <p className="text-slate-400 mb-4">
                The following text is the property of Wizards of the Coast, Inc. and is
                Copyright 2000 Wizards of the Coast, Inc (&quot;Wizards&quot;). All Rights Reserved.
              </p>

              <div className="space-y-4 text-slate-400">
                <p>
                  <strong className="text-slate-300">1. Definitions:</strong> (a) &quot;Contributors&quot; means the copyright
                  and/or trademark owners who have contributed Open Game Content; (b) &quot;Derivative
                  Material&quot; means copyrighted material including derivative works and translations
                  (including into other computer languages), potation, modification, correction,
                  addition, extension, upgrade, improvement, compilation, abridgment or other form
                  in which an existing work may be recast, transformed or adapted; (c) &quot;Distribute&quot;
                  means to reproduce, license, rent, lease, sell, broadcast, publicly display,
                  transmit or otherwise distribute; (d) &quot;Open Game Content&quot; means the game mechanic
                  and includes the methods, procedures, processes and routines to the extent such
                  content does not embody the Product Identity and is an enhancement over the prior
                  art and any additional content clearly identified as Open Game Content by the
                  Contributor, and means any work covered by this License, including translations
                  and derivative works under copyright law, but specifically excludes Product Identity.
                </p>

                <p>
                  <strong className="text-slate-300">2. The License:</strong> This License applies to any Open Game
                  Content that contains a notice indicating that the Open Game Content may only be
                  Used under and in terms of this License. You must affix such a notice to any Open
                  Game Content that you Use. No terms may be added to or subtracted from this License
                  except as described by the License itself. No other terms or conditions may be
                  applied to any Open Game Content distributed using this License.
                </p>

                <p>
                  <strong className="text-slate-300">3. Offer and Acceptance:</strong> By Using the Open Game Content
                  You indicate Your acceptance of the terms of this License.
                </p>

                <p>
                  <strong className="text-slate-300">4. Grant and Consideration:</strong> In consideration for agreeing
                  to use this License, the Contributors grant You a perpetual, worldwide, royalty-free,
                  non-exclusive license with the exact terms of this License to Use, the Open Game Content.
                </p>

                <p>
                  <strong className="text-slate-300">5. Representation of Authority to Contribute:</strong> If You are
                  contributing original material as Open Game Content, You represent that Your
                  Contributions are Your original creation and/or You have sufficient rights to grant
                  the rights conveyed by this License.
                </p>

                <p>
                  <strong className="text-slate-300">6. Notice of License Copyright:</strong> You must update the
                  COPYRIGHT NOTICE portion of this License to include the exact text of the COPYRIGHT
                  NOTICE of any Open Game Content You are copying, modifying or distributing, and You
                  must add the title, the copyright date, and the copyright holder&apos;s name to the
                  COPYRIGHT NOTICE of any original Open Game Content you Distribute.
                </p>

                <p>
                  <strong className="text-slate-300">7. Use of Product Identity:</strong> You agree not to Use any
                  Product Identity, including as an indication as to compatibility, except as expressly
                  licensed in another, independent Agreement with the owner of each element of that
                  Product Identity.
                </p>

                <p>
                  <strong className="text-slate-300">8. Identification:</strong> If you distribute Open Game Content
                  You must clearly indicate which portions of the work that you are distributing are
                  Open Game Content.
                </p>

                <p>
                  <strong className="text-slate-300">9. Updating the License:</strong> Wizards or its designated
                  Agents may publish updated versions of this License. You may use any authorized
                  version of this License to copy, modify and distribute any Open Game Content
                  originally distributed under any version of this License.
                </p>

                <p>
                  <strong className="text-slate-300">10. Copy of this License:</strong> You MUST include a copy of
                  this License with every copy of the Open Game Content You Distribute.
                </p>

                <p>
                  <strong className="text-slate-300">11. Use of Contributor Credits:</strong> You may not market or
                  advertise the Open Game Content using the name of any Contributor unless You have
                  written permission from the Contributor to do so.
                </p>

                <p>
                  <strong className="text-slate-300">12. Inability to Comply:</strong> If it is impossible for You to
                  comply with any of the terms of this License with respect to some or all of the Open
                  Game Content due to statute, judicial order, or governmental regulation then You may
                  not Use any Open Game Material so affected.
                </p>

                <p>
                  <strong className="text-slate-300">13. Termination:</strong> This License will terminate automatically
                  if You fail to comply with all terms herein and fail to cure such breach within 30
                  days of becoming aware of the breach. All sublicenses shall survive the termination
                  of this License.
                </p>

                <p>
                  <strong className="text-slate-300">14. Reformation:</strong> If any provision of this License is held
                  to be unenforceable, such provision shall be reformed only to the extent necessary to
                  make it enforceable.
                </p>

                <p className="pt-4 border-t border-slate-700">
                  <strong className="text-slate-300">15. COPYRIGHT NOTICE:</strong><br /><br />
                  Open Game License v 1.0a Copyright 2000, Wizards of the Coast, LLC.<br /><br />
                  System Reference Document 5.1 Copyright 2016, Wizards of the Coast, Inc.;
                  Authors Mike Mearls, Jeremy Crawford, Chris Perkins, Rodney Thompson, Peter Lee,
                  James Wyatt, Robert J. Schwalb, Bruce R. Cordell, Chris Sims, and Steve Townshend,
                  based on original material by E. Gary Gygax and Dave Arneson.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* Disclaimer Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Disclaimer</h2>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <p className="text-slate-400">
              Campaign Ally is not affiliated with, endorsed, sponsored, or specifically approved
              by Wizards of the Coast LLC. Dungeons &amp; Dragons, D&amp;D, and Dungeon Master are
              trademarks of Wizards of the Coast LLC. This application is an independent tool
              created for tabletop roleplaying game enthusiasts.
            </p>
          </div>
        </section>

        {/* Future Systems */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-500">Coming Soon</h2>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
            <ul className="text-slate-500 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 mt-0.5">CC-BY 4.0</span>
                <span>D&amp;D 5e (2024) System Reference Document 5.2</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 mt-0.5">ORC</span>
                <span>Pathfinder 2e Remaster</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>
            Questions about licensing? Contact us at{' '}
            <a href="mailto:legal@campaignally.ai" className="text-teal-400 hover:text-teal-300">
              legal@campaignally.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
