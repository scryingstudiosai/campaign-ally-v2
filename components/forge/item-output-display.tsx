'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface ItemOutputDisplayProps {
  item: GeneratedItem
  isEditing?: boolean
  onUpdate?: (item: GeneratedItem) => void
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

// Parse markdown bold syntax and render as JSX
function renderWithBold(text: string): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export function ItemOutputDisplay({ item, isEditing = false, onUpdate }: ItemOutputDisplayProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'player' | 'dm'>('dm')

  const handleFieldChange = (field: keyof GeneratedItem, value: unknown) => {
    if (onUpdate) {
      onUpdate({ ...item, [field]: value })
    }
  }

  const handleMechanicsChange = (field: keyof GeneratedItem['mechanical_properties'], value: unknown) => {
    if (onUpdate) {
      onUpdate({
        ...item,
        mechanical_properties: { ...item.mechanical_properties, [field]: value }
      })
    }
  }

  const rarityColor = RARITY_COLORS[item.rarity] || 'bg-slate-500 text-white'
  const rarityLabel = RARITY_LABELS[item.rarity] || item.rarity
  const typeLabel = ITEM_TYPE_LABELS[item.item_type] || item.item_type
  const vendorPrice = Math.floor(item.value_gp * 0.5)

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Header - Editable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={item.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-value">Value (GP)</Label>
            <Input
              id="edit-value"
              type="number"
              value={item.value_gp}
              onChange={(e) => handleFieldChange('value_gp', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-public">Public Description (what players see)</Label>
          <Textarea
            id="edit-public"
            value={item.public_description}
            onChange={(e) => handleFieldChange('public_description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-secret-desc" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500">Secret Description (DM only)</span>
          </Label>
          <Textarea
            id="edit-secret-desc"
            value={item.secret_description}
            onChange={(e) => handleFieldChange('secret_description', e.target.value)}
            rows={3}
            className="border-amber-500/30"
          />
        </div>

        {/* Mechanical Properties */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Mechanical Properties
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {item.item_type === 'weapon' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Damage</Label>
                <Input
                  value={item.mechanical_properties?.damage || ''}
                  onChange={(e) => handleMechanicsChange('damage', e.target.value)}
                />
              </div>
            )}
            {item.item_type === 'armor' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">AC Bonus</Label>
                <Input
                  type="number"
                  value={item.mechanical_properties?.ac_bonus || 0}
                  onChange={(e) => handleMechanicsChange('ac_bonus', parseInt(e.target.value) || 0)}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Attunement</Label>
              <Input
                value={item.mechanical_properties?.attunement || 'none'}
                onChange={(e) => handleMechanicsChange('attunement', e.target.value)}
              />
            </div>
            {item.mechanical_properties?.charges !== undefined && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Charges</Label>
                <Input
                  value={`${item.mechanical_properties.charges}/${item.mechanical_properties.max_charges || item.mechanical_properties.charges}`}
                  onChange={(e) => {
                    const [curr, max] = e.target.value.split('/')
                    handleMechanicsChange('charges', parseInt(curr) || 0)
                    if (max) handleMechanicsChange('max_charges', parseInt(max) || 0)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-origin" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Origin History
          </Label>
          <Textarea
            id="edit-origin"
            value={item.origin_history}
            onChange={(e) => handleFieldChange('origin_history', e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-secret" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            <span className="text-red-500">Secret (curses, true name, etc.)</span>
          </Label>
          <Textarea
            id="edit-secret"
            value={item.secret}
            onChange={(e) => handleFieldChange('secret', e.target.value)}
            rows={2}
            className="border-red-500/30"
          />
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className="space-y-4">
      {/* Header - Name and badges */}
      <div className="text-center pb-4 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">{item.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <Badge className={rarityColor}>{rarityLabel}</Badge>
          <Badge variant="secondary">{typeLabel}</Badge>
          {item.magical_aura && item.magical_aura !== 'none' && (
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {item.magical_aura}
            </Badge>
          )}
          {!item.is_identified && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              Unidentified
            </Badge>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border p-1 bg-muted/30">
          <Button
            variant={viewMode === 'player' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('player')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Player View
          </Button>
          <Button
            variant={viewMode === 'dm' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('dm')}
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            DM View
          </Button>
        </div>
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {renderWithBold(item.public_description)}
              </p>
            </CardContent>
          </Card>

          {viewMode === 'dm' && item.secret_description && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">True Nature</span>
                  <Badge variant="outline" className="ml-auto text-xs text-amber-500">DM Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {renderWithBold(item.secret_description)}
                </p>
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
                    <strong>{item.value_gp} gp</strong>
                    <span className="text-muted-foreground ml-2">(Vendor: {vendorPrice} gp)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.weight}</span>
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
                {item.item_type === 'weapon' && item.mechanical_properties?.damage && (
                  <>
                    <div className="flex items-center gap-2">
                      <Sword className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">Damage:</span>
                    </div>
                    <Badge className="bg-red-600 hover:bg-red-600 text-white text-base px-3 py-1 font-bold">
                      {item.mechanical_properties.damage}
                    </Badge>
                  </>
                )}
                {item.item_type === 'armor' && item.mechanical_properties?.ac_bonus && (
                  <>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">AC:</span>
                    </div>
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-base px-3 py-1 font-bold">
                      +{item.mechanical_properties.ac_bonus}
                    </Badge>
                  </>
                )}
                {item.mechanical_properties?.charges !== undefined && (
                  <>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">Charges:</span>
                    </div>
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-base px-3 py-1 font-bold">
                      {item.mechanical_properties.charges}/{item.mechanical_properties.max_charges || item.mechanical_properties.charges}
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          {item.mechanical_properties?.properties && item.mechanical_properties.properties.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                  {item.mechanical_properties.properties.map((prop, idx) => (
                    <Badge key={idx} variant="secondary">{prop}</Badge>
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
                {item.mechanical_properties?.attunement === 'none'
                  ? 'No attunement required'
                  : item.mechanical_properties?.attunement === 'required'
                  ? 'Requires attunement'
                  : item.mechanical_properties?.attunement}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets Tab (DM only) */}
        <TabsContent value="secrets" className="space-y-4">
          {item.origin_history && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Origin & History
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">{renderWithBold(item.origin_history)}</p>
              </CardContent>
            </Card>
          )}

          {item.secret && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Secret</span>
                  <Badge variant="outline" className="ml-auto text-xs text-red-500">DM Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">{renderWithBold(item.secret)}</p>
              </CardContent>
            </Card>
          )}

          {/* History Log */}
          {item.history && item.history.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  History Log
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {item.history.map((entry, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <strong className="capitalize">{entry.event.replace(/_/g, ' ')}</strong>
                        {entry.session && <span className="text-xs ml-2">({entry.session})</span>}
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
