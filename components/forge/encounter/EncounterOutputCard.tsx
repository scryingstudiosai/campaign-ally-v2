'use client'

import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { SelectionPopover } from '@/components/forge/SelectionPopover'
import { renderWithBold } from '@/lib/text-utils'
import {
  Swords,
  Target,
  Eye,
  Gift,
  Shield,
  Skull,
  AlertTriangle,
  Lock,
  Users,
  MapPin,
  Clock,
  Zap,
  ChevronRight,
  Coins,
  Package,
  Scroll,
} from 'lucide-react'
import type { ScanResult, Discovery } from '@/types/forge'
import type {
  EncounterBrain,
  EncounterSoul,
  EncounterMechanics,
  EncounterRewards,
  EncounterCreature,
  EncounterPhase,
  EncounterRewardItem,
} from '@/types/living-entity'

interface EncounterFact {
  content: string
  category: string
  visibility: 'public' | 'dm_only'
}

export interface GeneratedEncounter {
  name: string
  sub_type: string
  brain: EncounterBrain
  soul: EncounterSoul
  mechanics: EncounterMechanics
  rewards: EncounterRewards
  facts: EncounterFact[]
  read_aloud: string
  dm_slug: string
}

interface EncounterOutputCardProps {
  data: GeneratedEncounter
  scanResult?: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status'], linkedEntityId?: string) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string; sub_type?: string }>
}

