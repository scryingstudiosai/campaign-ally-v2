'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

export interface GeneratedItem {
  name: string
  item_type: string
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
}

interface ItemOutputCardProps {
  data: GeneratedItem
  scanResult: ScanResult | null
  campaignId: string
  onDiscoveryAction?: (
    discoveryId: string,
    action: Discovery['status']
  ) => void
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
}: ItemOutputCardProps): JSX.Element {
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

  const rarityColor = RARITY_COLORS[data.rarity] || 'bg-slate-500 text-white'
  const rarityLabel = RARITY_LABELS[data.rarity] || data.rarity
  const typeLabel = ITEM_TYPE_LABELS[data.item_type] || data.item_type
  const vendorPrice = Math.floor(data.value_gp * 0.5)

  return (
    <div className="space-y-4">
      {/* Header - Name and badges */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-primary">{data.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <Badge className={rarityColor}>{rarityLabel}</Badge>
            <Badge variant="secondary">{typeLabel}</Badge>
            {data.magical_aura && data.magical_aura !== 'none' && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {data.magical_aura}
              </Badge>
            )}
            {!data.is_identified && (
              <Badge
                variant="outline"
                className="text-amber-500 border-amber-500"
              >
                Unidentified
              </Badge>
            )}
          </div>
        </div>

        {/* View Toggle */}
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
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                {viewMode === 'player' ? 'Description' : 'Public Description'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {renderText(data.public_description)}
              </div>
            </CardContent>
          </Card>

          {viewMode === 'dm' && data.secret_description && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">True Nature</span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs text-amber-500"
                  >
                    DM Only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderText(data.secret_description)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Value & Weight */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">
                    <strong>{data.value_gp} gp</strong>
                    <span className="text-muted-foreground ml-2">
                      (Vendor: {vendorPrice} gp)
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {data.weight}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mechanics Tab */}
        <TabsContent value="mechanics" className="space-y-4">
          {/* Combat/Effect Stats */}
          <Card className="border-slate-500/30 bg-slate-500/5">
            <CardContent className="py-4">
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
                      <Badge className="bg-red-600 hover:bg-red-600 text-white text-base px-3 py-1 font-bold">
                        {data.mechanical_properties.damage}
                      </Badge>
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
                      <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-base px-3 py-1 font-bold">
                        +{data.mechanical_properties.ac_bonus}
                      </Badge>
                    </>
                  )}
                {data.mechanical_properties?.charges !== undefined && (
                  <>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Charges:
                      </span>
                    </div>
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-base px-3 py-1 font-bold">
                      {data.mechanical_properties.charges}/
                      {data.mechanical_properties.max_charges ||
                        data.mechanical_properties.charges}
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          {data.mechanical_properties?.properties &&
            data.mechanical_properties.properties.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm">Properties</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex flex-wrap gap-2">
                    {data.mechanical_properties.properties.map((prop, idx) => (
                      <Badge key={idx} variant="secondary">
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Attunement */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Attunement
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-muted-foreground">
                {data.mechanical_properties?.attunement === 'none'
                  ? 'No attunement required'
                  : data.mechanical_properties?.attunement === 'required'
                    ? 'Requires attunement'
                    : data.mechanical_properties?.attunement}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets Tab (DM only) */}
        <TabsContent value="secrets" className="space-y-4">
          {data.origin_history && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Origin & History
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground">
                  {renderText(data.origin_history)}
                </div>
              </CardContent>
            </Card>
          )}

          {data.secret && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Secret</span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs text-red-500"
                  >
                    DM Only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm text-muted-foreground">
                  {renderText(data.secret)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Log */}
          {data.history && data.history.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  History Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {data.history.map((entry, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      <span>
                        <strong className="capitalize">
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
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
