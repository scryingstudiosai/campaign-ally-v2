'use client'

import React, { useState, useRef } from 'react'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { SelectionPopover } from '@/components/forge/SelectionPopover'
import { BrainCard } from '@/components/entity/BrainCard'
import { VoiceCard } from '@/components/entity/VoiceCard'
import { renderWithBold } from '@/lib/text-utils'
import type { ScanResult, Discovery } from '@/types/forge'
import type { NpcBrain, VillainBrain, HeroBrain, Voice, ForgeFactOutput } from '@/types/living-entity'
import {
  Eye,
  Heart,
  MessageSquare,
  Target,
  Lock,
  Link2,
  Shield,
  Swords,
  Backpack,
  Lightbulb,
  EyeOff,
  Mic,
  BookOpen,
} from 'lucide-react'

// Match the existing GeneratedNPC structure from the API with new Brain/Voice fields
export interface GeneratedNPC {
  name: string
  sub_type?: string

  // New Brain/Voice/Facts structure
  brain?: NpcBrain | VillainBrain | HeroBrain
  voice?: Partial<Voice>
  facts?: ForgeFactOutput[]
  read_aloud?: string
  dm_slug?: string

  // Legacy fields for backward compatibility
  dmSlug: string
  race: string
  gender: string
  appearance: string
  personality: string
  voiceAndMannerisms: string
  voiceReference?: string
  motivation: string
  secret: string
  plotHook: string
  loot: string[]
  combatStats: {
    armorClass: number
    hitPoints: string | number
    primaryWeapon: string
    combatStyle: string
  }
  connectionHooks: string[]
  tags?: string[]
}

interface NpcOutputCardProps {
  data: GeneratedNPC
  scanResult: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status']) => void
  onManualDiscovery?: (text: string, type: string) => void
  onLinkExisting?: (entityId: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string }>
}

export function NpcOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: NpcOutputCardProps): JSX.Element {
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

  return (
    <div ref={contentRef} className="ca-card ca-card--npc p-6 space-y-4">
      {/* Header - Name, DM Slug, Badges */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-primary">{data.name}</h2>
          <p className="text-muted-foreground italic mt-1">{data.dmSlug}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="ca-inset px-3 py-1 text-sm text-slate-300">{data.race}</span>
            <span className="ca-inset px-3 py-1 text-sm text-slate-300">{data.gender}</span>
          </div>
        </div>

        {/* View mode toggle */}
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

      {/* Read Aloud Section (if available) */}
      {data.read_aloud && (
        <div className="ca-panel p-4 border-l-2 border-primary/50">
          <div className="ca-section-header">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Read Aloud</span>
          </div>
          <p className="text-sm text-slate-300 italic leading-relaxed">
            {data.read_aloud}
          </p>
        </div>
      )}

      {/* Brain Section - DM Only (if available) */}
      {viewMode === 'dm' && data.brain && (
        <BrainCard brain={data.brain} viewMode={viewMode} />
      )}

      {/* Voice Section (if available) */}
      {data.voice && Object.keys(data.voice).length > 0 && (
        <VoiceCard voice={data.voice} />
      )}

      {/* PRIMARY SECTION - Appearance & Personality */}
      <div className="grid grid-cols-1 gap-3">
        <div className="ca-panel p-4">
          <div className="ca-section-header">
            <Eye className="w-4 h-4 text-primary" />
            <span>Appearance</span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderText(data.appearance)}
          </div>
        </div>

        <div className="ca-panel p-4">
          <div className="ca-section-header">
            <Heart className="w-4 h-4 text-primary" />
            <span>Personality</span>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderText(data.personality)}
          </div>
        </div>
      </div>

      {/* COMBAT STATS */}
      {data.combatStats && (
        <div className="ca-panel p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-400">
                Combat:
              </span>
            </div>
            <span className="ca-stat-pill ca-stat-pill--ac">
              AC {data.combatStats.armorClass}
            </span>
            <span className="ca-stat-pill ca-stat-pill--hp">
              HP {data.combatStats.hitPoints}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <Swords className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {data.combatStats.primaryWeapon}
              </span>
            </div>
            <span className="text-sm text-muted-foreground italic">
              {data.combatStats.combatStyle}
            </span>
          </div>
        </div>
      )}

      {/* SECONDARY SECTION - Voice & Loot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="ca-panel p-4">
          <div className="ca-section-header text-xs">
            <MessageSquare className="w-3 h-3" />
            <span>Voice & Mannerisms</span>
          </div>
          <div className="text-sm text-slate-300">
            {renderText(data.voiceAndMannerisms)}
          </div>
          {data.voiceReference && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Mic className="w-3 h-3" />
                <span className="italic">&quot;{data.voiceReference}&quot;</span>
              </p>
            </div>
          )}
        </div>

        <div className="ca-panel p-4">
          <div className="ca-section-header text-xs">
            <Backpack className="w-3 h-3" />
            <span>Loot & Pockets</span>
          </div>
          {Array.isArray(data.loot) ? (
            <ul className="text-sm text-slate-300 space-y-1">
              {data.loot.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{renderText(item)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">{data.loot}</p>
          )}
        </div>
      </div>

      {/* PLOT-RELEVANT SECTION - Motivation, Secret, Plot Hook */}
      <div className="space-y-3 pt-2">
        <div className="ca-panel p-4">
          <div className="ca-section-header">
            <Target className="w-4 h-4 text-primary" />
            <span>Motivation</span>
          </div>
          <div className="text-sm text-slate-300">
            {renderText(data.motivation)}
          </div>
        </div>

        {/* DM Only sections */}
        {viewMode === 'dm' && (
          <>
            <div className="ca-panel p-4 border-l-2 border-amber-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
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

            <div className="ca-panel p-4 border-l-2 border-cyan-500/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan-400">
                  <Lightbulb className="w-4 h-4" />
                  Plot Hook
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <EyeOff className="w-3 h-3" />
                  DM Only
                </span>
              </div>
              <div className="text-sm text-slate-300">
                {renderText(data.plotHook)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Connection Hooks */}
      <div className="ca-panel p-4">
        <div className="ca-section-header">
          <Link2 className="w-4 h-4 text-primary" />
          <span>Connection Hooks</span>
        </div>
        <ul className="space-y-1">
          {data.connectionHooks.map((hook, index) => (
            <li
              key={index}
              className="text-sm text-slate-300 flex items-start gap-2"
            >
              <span className="text-primary font-bold">{index + 1}.</span>
              <span>{renderText(hook)}</span>
            </li>
          ))}
        </ul>
      </div>

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
