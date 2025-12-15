import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Palette, Globe, BookOpen } from 'lucide-react'

interface Codex {
  id: string
  campaign_id: string
  world_name: string | null
  tone: string[]
  magic_level: string | null
  tech_level: string | null
  themes: string[]
  narrative_voice: string | null
  content_warnings: string[]
  languages: string[]
  geography_notes: string | null
  calendar_system: string | null
  current_date: string | null
}

interface CodexDisplayProps {
  codex: Codex
}

const MAGIC_LEVEL_LABELS: Record<string, string> = {
  none: 'No Magic',
  low: 'Low Magic',
  medium: 'Medium Magic',
  high: 'High Magic',
  wild: 'Wild Magic',
}

const TECH_LEVEL_LABELS: Record<string, string> = {
  prehistoric: 'Prehistoric',
  medieval: 'Medieval',
  renaissance: 'Renaissance',
  industrial: 'Industrial',
  modern: 'Modern',
  futuristic: 'Futuristic',
  steampunk: 'Steampunk',
  magitech: 'Magitech',
}

const NARRATIVE_VOICE_LABELS: Record<string, string> = {
  dramatic: 'Dramatic',
  casual: 'Casual',
  poetic: 'Poetic',
  gritty: 'Gritty',
  humorous: 'Humorous',
}

const TONE_LABELS: Record<string, string> = {
  heroic: 'Heroic',
  gritty: 'Gritty',
  dark: 'Dark',
  comedic: 'Comedic',
  mysterious: 'Mysterious',
  whimsical: 'Whimsical',
}

const THEME_LABELS: Record<string, string> = {
  redemption: 'Redemption',
  corruption: 'Corruption',
  war: 'War',
  exploration: 'Exploration',
  mystery: 'Mystery',
  survival: 'Survival',
  political_intrigue: 'Political Intrigue',
  good_vs_evil: 'Good vs Evil',
}

export function CodexDisplay({ codex }: CodexDisplayProps): JSX.Element {
  const magicLabel = codex.magic_level ? MAGIC_LEVEL_LABELS[codex.magic_level] || codex.magic_level : null
  const techLabel = codex.tech_level ? TECH_LEVEL_LABELS[codex.tech_level] || codex.tech_level : null
  const narrativeLabel = codex.narrative_voice ? NARRATIVE_VOICE_LABELS[codex.narrative_voice] || codex.narrative_voice : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* World Foundation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            World Foundation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {codex.world_name && (
            <div>
              <p className="text-sm text-muted-foreground">World Name</p>
              <p className="font-medium">{codex.world_name}</p>
            </div>
          )}

          {codex.tone && codex.tone.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tone</p>
              <div className="flex flex-wrap gap-1">
                {codex.tone.map((t) => (
                  <Badge key={t} variant="secondary">
                    {TONE_LABELS[t] || t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {magicLabel && (
              <div>
                <p className="text-sm text-muted-foreground">Magic Level</p>
                <p className="font-medium">{magicLabel}</p>
              </div>
            )}
            {techLabel && (
              <div>
                <p className="text-sm text-muted-foreground">Tech Level</p>
                <p className="font-medium">{techLabel}</p>
              </div>
            )}
          </div>

          {codex.themes && codex.themes.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Themes</p>
              <div className="flex flex-wrap gap-1">
                {codex.themes.map((theme) => (
                  <Badge key={theme} variant="outline">
                    {THEME_LABELS[theme] || theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            Style Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {narrativeLabel && (
            <div>
              <p className="text-sm text-muted-foreground">Narrative Voice</p>
              <p className="font-medium">{narrativeLabel}</p>
            </div>
          )}

          {codex.content_warnings && codex.content_warnings.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Content Warnings</p>
              <div className="flex flex-wrap gap-1">
                {codex.content_warnings.map((warning) => (
                  <Badge key={warning} variant="destructive">
                    {warning}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(!narrativeLabel && (!codex.content_warnings || codex.content_warnings.length === 0)) && (
            <p className="text-sm text-muted-foreground italic">No style settings configured</p>
          )}
        </CardContent>
      </Card>

      {/* World Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            World Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {codex.languages && codex.languages.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Languages</p>
              <div className="flex flex-wrap gap-1">
                {codex.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {codex.calendar_system && (
            <div>
              <p className="text-sm text-muted-foreground">Calendar System</p>
              <p className="font-medium">{codex.calendar_system}</p>
            </div>
          )}

          {codex.current_date && (
            <div>
              <p className="text-sm text-muted-foreground">Current Game Date</p>
              <p className="font-medium">{codex.current_date}</p>
            </div>
          )}

          {(!codex.languages?.length && !codex.calendar_system && !codex.current_date) && (
            <p className="text-sm text-muted-foreground italic">No world details configured</p>
          )}
        </CardContent>
      </Card>

      {/* Geography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Geography
          </CardTitle>
        </CardHeader>
        <CardContent>
          {codex.geography_notes ? (
            <p className="text-sm whitespace-pre-wrap">{codex.geography_notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No geography notes</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
