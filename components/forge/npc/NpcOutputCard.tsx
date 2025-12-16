'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InteractiveText } from '@/components/forge/InteractiveText'
import { renderWithBold } from '@/lib/text-utils'
import type { ScanResult, Discovery } from '@/types/forge'
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
} from 'lucide-react'

// Match the existing GeneratedNPC structure from the API
export interface GeneratedNPC {
  name: string
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
    hitPoints: string
    primaryWeapon: string
    combatStyle: string
  }
  connectionHooks: string[]
}

interface NpcOutputCardProps {
  data: GeneratedNPC
  scanResult: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status']) => void
}

export function NpcOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
}: NpcOutputCardProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'player' | 'dm'>('dm')

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
    <div className="space-y-4">
      {/* Header - Name, DM Slug, Badges */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-primary">{data.name}</h2>
          <p className="text-muted-foreground italic mt-1">{data.dmSlug}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary">{data.race}</Badge>
            <Badge variant="outline">{data.gender}</Badge>
          </div>
        </div>

        {/* View mode toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'dm' ? 'player' : 'dm')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
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

      {/* PRIMARY SECTION - Appearance & Personality */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground leading-relaxed">
              {renderText(data.appearance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground leading-relaxed">
              {renderText(data.personality)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COMBAT STATS */}
      {data.combatStats && (
        <Card className="border-slate-500/30 bg-slate-500/5">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-400">
                  Combat:
                </span>
              </div>
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-base px-3 py-1 font-bold">
                AC {data.combatStats.armorClass}
              </Badge>
              <Badge className="bg-red-600 hover:bg-red-600 text-white text-base px-3 py-1 font-bold">
                HP {data.combatStats.hitPoints}
              </Badge>
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
          </CardContent>
        </Card>
      )}

      {/* SECONDARY SECTION - Voice & Loot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              Voice & Mannerisms
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground">
              {renderText(data.voiceAndMannerisms)}
            </div>
            {data.voiceReference && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  <span className="italic">&quot;{data.voiceReference}&quot;</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
              <Backpack className="w-3 h-3" />
              Loot & Pockets
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {Array.isArray(data.loot) ? (
              <ul className="text-sm text-muted-foreground space-y-1">
                {data.loot.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{renderText(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{data.loot}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PLOT-RELEVANT SECTION - Motivation, Secret, Plot Hook */}
      <div className="space-y-3 pt-2">
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Motivation
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground">
              {renderText(data.motivation)}
            </div>
          </CardContent>
        </Card>

        {/* DM Only sections */}
        {viewMode === 'dm' && (
          <>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">Secret</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <EyeOff className="w-3 h-3" />
                    DM Only
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground">
                  {renderText(data.secret)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-500/30 bg-cyan-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-500" />
                  <span className="text-cyan-500">Plot Hook</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <EyeOff className="w-3 h-3" />
                    DM Only
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground">
                  {renderText(data.plotHook)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Connection Hooks */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Connection Hooks
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <ul className="space-y-1">
            {data.connectionHooks.map((hook, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary font-bold">{index + 1}.</span>
                <span>{renderText(hook)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
