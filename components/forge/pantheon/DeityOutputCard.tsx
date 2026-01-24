'use client'

import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Crown,
  Sun,
  Scroll,
  Star,
  Flame,
  Zap,
} from 'lucide-react'
import { InteractiveText as UniversalInteractiveText, EntityType, TextRange } from '@/components/ui/interactive-text'
import type { DeityGeneration, DEITY_RANKS } from '@/types/deity'

export interface DeityOutputCardProps {
  data: DeityGeneration
  campaignId: string
  onManualDiscovery?: (text: string, type: string) => void
}

export function DeityOutputCard({
  data,
  campaignId,
  onManualDiscovery,
}: DeityOutputCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [showDmContent, setShowDmContent] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showBoons, setShowBoons] = useState(true)
  const [showCurses, setShowCurses] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle manual text selection to create discovery
  const handleManualSelect = (text: string, type: EntityType, _range: TextRange) => {
    if (onManualDiscovery) {
      onManualDiscovery(text, type)
    }
  }

  // Render text with manual selection enabled
  const renderSelectableText = (text: string | undefined): React.ReactNode => {
    if (!text) return null

    if (onManualDiscovery) {
      return (
        <UniversalInteractiveText
          content={text}
          onManualSelect={handleManualSelect}
        />
      )
    }

    return text
  }

  const rankLabel = data.rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div ref={contentRef} className="space-y-4">
      {/* Header */}
      <div className="ca-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4">
            {/* Symbol Display */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
              <Crown className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-400">
                {data.name}
              </h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.soul.titles.map((title, i) => (
                  <span key={i} className="text-sm text-purple-300/80 italic">
                    {title}{i < data.soul.titles.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  {rankLabel}
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  {data.soul.portfolio.alignment}
                </Badge>
                {data.soul.portfolio.domains.map((domain, i) => (
                  <Badge key={i} variant="outline" className="text-amber-400 border-amber-500/30">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDmContent(!showDmContent)}
          >
            {showDmContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-2">{showDmContent ? 'Hide' : 'Show'} DM Content</span>
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${showDmContent ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="tenets">Tenets & Prayers</TabsTrigger>
          <TabsTrigger value="signals">Divine Signals</TabsTrigger>
          <TabsTrigger value="worship">Worship</TabsTrigger>
          {showDmContent && (
            <TabsTrigger value="secrets" className="text-red-400">DM Secrets</TabsTrigger>
          )}
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
        </TabsList>

        {/* PORTFOLIO TAB */}
        <TabsContent value="portfolio" className="space-y-4">
          {/* Symbol */}
          <div className="ca-card p-4 border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
              <Sun className="w-4 h-4" /> Holy Symbol
            </h3>
            <p className="text-slate-200 text-lg">{data.soul.portfolio.symbol}</p>
          </div>

          <div className="ca-card p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Favored Weapon</h4>
                <p className="text-slate-300">{data.soul.portfolio.favored_weapon || 'None specified'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Holy Day</h4>
                <p className="text-slate-300">{data.soul.portfolio.holy_day || 'None specified'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Colors</h4>
                <div className="flex gap-2 flex-wrap">
                  {data.soul.portfolio.sacred_colors.map((color, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-sm">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Animal</h4>
                <p className="text-slate-300">{data.soul.portfolio.sacred_animal || 'None specified'}</p>
              </div>
            </div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Manifestation</h4>
            <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.soul.manifestation)}</div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Personality</h4>
            <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.soul.personality)}</div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Divine Voice</h4>
            <div className="text-slate-300 leading-relaxed italic">{renderSelectableText(data.soul.voice)}</div>
          </div>
        </TabsContent>

        {/* TENETS & PRAYERS TAB */}
        <TabsContent value="tenets" className="space-y-4">
          {/* Tenets */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <Scroll className="w-4 h-4" /> Sacred Tenets
            </h3>
            <div className="space-y-3">
              {data.soul.tenets.map((tenet, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-purple-500/50"
                >
                  <span className="text-purple-400 font-bold mr-2">{i + 1}.</span>
                  <span className="text-slate-200">{tenet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prayers */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Prayers
              <span className="text-xs font-normal text-slate-500">(for players to speak)</span>
            </h3>
            <div className="space-y-3">
              {/* Invocation */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Invocation</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.soul.prayers.invocation, 'Invocation')}
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === 'Invocation' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-slate-200 italic">&ldquo;{data.soul.prayers.invocation}&rdquo;</p>
              </div>

              {/* Blessing */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Blessing</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.soul.prayers.blessing, 'Blessing')}
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === 'Blessing' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-slate-200 italic">&ldquo;{data.soul.prayers.blessing}&rdquo;</p>
              </div>

              {/* Oath */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase">Oath</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.soul.prayers.oath, 'Oath')}
                    className="h-6 w-6 p-0"
                  >
                    {copiedField === 'Oath' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-slate-200 italic">&ldquo;{data.soul.prayers.oath}&rdquo;</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* DIVINE SIGNALS TAB */}
        <TabsContent value="signals" className="space-y-4">
          {/* Distance Indicator */}
          <div className="ca-card p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Divine Involvement:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.brain.divine_signals.distance === 'interventionist'
                  ? 'bg-green-500/20 text-green-400'
                  : data.brain.divine_signals.distance === 'symbolic'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {data.brain.divine_signals.distance.charAt(0).toUpperCase() +
                 data.brain.divine_signals.distance.slice(1)}
              </span>
            </div>
          </div>

          {/* Omens */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Omens
              <span className="text-xs font-normal text-slate-500">(Read Aloud)</span>
            </h3>

            <div className="space-y-4">
              {/* Watching */}
              <div className="p-4 bg-teal-500/5 border border-teal-500/30 rounded-lg">
                <h5 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                  When {data.name} is Watching...
                </h5>
                <ul className="space-y-2">
                  {data.brain.divine_signals.omens.watching.map((omen, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-teal-400">*</span>
                      <span className="italic">{omen}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pleased */}
              <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                <h5 className="text-xs font-semibold text-green-400 uppercase mb-2">
                  Signs of Divine Favor...
                </h5>
                <ul className="space-y-2">
                  {data.brain.divine_signals.omens.pleased.map((omen, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="italic">{omen}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Angry */}
              <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                <h5 className="text-xs font-semibold text-red-400 uppercase mb-2">
                  Signs of Divine Displeasure...
                </h5>
                <ul className="space-y-2">
                  {data.brain.divine_signals.omens.angry.map((omen, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-red-400">!</span>
                      <span className="italic">{omen}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Boons */}
          {data.brain.divine_signals.boons.length > 0 && (
            <div className="ca-card p-4">
              <button
                onClick={() => setShowBoons(!showBoons)}
                className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2 hover:text-green-300"
              >
                <Flame className="w-4 h-4" /> Divine Boons
                <span className="text-xs text-slate-500">({showBoons ? 'Hide' : 'Show'})</span>
              </button>

              {showBoons && (
                <div className="grid gap-3">
                  {data.brain.divine_signals.boons.map((boon, i) => (
                    <div key={i} className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                      <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Trigger:</div>
                      <p className="text-slate-300 mb-2">{boon.trigger}</p>
                      <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Effect:</div>
                      <p className="text-green-200 font-medium">{boon.effect}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Curses */}
          {data.brain.divine_signals.curses.length > 0 && (
            <div className="ca-card p-4">
              <button
                onClick={() => setShowCurses(!showCurses)}
                className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2 hover:text-red-300"
              >
                <Zap className="w-4 h-4" /> Divine Curses
                <span className="text-xs text-slate-500">({showCurses ? 'Hide' : 'Show'})</span>
              </button>

              {showCurses && (
                <div className="grid gap-3">
                  {data.brain.divine_signals.curses.map((curse, i) => (
                    <div key={i} className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                      <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Trigger:</div>
                      <p className="text-slate-300 mb-2">{curse.trigger}</p>
                      <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Punishment:</div>
                      <p className="text-red-200 font-medium">{curse.effect}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* WORSHIP TAB */}
        <TabsContent value="worship" className="space-y-4">
          <div className="ca-card p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Followers</h4>
                <p className="text-slate-300">{data.soul.worship.followers}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Clergy Title</h4>
                <p className="text-slate-300 font-medium text-lg">{data.soul.worship.clergy_title}</p>
              </div>
            </div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Temple Style</h4>
            <p className="text-slate-300 leading-relaxed">{data.soul.worship.temple_style}</p>
          </div>

          <div className="ca-card p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Rituals</h4>
                <ul className="space-y-1">
                  {data.soul.worship.rituals.map((ritual, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-purple-400">*</span>
                      {ritual}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Offerings</h4>
                <ul className="space-y-1">
                  {data.soul.worship.offerings.map((offering, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400">*</span>
                      {offering}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Taboos</h4>
            <ul className="space-y-1">
              {data.soul.worship.taboos.map((taboo, i) => (
                <li key={i} className="text-slate-300 flex items-start gap-2">
                  <span className="text-red-400">X</span>
                  {taboo}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* DM SECRETS TAB */}
        {showDmContent && (
          <TabsContent value="secrets" className="space-y-4">
            <div className="ca-card p-4 bg-red-500/5 border border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <EyeOff className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">DM TRUTH</h3>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">
                  Hidden from Players
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">True Nature</h4>
                  <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.brain.true_nature)}</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Divine Agenda</h4>
                  <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.brain.divine_agenda)}</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Secrets</h4>
                  <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.brain.secrets)}</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Conflicts</h4>
                  <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.brain.conflicts)}</div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Weaknesses</h4>
                  <div className="text-slate-300 leading-relaxed">{renderSelectableText(data.brain.weaknesses)}</div>
                </div>

                {data.brain.hooks?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Adventure Hooks</h4>
                    <ul className="space-y-2">
                      {data.brain.hooks.map((hook, i) => (
                        <li key={i} className="text-slate-300 p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                          <span className="text-purple-400 font-bold">{i + 1}.</span>
                          {hook}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* MECHANICS TAB */}
        <TabsContent value="mechanics" className="space-y-4">
          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Cleric Domains</h4>
            <div className="flex flex-wrap gap-2">
              {data.mechanics.cleric_domains.map((domain, i) => (
                <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md text-sm">
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {data.mechanics.channel_divinity && (
            <div className="ca-card p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Channel Divinity</h4>
              <p className="text-slate-300 leading-relaxed p-3 bg-slate-800/50 rounded-lg">
                {data.mechanics.channel_divinity}
              </p>
            </div>
          )}

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Sacred Spells</h4>
            <div className="flex flex-wrap gap-2">
              {data.mechanics.sacred_spells.map((spell, i) => (
                <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-md text-sm">
                  {spell}
                </span>
              ))}
            </div>
          </div>

          <div className="ca-card p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Suggested Classes</h4>
            <div className="flex flex-wrap gap-2">
              {data.mechanics.suggested_classes.map((cls, i) => (
                <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-sm">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
