'use client'

import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { SelectionPopover } from '@/components/forge/SelectionPopover'
import { renderWithBold } from '@/lib/text-utils'
import {
  Map, Eye, Ear, Wind, Thermometer, Lightbulb,
  AlertTriangle, Swords, Tent, Sparkles, Package, Clock, Gift
} from 'lucide-react'
import type { ScanResult, Discovery, EntityType } from '@/types/forge'

interface LocationBrain {
  purpose?: string
  atmosphere?: string
  danger_level?: 'safe' | 'low' | 'moderate' | 'high' | 'deadly'
  secret?: string
  history?: string
  current_state?: string
  conflict?: string
  opportunity?: string
  contains?: string[]
}

interface LocationSoul {
  sights?: string[]
  sounds?: string[]
  smells?: string[]
  textures?: string[]
  temperature?: string
  lighting?: string
  distinctive_feature?: string
  mood?: string
}

interface LocationMechanics {
  size?: string
  terrain?: string[]
  hazards?: Array<{
    name: string
    description: string
    dc?: number
    damage?: string
    effect?: string
  }>
  resources?: string[]
  encounters?: Array<{
    name: string
    likelihood: 'common' | 'uncommon' | 'rare'
    cr_range?: string
  }>
  resting?: {
    safe_rest?: boolean
    long_rest_available?: boolean
    cost?: string
  }
}

interface LocationFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

export interface GeneratedLocation {
  name: string
  sub_type: string
  brain: LocationBrain
  soul: LocationSoul
  mechanics: LocationMechanics
  facts: LocationFact[]
  read_aloud: string
  dm_slug: string
}

interface LocationOutputCardProps {
  data: GeneratedLocation
  scanResult?: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status'], linkedEntityId?: string) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string; sub_type?: string }>
}