const DIFFICULTY_COLORS: Record<string, string> = {
  trivial: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  deadly: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ENCOUNTER_TYPE_LABELS: Record<string, string> = {
  combat: 'Combat',
  boss: 'Boss',
  ambush: 'Ambush',
  defense: 'Defense',
  chase: 'Chase',
  stealth: 'Stealth',
  puzzle: 'Puzzle',
  social: 'Social',
  exploration: 'Exploration',
  trap: 'Trap',
  complex_trap: 'Complex Trap',
  skill_challenge: 'Skill Challenge',
}

const ROLE_COLORS: Record<string, string> = {
  minion: 'text-slate-400',
  brute: 'text-orange-400',
  controller: 'text-purple-400',
  leader: 'text-yellow-400',
  artillery: 'text-cyan-400',
  skirmisher: 'text-green-400',
  boss: 'text-red-400',
}

export function EncounterOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: EncounterOutputCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState('soul')
  const contentRef = useRef<HTMLDivElement>(null)

  const { brain, soul, mechanics, rewards } = data

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
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {ENCOUNTER_TYPE_LABELS[data.sub_type] || data.sub_type}
              </Badge>
              {mechanics?.difficulty && (
                <Badge className={DIFFICULTY_COLORS[mechanics.difficulty]}>
                  {mechanics.difficulty}
                </Badge>
              )}
            </div>
          </div>
          {mechanics?.duration && (
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              {mechanics.duration}
            </div>
          )}
        </div>

        {/* DM Slug */}
        {data.dm_slug && (
          <div className="text-sm text-slate-400 border-l-2 border-red-500 pl-3 mb-3">
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
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/50">
          <TabsTrigger value="soul" className="text-xs">
            <Eye className="w-3 h-3 mr-1" />
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
          <TabsTrigger value="rewards" className="text-xs">
            <Gift className="w-3 h-3 mr-1" />
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* Soul Tab */}
        <TabsContent value="soul" className="space-y-3 mt-3">
          {soul && Object.keys(soul).length > 0 ? (
            <div className="ca-card p-4 space-y-4">
              {/* Read Aloud */}
              {soul.read_aloud && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Scroll className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400 uppercase">Read Aloud</span>
                  </div>
                  <p className="text-sm text-slate-300 italic">
                    {renderTextWithDiscoveries(soul.read_aloud)}
                  </p>
                </div>
              )}

              {/* Tension */}
              {soul.tension && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Tension</span>
                  <p className="text-sm text-slate-300 mt-1">{soul.tension}</p>
                </div>
              )}

              {/* Sights & Sounds */}
              <div className="grid grid-cols-2 gap-3">
                {soul.sights && soul.sights.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-slate-400 uppercase">Sights</span>
                    </div>
                    <ul className="space-y-1">
                      {soul.sights.map((sight, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400">-</span>
                          {sight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {soul.sounds && soul.sounds.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Sounds</span>
                    <ul className="space-y-1 mt-1">
                      {soul.sounds.map((sound, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-purple-400">-</span>
                          {sound}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Environmental Features */}
              {soul.environmental_features && soul.environmental_features.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Interactive Features</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {soul.environmental_features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded text-sm text-teal-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
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
                  <p className="text-sm text-slate-300">{renderTextWithDiscoveries(brain.purpose)}</p>
                </div>
              )}

              {/* Objective */}
              {brain.objective && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-blue-400 uppercase">Win Condition</span>
                  <p className="text-sm text-slate-300 mt-1">{renderTextWithDiscoveries(brain.objective)}</p>
                </div>
              )}

              {/* Trigger */}
              {brain.trigger && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Trigger</span>
                  <p className="text-sm text-slate-300 mt-1">{brain.trigger}</p>
                </div>
              )}

              {/* Tactics */}
              {brain.tactics && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-orange-400 uppercase">Tactics</span>
                  </div>
                  <p className="text-sm text-slate-300">{renderTextWithDiscoveries(brain.tactics)}</p>
                </div>
              )}

              {/* Scaling */}
              {brain.scaling && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Scaling Tips</span>
                  <p className="text-sm text-slate-300 mt-1">{brain.scaling}</p>
                </div>
              )}

              {/* Failure Consequence */}
              {brain.failure_consequence && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-medium text-red-400 uppercase">On Failure</span>
                  </div>
                  <p className="text-sm text-slate-300">{brain.failure_consequence}</p>
                </div>
              )}

              {/* Resolution */}
              {brain.resolution && (
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase">Possible Outcomes</span>
                  <p className="text-sm text-slate-300 mt-1">{renderTextWithDiscoveries(brain.resolution)}</p>
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
              <div className="grid grid-cols-3 gap-2">
                {mechanics.difficulty && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Difficulty</span>
                    <Badge className={DIFFICULTY_COLORS[mechanics.difficulty]}>
                      {mechanics.difficulty}
                    </Badge>
                  </div>
                )}
                {mechanics.party_size && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Party Size</span>
                    <span className="text-sm font-medium text-slate-300">{mechanics.party_size} players</span>
                  </div>
                )}
                {mechanics.party_level && (
                  <div className="text-center p-2 rounded bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Party Level</span>
                    <span className="text-sm font-medium text-slate-300">Level {mechanics.party_level}</span>
                  </div>
                )}
              </div>

              {/* Creatures */}
              {mechanics.creatures && mechanics.creatures.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1.5">
                      <Skull className="w-3 h-3" /> Creatures
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Added to Discoveries
                    </span>
                  </div>
                  <div className="space-y-2">
                    {mechanics.creatures.map((creature: EncounterCreature, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-amber-500/10 border border-dashed border-amber-500/30 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Skull className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium text-amber-300">{creature.name}</span>
                          {creature.role && (
                            <span className={`text-xs ${ROLE_COLORS[creature.role] || 'text-slate-400'}`}>
                              ({creature.role})
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">x{creature.count}</span>
                      </div>
                    ))}
                  </div>
                  {mechanics.creatures.some((c: EncounterCreature) => c.notes) && (
                    <div className="mt-2 text-xs text-slate-500">
                      {mechanics.creatures
                        .filter((c: EncounterCreature) => c.notes)
                        .map((c: EncounterCreature, i: number) => (
                          <div key={i}>
                            <strong>{c.name}:</strong> {c.notes}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Terrain & Hazards */}
              <div className="grid grid-cols-2 gap-3">
                {mechanics.terrain && mechanics.terrain.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Terrain</span>
                    <ul className="space-y-1 mt-1">
                      {mechanics.terrain.map((t, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-teal-400">-</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mechanics.hazards && mechanics.hazards.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-orange-400 uppercase">Hazards</span>
                    <ul className="space-y-1 mt-1">
                      {mechanics.hazards.map((h, i) => (
                        <li key={i} className="text-sm text-orange-300 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Phases */}
              {mechanics.phases && mechanics.phases.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase">Combat Phases</span>
                  </div>
                  <div className="space-y-2">
                    {mechanics.phases.map((phase: EncounterPhase, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                        <ChevronRight className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-yellow-400">{phase.trigger}</span>
                          <p className="text-sm text-slate-300">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ca-card p-4 text-center text-slate-500 text-sm">
              No mechanics data available
            </div>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-3 mt-3">
          {rewards && Object.keys(rewards).length > 0 ? (
            <div className="ca-card p-4 space-y-4">
              {/* XP & Gold */}
              <div className="grid grid-cols-2 gap-3">
                {rewards.xp !== undefined && (
                  <div className="text-center p-3 rounded bg-purple-500/10 border border-purple-500/30">
                    <span className="text-xs text-purple-400 uppercase block mb-1">Experience</span>
                    <span className="text-xl font-bold text-purple-300">{rewards.xp} XP</span>
                  </div>
                )}
                {rewards.gold !== undefined && (
                  <div className="text-center p-3 rounded bg-amber-500/10 border border-amber-500/30">
                    <span className="text-xs text-amber-400 uppercase block mb-1">Treasure</span>
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span className="text-xl font-bold text-amber-300">{rewards.gold} gp</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              {rewards.items && rewards.items.length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase flex items-center gap-1.5">
                      <Package className="w-3 h-3" /> Loot
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Added to Discoveries
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rewards.items.map((item: EncounterRewardItem, i: number) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-dashed border-amber-500/30 rounded text-sm text-amber-300"
                      >
                        <Package className="w-3 h-3" />
                        {item.name}
                        {item.type && (
                          <span className="text-xs text-slate-500">({item.type})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Rewards */}
              {rewards.story && (
                <div className="pt-3 border-t border-slate-700">
                  <span className="text-xs font-medium text-slate-400 uppercase">Story Reward</span>
                  <p className="text-sm text-slate-300 mt-1">{rewards.story}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="ca-card p-4 text-center text-slate-500 text-sm">
              No rewards data available
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
