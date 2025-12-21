'use client'

import React, { useState, useRef } from 'react'
import { SelectionPopover } from '@/components/forge/SelectionPopover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { renderWithBold } from '@/lib/text-utils'
import type { ScanResult, Discovery } from '@/types/forge'
import {
  Eye,
  EyeOff,
  Lock,
  Coins,
  Scale,
  Sparkles,
  Sword,
  Shield,
  Zap,
  ScrollText,
  History,
  Key,
  AlertTriangle,
  Volume2,
} from 'lucide-react'

export interface GeneratedItem {
  name: string
  item_type?: string
  category?: string  // Alias for item_type in new architecture
  rarity: string
  magical_aura: string
  is_identified: boolean
  public_description: string
  secret_description: string
  mechanical_properties: {
    damage?: string
    ac_bonus?: number
    properties?: string[]
    attunement: string
    charges?: number
    max_charges?: number
  }
  origin_history: string
  value_gp: number
  weight: string
  secret: string
  history: Array<{
    event: string
    entity_id: string | null
    session: string | null
    note?: string
  }>
  // New Brain/Voice architecture fields
  sub_type?: 'standard' | 'artifact' | 'cursed'
  brain?: {
    origin?: string
    history?: string
    secret?: string
    trigger?: string
    hunger?: string
    cost?: string
    sentience_level?: 'none' | 'dormant' | 'awakened' | 'dominant'
  }
  voice?: {
    personality?: string
    style?: string[]
    desires?: string
    communication?: 'telepathic' | 'verbal' | 'empathic' | 'visions'
  } | null
  read_aloud?: string
  dm_slug?: string
  dmSlug?: string  // Alias for backward compatibility
}

interface ItemOutputCardProps {
  data: GeneratedItem
  scanResult: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (
    discoveryId: string,
    action: Discovery['status']
  ) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string }>
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-500 text-white',
  uncommon: 'bg-green-600 text-white',
  rare: 'bg-blue-600 text-white',
  very_rare: 'bg-purple-600 text-white',
  legendary: 'bg-amber-500 text-black',
  artifact: 'bg-red-600 text-white',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very Rare',
  legendary: 'Legendary',
  artifact: 'Artifact',
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  ring: 'Ring',
  potion: 'Potion',
  scroll: 'Scroll',
  wondrous_item: 'Wondrous Item',
  mundane: 'Mundane',
  artifact: 'Artifact',
  treasure: 'Treasure',
  tool: 'Tool',
  material: 'Material',
}

