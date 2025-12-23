'use client'

import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { SelectionPopover } from '@/components/forge/SelectionPopover'
import { renderWithBold } from '@/lib/text-utils'
import {
  Shield,
  Target,
  Eye,
  Coins,
  Users,
  MapPin,
  Scroll,
  Crown,
  Lock,
  AlertTriangle,
  Award,
} from 'lucide-react'
import type { ScanResult, Discovery, EntityType } from '@/types/forge'

interface FactionBrain {
  purpose?: string
  goals?: string
  current_agenda?: string
  methods?: string
  secret?: string
  weakness?: string
  hierarchy?: string
  key_members?: string[]
}

interface FactionSoul {
  motto?: string
  symbol?: string
  reputation?: string
  colors?: string[]
  culture?: string
  greeting?: string
}

interface FactionMechanics {
  influence?: string
  wealth?: string
  military?: string
  reach?: string
  stability?: string
  territory?: string[]
  resources?: string[]
  benefits?: string[]
  requirements?: string
}

interface FactionFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

export interface GeneratedFaction {
  name: string
  sub_type: string
  brain: FactionBrain
  soul: FactionSoul
  mechanics: FactionMechanics
  facts: FactionFact[]
  read_aloud: string
  dm_slug: string
}

interface FactionOutputCardProps {
  data: GeneratedFaction
  scanResult?: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status'], linkedEntityId?: string) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string; sub_type?: string }>
}

