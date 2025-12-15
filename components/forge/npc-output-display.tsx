'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Heart,
  MessageSquare,
  Target,
  Lock,
  Link2,
  Plus,
  X,
  Shield,
  Swords,
  Backpack,
  Lightbulb,
} from 'lucide-react'

export interface GeneratedNPC {
  name: string
  dmSlug: string
  race: string
  gender: string
  appearance: string
  personality: string
  voiceAndMannerisms: string
  motivation: string
  secret: string
  plotHook: string
  loot: string
  combatStats: {
    armorClass: number
    hitPoints: string
    primaryWeapon: string
    combatStyle: string
  }
  connectionHooks: string[]
}

interface NPCOutputDisplayProps {
  npc: GeneratedNPC
  isEditing?: boolean
  onUpdate?: (npc: GeneratedNPC) => void
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

export function NPCOutputDisplay({ npc, isEditing = false, onUpdate }: NPCOutputDisplayProps): JSX.Element {
  const handleFieldChange = (field: keyof GeneratedNPC, value: string | string[] | object) => {
    if (onUpdate) {
      onUpdate({ ...npc, [field]: value })
    }
  }

  const handleStatsChange = (field: keyof GeneratedNPC['combatStats'], value: string | number) => {
    if (onUpdate) {
      onUpdate({
        ...npc,
        combatStats: { ...npc.combatStats, [field]: value }
      })
    }
  }

  const handleHookChange = (index: number, value: string) => {
    const newHooks = [...npc.connectionHooks]
    newHooks[index] = value
    handleFieldChange('connectionHooks', newHooks)
  }

  const addHook = () => {
    handleFieldChange('connectionHooks', [...npc.connectionHooks, ''])
  }

  const removeHook = (index: number) => {
    const newHooks = npc.connectionHooks.filter((_, i) => i !== index)
    handleFieldChange('connectionHooks', newHooks)
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Header - Editable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={npc.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-race">Race</Label>
            <Input
              id="edit-race"
              value={npc.race}
              onChange={(e) => handleFieldChange('race', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gender">Gender</Label>
            <Input
              id="edit-gender"
              value={npc.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-slug">DM Slug (quick reference)</Label>
          <Input
            id="edit-slug"
            value={npc.dmSlug}
            onChange={(e) => handleFieldChange('dmSlug', e.target.value)}
          />
        </div>

        {/* Primary Fields - Editable */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-appearance" className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Appearance
            </Label>
            <Textarea
              id="edit-appearance"
              value={npc.appearance}
              onChange={(e) => handleFieldChange('appearance', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-personality" className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Personality
            </Label>
            <Textarea
              id="edit-personality"
              value={npc.personality}
              onChange={(e) => handleFieldChange('personality', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Secondary Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-voice" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Voice & Mannerisms
            </Label>
            <Textarea
              id="edit-voice"
              value={npc.voiceAndMannerisms}
              onChange={(e) => handleFieldChange('voiceAndMannerisms', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-loot" className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-muted-foreground" />
              Loot & Pockets
            </Label>
            <Textarea
              id="edit-loot"
              value={npc.loot}
              onChange={(e) => handleFieldChange('loot', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Combat Stats - Editable */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Combat Stats
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">AC</Label>
              <Input
                type="number"
                value={npc.combatStats?.armorClass || 10}
                onChange={(e) => handleStatsChange('armorClass', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">HP</Label>
              <Input
                value={npc.combatStats?.hitPoints || ''}
                onChange={(e) => handleStatsChange('hitPoints', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Weapon</Label>
              <Input
                value={npc.combatStats?.primaryWeapon || ''}
                onChange={(e) => handleStatsChange('primaryWeapon', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <Input
                value={npc.combatStats?.combatStyle || ''}
                onChange={(e) => handleStatsChange('combatStyle', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Plot-Relevant Fields - Editable */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-motivation" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Motivation
            </Label>
            <Textarea
              id="edit-motivation"
              value={npc.motivation}
              onChange={(e) => handleFieldChange('motivation', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-secret" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500">Secret</span>
            </Label>
            <Textarea
              id="edit-secret"
              value={npc.secret}
              onChange={(e) => handleFieldChange('secret', e.target.value)}
              rows={2}
              className="border-amber-500/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-hook" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-500" />
              <span className="text-cyan-500">Plot Hook</span>
            </Label>
            <Textarea
              id="edit-hook"
              value={npc.plotHook}
              onChange={(e) => handleFieldChange('plotHook', e.target.value)}
              rows={2}
              className="border-cyan-500/30"
            />
          </div>
        </div>

        {/* Connection Hooks - Editable */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Connection Hooks
          </Label>
          <div className="space-y-2">
            {npc.connectionHooks.map((hook, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="text-primary font-bold mt-2">{index + 1}.</span>
                <Textarea
                  value={hook}
                  onChange={(e) => handleHookChange(index, e.target.value)}
                  rows={1}
                  className="flex-1"
                />
                {npc.connectionHooks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHook(index)}
                    className="mt-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHook}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Hook
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Display mode (non-editing) - New horizontal layout with hierarchy
  return (
    <div className="space-y-4">
      {/* Header - Name, DM Slug, Badges */}
      <div className="text-center pb-4 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">{npc.name}</h2>
        <p className="text-muted-foreground italic mt-1">{npc.dmSlug}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="secondary">{npc.race}</Badge>
          <Badge variant="outline">{npc.gender}</Badge>
        </div>
      </div>

      {/* PRIMARY SECTION - Appearance & Personality (most important for roleplay) */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {renderWithBold(npc.appearance)}
            </p>
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              {renderWithBold(npc.personality)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY SECTION - Voice, Stats, Loot (supporting info) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              Voice & Mannerisms
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">{npc.voiceAndMannerisms}</p>
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
            <p className="text-sm text-muted-foreground">{npc.loot}</p>
          </CardContent>
        </Card>
      </div>

      {/* Combat Stats - Compact horizontal */}
      {npc.combatStats && (
        <Card className="bg-muted/30">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Combat:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">AC</span>
                <span className="text-muted-foreground">{npc.combatStats.armorClass}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">HP</span>
                <span className="text-muted-foreground">{npc.combatStats.hitPoints}</span>
              </div>
              <div className="flex items-center gap-1">
                <Swords className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{npc.combatStats.primaryWeapon}</span>
              </div>
              <span className="text-xs text-muted-foreground italic">
                {npc.combatStats.combatStyle}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PLOT-RELEVANT SECTION - Motivation, Secret, Plot Hook (game drivers) */}
      <div className="space-y-3 pt-2">
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Motivation
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">{npc.motivation}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500">Secret</span>
              <Badge variant="outline" className="ml-2 text-xs">DM Only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">{npc.secret}</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-cyan-500" />
              <span className="text-cyan-500">Plot Hook</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">{npc.plotHook}</p>
          </CardContent>
        </Card>
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
            {npc.connectionHooks.map((hook, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold">{index + 1}.</span>
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
