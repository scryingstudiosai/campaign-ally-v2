'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  User,
  Eye,
  Heart,
  MessageSquare,
  Target,
  Lock,
  Link2,
  Plus,
  X,
} from 'lucide-react'

export interface GeneratedNPC {
  name: string
  race: string
  gender: string
  appearance: string
  personality: string
  voiceAndMannerisms: string
  motivation: string
  secret: string
  connectionHooks: string[]
  suggestedStats?: {
    challengeRating?: string
    hitPoints?: string
    armorClass?: string
  }
}

interface NPCOutputDisplayProps {
  npc: GeneratedNPC
  isEditing?: boolean
  onUpdate?: (npc: GeneratedNPC) => void
}

export function NPCOutputDisplay({ npc, isEditing = false, onUpdate }: NPCOutputDisplayProps): JSX.Element {
  const handleFieldChange = (field: keyof GeneratedNPC, value: string | string[]) => {
    if (onUpdate) {
      onUpdate({ ...npc, [field]: value })
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
        <div className="grid grid-cols-3 gap-4">
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

        {/* Main Fields - Editable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-appearance" className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Appearance
            </Label>
            <Textarea
              id="edit-appearance"
              value={npc.appearance}
              onChange={(e) => handleFieldChange('appearance', e.target.value)}
              rows={3}
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-voice" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Voice & Mannerisms
            </Label>
            <Textarea
              id="edit-voice"
              value={npc.voiceAndMannerisms}
              onChange={(e) => handleFieldChange('voiceAndMannerisms', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-motivation" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Motivation
            </Label>
            <Textarea
              id="edit-motivation"
              value={npc.motivation}
              onChange={(e) => handleFieldChange('motivation', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Secret - Editable */}
        <div className="space-y-2">
          <Label htmlFor="edit-secret" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500">Secret</span>
            <Badge variant="outline" className="ml-2 text-xs">DM Only</Badge>
          </Label>
          <Textarea
            id="edit-secret"
            value={npc.secret}
            onChange={(e) => handleFieldChange('secret', e.target.value)}
            rows={2}
            className="border-amber-500/30"
          />
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
                  rows={2}
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

  // Display mode (non-editing)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">{npc.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="secondary">{npc.race}</Badge>
          <Badge variant="outline">{npc.gender}</Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{npc.appearance}</p>
          </CardContent>
        </Card>

        {/* Personality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{npc.personality}</p>
          </CardContent>
        </Card>

        {/* Voice & Mannerisms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Voice & Mannerisms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{npc.voiceAndMannerisms}</p>
          </CardContent>
        </Card>

        {/* Motivation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{npc.motivation}</p>
          </CardContent>
        </Card>
      </div>

      {/* Secret - Full Width */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500">Secret</span>
            <Badge variant="outline" className="ml-2 text-xs">DM Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{npc.secret}</p>
        </CardContent>
      </Card>

      {/* Connection Hooks - Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Connection Hooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {npc.connectionHooks.map((hook, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold">{index + 1}.</span>
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Suggested Stats (if present) */}
      {npc.suggestedStats && (
        <Card className="opacity-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Suggested Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              {npc.suggestedStats.challengeRating && (
                <span>
                  <strong>CR:</strong> {npc.suggestedStats.challengeRating}
                </span>
              )}
              {npc.suggestedStats.hitPoints && (
                <span>
                  <strong>HP:</strong> {npc.suggestedStats.hitPoints}
                </span>
              )}
              {npc.suggestedStats.armorClass && (
                <span>
                  <strong>AC:</strong> {npc.suggestedStats.armorClass}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