const INFLUENCE_COLORS: Record<string, string> = {
  negligible: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  dominant: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const WEALTH_COLORS: Record<string, string> = {
  destitute: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  poor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  wealthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  vast: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

const MILITARY_COLORS: Record<string, string> = {
  none: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  militia: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  guards: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  army: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  elite_forces: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const FACTION_TYPE_LABELS: Record<string, string> = {
  guild: 'Guild',
  military: 'Military',
  religious: 'Religious',
  criminal: 'Criminal',
  political: 'Political',
  merchant: 'Merchant',
  cult: 'Cult',
  noble_house: 'Noble House',
  secret_society: 'Secret Society',
}

export function FactionOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: FactionOutputCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState('soul')
  const contentRef = useRef<HTMLDivElement>(null)

  const { brain, soul, mechanics } = data

  // Render text with interactive links if scan result available, otherwise just bold
  const renderTextWithDiscoveries = (text: string | undefined): React.ReactNode => {
    if (!text) return null

    if (scanResult) {
      return (
        <InteractiveText
          text={text}
          scanResult={scanResult}
          campaignId={campaignId}
          onDiscoveryAction={onDiscoveryAction}
        />
      )
    }

    return renderWithBold(text)
  }

  return (
    <div ref={contentRef} className="space-y-4">
      {/* Header */}
      <div className="ca-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-100">{data.name}</h3>
            <p className="text-sm text-slate-400">
              {FACTION_TYPE_LABELS[data.sub_type] || data.sub_type}
            </p>
          </div>
          {soul?.motto && (
            <div className="text-right">
              <p className="text-sm italic text-teal-400">&quot;{soul.motto}&quot;</p>
            </div>
          )}
        </div>

        {/* DM Slug */}
        {data.dm_slug && (
          <div className="text-sm text-slate-400 border-l-2 border-teal-500 pl-3 mb-3">
            {data.dm_slug}
          </div>
        )}

        {/* Read Aloud */}
        {data.read_aloud && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-sm text-slate-300 italic">
              {renderTextWithDiscoveries(data.read_aloud)}
            </p>
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
          <TabsTrigger value="soul" className="text-xs">
            <Scroll className="w-3 h-3 mr-1" />
            Soul
          </TabsTrigger>
          <TabsTrigger value="brain" className="text-xs">
            <Target className="w-3 h-3 mr-1" />
            Brain
          </TabsTrigger>
          <TabsTrigger value="mechanics" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Mechanics
          </TabsTrigger>
        </TabsList>

        {/* Soul Tab */}
        <TabsContent value="soul" className="space-y-3 mt-3">
          {soul && Object.keys(soul).length > 0 ? (
            <div className="ca-card p-4 space-y-4">
              {/* Symbol */}
              {soul.symbol && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Symbol</span>
                  </div>
                  <p className="text-sm text-slate-300">{soul.symbol}</p>
                </div>
              )}

              {/* Reputation */}
              {soul.reputation && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Reputation</span>
                  </div>
                  <p className="text-sm text-slate-300">{soul.reputation}</p>
                </div>
              )}

              {/* Colors */}
              {soul.colors && soul.colors.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Colors</span>
                  <div className="flex gap-2 mt-1">
                    {soul.colors.map((color, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Culture */}
              {soul.culture && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Culture & Values</span>
                  <p className="text-sm text-slate-300 mt-1">{soul.culture}</p>
                </div>
              )}

              {/* Greeting */}
              {soul.greeting && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Member Greeting</span>
                  <p className="text-sm text-slate-300 italic mt-1">&quot;{soul.greeting}&quot;</p>
                </div>
              )}
            </div>
          ) : (
            <div className="ca-card p-4 text-center text-slate-500 text-sm">
              No soul data available
            </div>
          )}
        </TabsContent>

        {/* Brain Tab */}
        <TabsContent value="brain" className="space-y-3 mt-3">
          {brain && Object.keys(brain).length > 0 ? (
            <div className="ca-card p-4 space-y-4">
              {/* Purpose */}
              {brain.purpose && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Purpose</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {renderTextWithDiscoveries(brain.purpose)}
                  </p>
                </div>
              )}

              {/* Goals */}
              {brain.goals && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Long-term Goals</span>
                  <p className="text-sm text-slate-300 mt-1">
                    {renderTextWithDiscoveries(brain.goals)}
                  </p>
                </div>
              )}

              {/* Current Agenda */}
              {brain.current_agenda && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-amber-400 uppercase">Current Agenda</span>
                  <p className="text-sm text-slate-300 mt-1">
                    {renderTextWithDiscoveries(brain.current_agenda)}
                  </p>
                </div>
              )}

              {/* Methods */}
              {brain.methods && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Methods</span>
                  <p className="text-sm text-slate-300 mt-1">{brain.methods}</p>
                </div>
              )}

              {/* Hierarchy */}
              {brain.hierarchy && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Hierarchy</span>
                  <p className="text-sm text-slate-300 mt-1">{brain.hierarchy}</p>
                </div>
              )}

              {/* Key Members */}
              {brain.key_members && brain.key_members.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Key Members</span>
                    <span className="text-xs text-teal-400 ml-auto">Added to Discoveries ↗</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {brain.key_members.map((member, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-300"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secret - DM Only */}
              {brain.secret && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-medium text-rose-400 uppercase">Secret (DM Only)</span>
                  </div>
                  <p className="text-sm text-slate-300">{brain.secret}</p>
                </div>
              )}

              {/* Weakness */}
              {brain.weakness && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400 uppercase">Weakness</span>
                  </div>
                  <p className="text-sm text-slate-300">{brain.weakness}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="ca-card p-4 text-center text-slate-500 text-sm">
              No brain data available
            </div>
          )}
        </TabsContent>

        {/* Mechanics Tab */}
        <TabsContent value="mechanics" className="space-y-3 mt-3">
          {mechanics && Object.keys(mechanics).length > 0 ? (
            <div className="ca-card p-4 space-y-4">
              {/* Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mechanics.influence && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Influence</span>
                    <Badge className={INFLUENCE_COLORS[mechanics.influence] || 'bg-slate-700'}>
                      {mechanics.influence}
                    </Badge>
                  </div>
                )}
                {mechanics.wealth && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Wealth</span>
                    <Badge className={WEALTH_COLORS[mechanics.wealth] || 'bg-slate-700'}>
                      {mechanics.wealth}
                    </Badge>
                  </div>
                )}
                {mechanics.military && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Military</span>
                    <Badge className={MILITARY_COLORS[mechanics.military] || 'bg-slate-700'}>
                      {mechanics.military.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
                {mechanics.reach && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Reach</span>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {mechanics.reach}
                    </Badge>
                  </div>
                )}
                {mechanics.stability && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Stability</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {mechanics.stability}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Territory */}
              {mechanics.territory && mechanics.territory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Territory</span>
                    <span className="text-xs text-teal-400 ml-auto">Added to Discoveries ↗</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mechanics.territory.map((loc, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {mechanics.resources && mechanics.resources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Resources</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mechanics.resources.map((resource, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {mechanics.benefits && mechanics.benefits.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Member Benefits</span>
                  </div>
                  <ul className="space-y-1">
                    {mechanics.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-teal-400 mt-1">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {mechanics.requirements && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Joining Requirements</span>
                  <p className="text-sm text-slate-300 mt-1">{mechanics.requirements}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="ca-card p-4 text-center text-slate-500 text-sm">
              No mechanics data available
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Facts */}
      {data.facts && data.facts.length > 0 && (
        <div className="ca-card p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Facts ({data.facts.length})</h4>
          <div className="space-y-2">
            {data.facts.map((fact, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${
                    fact.visibility === 'dm_only' ? 'text-amber-400 border-amber-400/30' : 'text-slate-400'
                  }`}
                >
                  {fact.category}
                </Badge>
                <span className="text-slate-300 text-sm">{fact.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Popover for manual discovery creation */}
      {onManualDiscovery && (
        <SelectionPopover
          containerRef={contentRef}
          onCreateDiscovery={onManualDiscovery}
          onSearchExisting={onLinkExisting || (() => {})}
          existingEntities={existingEntities}
        />
      )}
    </div>
  )
}
