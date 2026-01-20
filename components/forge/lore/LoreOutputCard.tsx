'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InteractiveText } from '@/components/forge/InteractiveText'
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Scroll,
  BookOpen,
  Theater,
  Shield,
  Target,
} from 'lucide-react'
import type { ScanResult, Discovery } from '@/types/forge'
import type { GeneratedLore, LoreDrop, EventSubType } from '@/types/event'
import { EVENT_SUB_TYPES } from '@/types/event'

export interface LoreOutputCardProps {
  data: GeneratedLore
  scanResult?: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status'], linkedEntityId?: string) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string }>
}

export function LoreOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
}: LoreOutputCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState('knowledge')
  const [showDmContent, setShowDmContent] = useState(true)
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null)

  const selectedTypeInfo = EVENT_SUB_TYPES.find(t => t.value === data.sub_type)

  // Render text with interactive entity links
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

    return text
  }

  const copyLoreDrop = (drop: LoreDrop) => {
    const text = `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`
    navigator.clipboard.writeText(text)
    setCopiedDropId(drop.id)
    setTimeout(() => setCopiedDropId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="ca-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-amber-400">
              {selectedTypeInfo?.icon} {data.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                {selectedTypeInfo?.label}
              </Badge>
              {data.event_era && (
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  {data.event_era}
                </Badge>
              )}
              {data.event_ongoing && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Ongoing
                </Badge>
              )}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="lore_drops">Lore Drops</TabsTrigger>
          {showDmContent && <TabsTrigger value="dm_truth">DM Truth</TabsTrigger>}
        </TabsList>

        {/* KNOWLEDGE TAB - Public narratives */}
        <TabsContent value="knowledge" className="space-y-4">
          {/* Common Knowledge */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Common Knowledge
            </h3>
            <div className="text-slate-300 leading-relaxed">
              {renderTextWithDiscoveries(data.soul?.common_knowledge)}
            </div>
          </div>

          {/* Scholarly Account */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Scroll className="w-4 h-4" />
              Scholarly Account
            </h3>
            <div className="text-slate-300 leading-relaxed">
              {renderTextWithDiscoveries(data.soul?.scholarly_account)}
            </div>
          </div>

          {/* Folklore */}
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
              <Theater className="w-4 h-4" />
              Folklore
            </h3>
            <div className="text-slate-300 leading-relaxed italic">
              {renderTextWithDiscoveries(data.soul?.folklore)}
            </div>
          </div>

          {/* Propaganda (if exists) */}
          {data.soul?.propaganda && (
            <div className="ca-card p-4 border-l-4 border-amber-500">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Official Narrative
              </h3>
              <div className="text-slate-300 leading-relaxed">
                {renderTextWithDiscoveries(data.soul.propaganda)}
              </div>
            </div>
          )}

          {/* Duration and Regions */}
          {(data.mechanics?.duration || (data.mechanics?.affected_regions && data.mechanics.affected_regions.length > 0)) && (
            <div className="ca-card p-4">
              <div className="flex flex-wrap gap-6">
                {data.mechanics?.duration && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Duration
                    </h4>
                    <p className="text-slate-300 text-sm">{data.mechanics.duration}</p>
                  </div>
                )}
                {data.mechanics?.affected_regions && data.mechanics.affected_regions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Affected Regions</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.mechanics.affected_regions.map((region, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Evidence */}
          {data.mechanics?.current_evidence && (
            <div className="ca-card p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Current Evidence
              </h3>
              <p className="text-slate-300">{data.mechanics.current_evidence}</p>
            </div>
          )}
        </TabsContent>

        {/* LORE DROPS TAB */}
        <TabsContent value="lore_drops" className="space-y-4">
          <div className="ca-card p-4">
            <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Lore Drops
              <span className="text-xs font-normal text-slate-500">
                (Use these in play)
              </span>
            </h3>

            <div className="space-y-3">
              {data.mechanics?.lore_drops?.map((drop) => (
                <div
                  key={drop.id}
                  className={`p-4 rounded-lg border ${
                    drop.reveal_level === 'dm_truth'
                      ? 'bg-red-500/5 border-red-500/30'
                      : drop.reveal_level === 'partial'
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-slate-400">
                        <span className="text-base mr-1">📍</span> {drop.trigger}
                      </span>
                      <span className="mx-2 text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {drop.delivery}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {drop.reveal_level === 'dm_truth' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">
                          DM Truth
                        </span>
                      )}
                      {drop.reveal_level === 'partial' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                          Partial
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLoreDrop(drop)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedDropId === drop.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">&ldquo;{drop.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* DM TRUTH TAB */}
        {showDmContent && (
          <TabsContent value="dm_truth" className="space-y-4">
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
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">True History</h4>
                  <div className="text-slate-300">
                    {renderTextWithDiscoveries(data.brain?.true_history)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Hidden Causes</h4>
                  <div className="text-slate-300">
                    {renderTextWithDiscoveries(data.brain?.hidden_causes)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Consequences</h4>
                  <div className="text-slate-300">
                    {renderTextWithDiscoveries(data.brain?.consequences)}
                  </div>
                </div>

                {data.brain?.secrets && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Deep Secrets</h4>
                    <div className="text-slate-300">
                      {renderTextWithDiscoveries(data.brain.secrets)}
                    </div>
                  </div>
                )}

                {data.brain?.reveal_triggers && data.brain.reveal_triggers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Reveal Triggers</h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {data.brain.reveal_triggers.map((trigger, i) => (
                        <li key={i}>{trigger}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.brain?.hooks && data.brain.hooks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Quest Hooks</h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {data.brain.hooks.map((hook, i) => (
                        <li key={i}>{hook}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