export function ItemOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: ItemOutputCardProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'player' | 'dm'>('dm')
  const contentRef = useRef<HTMLDivElement>(null)

  // Render text with interactive links if scan result available, otherwise bold
  const renderText = (text: string | undefined): React.ReactNode => {
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

  const rarityColor = RARITY_COLORS[data.rarity] || 'bg-slate-500 text-white'
  const rarityLabel = RARITY_LABELS[data.rarity] || data.rarity
  const itemType = data.item_type || data.category || 'item'
  const typeLabel = ITEM_TYPE_LABELS[itemType] || itemType
  const vendorPrice = Math.floor(data.value_gp * 0.5)

  // Brain/Voice helpers
  const hasBrain = data.brain && Object.keys(data.brain).length > 0
  const hasVoice = data.voice && Object.keys(data.voice).length > 0
  const isSentient = data.brain?.sentience_level && data.brain.sentience_level !== 'none'

  return (
    <div ref={contentRef} className="ca-card ca-card--item p-6 space-y-4">
      {/* Header - Name and badges */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-primary">{data.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <span className="ca-inset px-3 py-1 text-sm text-slate-300">{rarityLabel}</span>
            <span className="ca-inset px-3 py-1 text-sm text-slate-300">{typeLabel}</span>
            {data.magical_aura && data.magical_aura !== 'none' && (
              <span className="ca-inset px-3 py-1 text-sm text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {data.magical_aura}
              </span>
            )}
            {!data.is_identified && (
              <span className="ca-inset px-3 py-1 text-sm text-amber-400">
                Unidentified
              </span>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'dm' ? 'player' : 'dm')}
          className="ca-btn ca-btn-ghost flex items-center gap-2 px-3 py-1.5"
        >
          {viewMode === 'dm' ? (
            <>
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-sm">DM View</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Player View</span>
            </>
          )}
        </button>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          <TabsTrigger value="secrets" disabled={viewMode === 'player'}>
            Secrets
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <div className="ca-panel p-4">
            <div className="ca-section-header">
              <Eye className="w-4 h-4 text-primary" />
              <span>{viewMode === 'player' ? 'Description' : 'Public Description'}</span>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed">
              {renderText(data.public_description)}
            </div>
          </div>

          {viewMode === 'dm' && data.secret_description && (
            <div className="ca-panel p-4 border-l-2 border-amber-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                  <EyeOff className="w-4 h-4" />
                  True Nature
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <EyeOff className="w-3 h-3" />
                  DM Only
                </span>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {renderText(data.secret_description)}
              </div>
            </div>
          )}

          {/* Value & Weight */}
          <div className="ca-panel p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm">
                  <strong className="text-slate-200">{data.value_gp} gp</strong>
                  <span className="text-slate-400 ml-2">
                    (Vendor: {vendorPrice} gp)
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  {data.weight}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Mechanics Tab */}
        <TabsContent value="mechanics" className="space-y-4">
          {/* Combat/Effect Stats */}
          <div className="ca-panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              {data.item_type === 'weapon' &&
                data.mechanical_properties?.damage && (
                  <>
                    <div className="flex items-center gap-2">
                      <Sword className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Damage:
                      </span>
                    </div>
                    <span className="ca-stat-pill ca-stat-pill--hp">
                      {data.mechanical_properties.damage}
                    </span>
                  </>
                )}
              {data.item_type === 'armor' &&
                data.mechanical_properties?.ac_bonus && (
                  <>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        AC:
                      </span>
                    </div>
                    <span className="ca-stat-pill ca-stat-pill--ac">
                      +{data.mechanical_properties.ac_bonus}
                    </span>
                  </>
                )}
              {data.mechanical_properties?.charges !== undefined &&
                data.mechanical_properties.charges > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Charges:
                      </span>
                    </div>
                    <span className="ca-stat-pill ca-stat-pill--dc">
                      {data.mechanical_properties.charges}/
                      {data.mechanical_properties.max_charges ||
                        data.mechanical_properties.charges}
                    </span>
                  </>
                )}
            </div>
          </div>

          {/* Properties */}
          {data.mechanical_properties?.properties &&
            data.mechanical_properties.properties.length > 0 && (
              <div className="ca-panel p-4">
                <div className="ca-section-header mb-2">
                  <span>Properties</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.mechanical_properties.properties.map((prop, idx) => (
                    <span key={idx} className="ca-inset">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Attunement */}
          <div className="ca-panel p-4">
            <div className="ca-section-header">
              <ScrollText className="w-4 h-4" />
              <span>Attunement</span>
            </div>
            <p className="text-sm text-slate-400">
              {data.mechanical_properties?.attunement === 'none'
                ? 'No attunement required'
                : data.mechanical_properties?.attunement === 'required'
                  ? 'Requires attunement'
                  : data.mechanical_properties?.attunement}
            </p>
          </div>
        </TabsContent>

        {/* Secrets Tab (DM only) */}
        <TabsContent value="secrets" className="space-y-4">
          {/* === ITEM SOUL (The Brain) === */}
          {hasBrain && (
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 font-medium border-b border-emerald-500/20 pb-2">
                <Sparkles className="w-4 h-4" />
                <span>Item Soul</span>
                {data.sub_type && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 uppercase tracking-wider">
                    {data.sub_type}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Origin */}
                {data.brain?.origin && (
                  <div className="flex gap-2">
                    <History className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-slate-500 uppercase text-[10px] block">Origin</span>
                      <div className="text-slate-300">
                        {renderText(data.brain.origin)}
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                {data.brain?.history && (
                  <div className="flex gap-2">
                    <History className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-slate-500 uppercase text-[10px] block">History</span>
                      <div className="text-slate-300">
                        {renderText(data.brain.history)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Trigger */}
                {data.brain?.trigger && (
                  <div className="flex gap-2">
                    <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-amber-500 uppercase text-[10px] block">Trigger Condition</span>
                      <span className="text-slate-300">{data.brain.trigger}</span>
                    </div>
                  </div>
                )}

                {/* Secret */}
                {data.brain?.secret && (
                  <div className="flex gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                    <Key className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-amber-500 uppercase text-[10px] block">Hidden Property (DM Only)</span>
                      <div className="text-slate-300">
                        {renderText(data.brain.secret)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost/Drawback */}
                {data.brain?.cost && (
                  <div className="flex gap-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-red-500 uppercase text-[10px] block">Cost / Drawback</span>
                      <span className="text-slate-300">{data.brain.cost}</span>
                    </div>
                  </div>
                )}

                {/* Sentience Hunger */}
                {data.brain?.hunger && (
                  <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                    <Volume2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-purple-400 uppercase text-[10px] block">Sentience Hunger</span>
                      <span className="text-slate-300">{data.brain.hunger}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === ITEM VOICE (Sentient Only) === */}
          {hasVoice && isSentient && (
            <div className="space-y-3 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-400 font-medium">
                <Volume2 className="w-4 h-4" />
                <span>Sentient Personality</span>
                {data.brain?.sentience_level && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-purple-500/20 rounded text-purple-300 capitalize">
                    {data.brain.sentience_level}
                  </span>
                )}
              </div>

              {data.voice?.personality && (
                <p className="text-sm text-slate-300 italic">&quot;{data.voice.personality}&quot;</p>
              )}

              {data.voice?.style && data.voice.style.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.voice.style.map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                {data.voice?.communication && (
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block mb-1">Communication</span>
                    <span className="text-slate-300 capitalize">{data.voice.communication}</span>
                  </div>
                )}
                {data.voice?.desires && (
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block mb-1">Desires</span>
                    <span className="text-slate-300">{data.voice.desires}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.origin_history && (
            <div className="ca-panel p-4">
              <div className="ca-section-header">
                <History className="w-4 h-4 text-primary" />
                <span>Origin & History</span>
              </div>
              <div className="text-sm text-slate-300">
                {renderText(data.origin_history)}
              </div>
            </div>
          )}

          {data.secret && (
            <div className="ca-panel p-4 border-l-2 border-red-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                  <Lock className="w-4 h-4" />
                  Secret
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <EyeOff className="w-3 h-3" />
                  DM Only
                </span>
              </div>
              <div className="text-sm text-slate-300">
                {renderText(data.secret)}
              </div>
            </div>
          )}

          {/* History Log */}
          {data.history && data.history.length > 0 && (
            <div className="ca-panel p-4">
              <div className="ca-section-header">
                <ScrollText className="w-4 h-4" />
                <span>History Log</span>
              </div>
              <ul className="space-y-2">
                {data.history.map((entry, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-slate-400 flex items-start gap-2"
                  >
                    <span className="text-primary">•</span>
                    <span>
                      <strong className="capitalize text-slate-300">
                        {entry.event.replace(/_/g, ' ')}
                      </strong>
                      {entry.session && (
                        <span className="text-xs ml-2">({entry.session})</span>
                      )}
                      {entry.note && <span className="ml-1">- {entry.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