const DANGER_COLORS: Record<string, string> = {
  safe: 'bg-green-500/20 text-green-400 border-green-500/30',
  low: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  deadly: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function LocationOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities = [],
}: LocationOutputCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState('soul')
  const contentRef = useRef<HTMLDivElement>(null)

  const hasBrain = data.brain && Object.keys(data.brain).length > 0
  const hasSoul = data.soul && Object.keys(data.soul).length > 0
  const hasMechanics = data.mechanics && Object.keys(data.mechanics).length > 0

  const dangerLevel = data.brain?.danger_level || 'moderate'
  const dangerClass = DANGER_COLORS[dangerLevel] || DANGER_COLORS.moderate

  // Format atmosphere to be short keywords only
  const formatAtmosphere = (atmo: string | undefined): string => {
    if (!atmo) return ''
    // If already short keywords, use as-is
    if (atmo.length < 35 && !atmo.includes('.')) return atmo
    // Extract keywords from longer text
    const keywords = atmo
      .replace(/[.!?]/g, ',')
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 20)
      .slice(0, 3)
    return keywords.join(', ') || atmo.slice(0, 30)
  }

  // Render text with interactive links if scan result available, otherwise bold
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
            <h2 className="text-2xl font-bold text-teal-400">{data.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{data.sub_type}</Badge>
              <Badge className={dangerClass}>{dangerLevel}</Badge>
              {data.brain?.atmosphere && (
                <Badge variant="outline" className="text-slate-400 capitalize">
                  {formatAtmosphere(data.brain.atmosphere)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* DM Slug */}
        {data.dm_slug && (
          <p className="text-sm text-slate-400 italic">{data.dm_slug}</p>
        )}
      </div>

      {/* Read Aloud */}
      {data.read_aloud && (
        <div className="ca-card p-4 border-l-4 border-teal-500">
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-2">
            <Eye className="w-4 h-4" />
            Read Aloud
          </div>
          <div className="text-slate-200 italic leading-relaxed">
            {renderTextWithDiscoveries(data.read_aloud)}
          </div>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soul">Soul</TabsTrigger>
          <TabsTrigger value="brain">Brain</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
        </TabsList>

        {/* SOUL TAB - Sensory Details */}
        <TabsContent value="soul" className="space-y-4">
          {hasSoul && (
            <div className="ca-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Location Soul
              </h3>

              {/* Distinctive Feature */}
              {data.soul.distinctive_feature && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded">
                  <span className="text-xs text-purple-400 uppercase block mb-1">Distinctive Feature</span>
                  <p className="text-slate-200">{data.soul.distinctive_feature}</p>
                </div>
              )}

              {/* Sensory Grid */}
              <div className="grid grid-cols-2 gap-3">
                {data.soul.sights && data.soul.sights.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Eye className="w-3 h-3" /> Sights
                    </span>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {data.soul.sights.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.soul.sounds && data.soul.sounds.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Ear className="w-3 h-3" /> Sounds
                    </span>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {data.soul.sounds.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.soul.smells && data.soul.smells.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Wind className="w-3 h-3" /> Smells
                    </span>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {data.soul.smells.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(data.soul.temperature || data.soul.lighting) && (
                  <div>
                    {data.soul.temperature && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 uppercase flex items-center gap-1">
                          <Thermometer className="w-3 h-3" /> Temperature
                        </span>
                        <p className="text-sm text-slate-300">{data.soul.temperature}</p>
                      </div>
                    )}
                    {data.soul.lighting && (
                      <div>
                        <span className="text-xs text-slate-500 uppercase flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Lighting
                        </span>
                        <p className="text-sm text-slate-300">{data.soul.lighting}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mood */}
              {data.soul.mood && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-500 uppercase">Mood</span>
                  <p className="text-slate-300 italic">{data.soul.mood}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* BRAIN TAB - Purpose & Secrets */}
        <TabsContent value="brain" className="space-y-4">
          {hasBrain && (
            <div className="ca-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Map className="w-4 h-4" />
                Location Brain
              </h3>

              {data.brain.purpose && (
                <div>
                  <span className="text-xs text-slate-500 uppercase">Purpose</span>
                  <div className="text-slate-200">
                    {renderTextWithDiscoveries(data.brain.purpose)}
                  </div>
                </div>
              )}

              {data.brain.history && (
                <div>
                  <span className="text-xs text-slate-500 uppercase">History</span>
                  <div className="text-slate-200">
                    {renderTextWithDiscoveries(data.brain.history)}
                  </div>
                </div>
              )}

              {data.brain.current_state && (
                <div className="flex gap-2">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-blue-400 uppercase">Current State</span>
                    <p className="text-slate-200">{data.brain.current_state}</p>
                  </div>
                </div>
              )}

              {data.brain.conflict && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <div className="flex gap-2">
                    <Swords className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-orange-400 uppercase">Conflict</span>
                      <div className="text-slate-200">
                        {renderTextWithDiscoveries(data.brain.conflict)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data.brain.opportunity && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="flex gap-2">
                    <Gift className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-green-400 uppercase">Opportunity</span>
                      <div className="text-slate-200">
                        {renderTextWithDiscoveries(data.brain.opportunity)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data.brain.secret && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-amber-400 uppercase">Secret (DM Only)</span>
                      <div className="text-slate-200">
                        {renderTextWithDiscoveries(data.brain.secret)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-locations - Added to Discoveries for user review */}
              {data.brain.contains && data.brain.contains.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase">Sub-Locations</span>
                    <span className="text-xs text-amber-400">Added to Discoveries ↗</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.brain.contains.map((loc, i) => {
                      // Clean the name: remove " - description" suffix if present
                      const cleanName = loc.includes(' - ') ? loc.split(' - ')[0] : loc
                      return (
                        <span
                          key={i}
                          className="px-2 py-1 bg-amber-500/10 border border-dashed border-amber-500/30 rounded text-sm text-amber-300"
                        >
                          📍 {cleanName}
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    These appear in the Review panel. Accept or ignore them there.
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* MECHANICS TAB - Game Details */}
        <TabsContent value="mechanics" className="space-y-4">
          {hasMechanics && (
            <div className="ca-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Mechanics
              </h3>

              {/* Size & Terrain */}
              <div className="grid grid-cols-2 gap-3">
                {data.mechanics.size && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Size</span>
                    <p className="text-slate-300">{data.mechanics.size}</p>
                  </div>
                )}

                {data.mechanics.terrain && data.mechanics.terrain.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Terrain</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.mechanics.terrain.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hazards */}
              {data.mechanics.hazards && data.mechanics.hazards.length > 0 && (
                <div>
                  <span className="text-xs text-red-400 uppercase flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Hazards
                  </span>
                  <div className="space-y-2">
                    {data.mechanics.hazards.map((hazard, i) => (
                      <div key={i} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-red-400">{hazard.name}</span>
                          {hazard.dc && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 rounded">
                              DC {hazard.dc}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300">{hazard.description}</p>
                        {hazard.damage && (
                          <span className="text-xs text-red-300">Damage: {hazard.damage}</span>
                        )}
                        {hazard.effect && (
                          <span className="text-xs text-red-300 block">Effect: {hazard.effect}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Encounters */}
              {data.mechanics.encounters && data.mechanics.encounters.length > 0 && (
                <div>
                  <span className="text-xs text-orange-400 uppercase flex items-center gap-1 mb-2">
                    <Swords className="w-3 h-3" /> Encounters
                  </span>
                  <div className="space-y-1">
                    {data.mechanics.encounters.map((enc, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-300">{enc.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{enc.likelihood}</Badge>
                          {enc.cr_range && (
                            <span className="text-xs text-slate-500">CR {enc.cr_range}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resting */}
              {data.mechanics.resting && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <span className="text-xs text-green-400 uppercase flex items-center gap-1 mb-1">
                    <Tent className="w-3 h-3" /> Resting
                  </span>
                  <div className="text-sm text-slate-300 grid grid-cols-2 gap-2">
                    <p>Safe Rest: {data.mechanics.resting.safe_rest ? 'Yes' : 'No'}</p>
                    <p>Long Rest: {data.mechanics.resting.long_rest_available ? 'Yes' : 'No'}</p>
                    {data.mechanics.resting.cost && (
                      <p className="col-span-2">Cost: {data.mechanics.resting.cost}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Resources */}
              {data.mechanics.resources && data.mechanics.resources.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-1">
                    <Package className="w-3 h-3" /> Resources
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {data.mechanics.resources.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasMechanics && (
            <div className="ca-card p-4 text-center text-slate-500">
              No mechanics data available
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Facts */}
      {data.facts && data.facts.length > 0 && (
        <div className="ca-card p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">
            Facts ({data.facts.length})
          </h4>
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
