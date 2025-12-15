'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Eye,
  Heart,
  MessageSquare,
  Target,
  Lock,
  Link2,
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
}

export function NPCOutputDisplay({ npc }: NPCOutputDisplayProps): JSX.Element {
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
