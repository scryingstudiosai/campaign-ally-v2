import { Badge } from '@/components/ui/badge'
import { MaterialCard } from '@/components/ui/material-card'
import { Sparkles, Palette, Globe, BookOpen, HelpCircle, Check, Users, Gamepad2 } from 'lucide-react'

interface PlayerSettings {
  character_editing?: {
    backstory?: boolean
    personality?: boolean
    notes?: boolean
    appearance?: boolean
  }
  inventory?: {
    can_add_items?: boolean
    requires_approval?: boolean
    can_see_party_stash?: boolean
  }
  visibility?: {
    can_see_quests?: boolean
    can_see_world_map?: boolean
    can_see_party_members?: boolean
    can_see_revealed_lore?: boolean
  }
  communication?: {
    can_message_dm?: boolean
    can_message_party?: boolean
  }
}

interface Codex {
  id: string
  campaign_id: string
  world_name: string | null
  premise: string | null
  pillars: string[]
  tone: string[]
  magic_level: string | null
  tech_level: string | null
  themes: string[]
  narrative_voice: string | null
  content_warnings: string[]
  languages: string[]
  geography_notes: string | null
  calendar_system: string | null
  current_game_date: string | null
  open_questions: string[]
  resolved_questions?: string[]
  proper_nouns?: string[]
  player_settings?: PlayerSettings | null
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

const PILLAR_LABELS: Record<string, string> = {
  exploration: 'Exploration',
  combat: 'Combat',
  roleplay: 'Roleplay',
  intrigue: 'Intrigue',
  mystery: 'Mystery',
  horror: 'Horror',
  survival: 'Survival',
  humor: 'Humor',
  romance: 'Romance',
}

export function CodexDisplay({ codex }: CodexDisplayProps): JSX.Element {
  const magicLabel = codex.magic_level ? MAGIC_LEVEL_LABELS[codex.magic_level] || codex.magic_level : null
  const techLabel = codex.tech_level ? TECH_LEVEL_LABELS[codex.tech_level] || codex.tech_level : null
  const narrativeLabel = codex.narrative_voice ? NARRATIVE_VOICE_LABELS[codex.narrative_voice] || codex.narrative_voice : null

  return (
    <div className="space-y-6">
      {/* Premise - Full Width */}
      {codex.premise && (
        <MaterialCard entityType="quest" className="p-0">
          <div className="p-4 pb-2 border-b border-white/5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <BookOpen className="w-5 h-5 text-gold" />
              Campaign Premise
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-ash whitespace-pre-wrap">{codex.premise}</p>
          </div>
        </MaterialCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* World Foundation */}
        <MaterialCard entityType="location" className="p-0">
          <div className="p-4 pb-2 border-b border-white/5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Sparkles className="w-5 h-5 text-emerald" />
              World Foundation
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {codex.world_name && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider">World Name</p>
                <p className="font-medium text-bone">{codex.world_name}</p>
              </div>
            )}

            {codex.pillars && codex.pillars.length > 0 && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider mb-2">Campaign Pillars</p>
                <div className="flex flex-wrap gap-1">
                  {codex.pillars.map((p) => (
                    <Badge key={p} variant="default">
                      {PILLAR_LABELS[p] || p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {codex.tone && codex.tone.length > 0 && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider mb-2">Tone</p>
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
                  <p className="text-xs text-smoke uppercase tracking-wider">Magic Level</p>
                  <p className="font-medium text-bone">{magicLabel}</p>
                </div>
              )}
              {techLabel && (
                <div>
                  <p className="text-xs text-smoke uppercase tracking-wider">Tech Level</p>
                  <p className="font-medium text-bone">{techLabel}</p>
                </div>
              )}
            </div>

            {codex.themes && codex.themes.length > 0 && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider mb-2">Themes</p>
                <div className="flex flex-wrap gap-1">
                  {codex.themes.map((theme) => (
                    <Badge key={theme} variant="outline">
                      {THEME_LABELS[theme] || theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </MaterialCard>

        {/* Style Settings */}
        <MaterialCard entityType="quest" className="p-0">
          <div className="p-4 pb-2 border-b border-white/5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Palette className="w-5 h-5 text-gold" />
              Style Settings
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {narrativeLabel && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider">Narrative Voice</p>
                <p className="font-medium text-bone">{narrativeLabel}</p>
              </div>
            )}

            {codex.content_warnings && codex.content_warnings.length > 0 && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider mb-2">Content Warnings</p>
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
              <p className="text-sm text-ash italic">No style settings configured</p>
            )}
          </div>
        </MaterialCard>

        {/* World Details */}
        <MaterialCard entityType="location" className="p-0">
          <div className="p-4 pb-2 border-b border-white/5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Globe className="w-5 h-5 text-emerald" />
              World Details
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {codex.languages && codex.languages.length > 0 && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider mb-2">Languages</p>
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
                <p className="text-xs text-smoke uppercase tracking-wider">Calendar System</p>
                <p className="font-medium text-bone">{codex.calendar_system}</p>
              </div>
            )}

            {codex.current_game_date && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider">Current Game Date</p>
                <p className="font-medium text-bone">{codex.current_game_date}</p>
              </div>
            )}

            {codex.geography_notes && (
              <div>
                <p className="text-xs text-smoke uppercase tracking-wider">Geography</p>
                <p className="text-sm text-ash whitespace-pre-wrap">{codex.geography_notes}</p>
              </div>
            )}

            {(!codex.languages?.length && !codex.calendar_system && !codex.current_game_date && !codex.geography_notes) && (
              <p className="text-sm text-ash italic">No world details configured</p>
            )}
          </div>
        </MaterialCard>

        {/* Established Names */}
        {codex.proper_nouns && codex.proper_nouns.length > 0 && (
          <MaterialCard entityType="npc" className="p-0">
            <div className="p-4 pb-2 border-b border-white/5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                <Users className="w-5 h-5 text-purple" />
                Established Names
              </h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {codex.proper_nouns.map((noun) => (
                  <Badge key={noun} variant="secondary">
                    {noun}
                  </Badge>
                ))}
              </div>
            </div>
          </MaterialCard>
        )}

        {/* Open Questions */}
        <MaterialCard className="p-0">
          <div className="p-4 pb-2 border-b border-white/5">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <HelpCircle className="w-5 h-5 text-arcane" />
              Open Questions
            </h3>
          </div>
          <div className="p-4">
            {codex.open_questions && codex.open_questions.length > 0 ? (
              <div className="space-y-2">
                {codex.open_questions.map((question, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-smoke">•</span>
                    <p className="text-sm text-ash">{question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ash italic">No open questions</p>
            )}
          </div>
        </MaterialCard>

        {/* Established Facts */}
        {codex.resolved_questions && codex.resolved_questions.length > 0 && (
          <MaterialCard className="p-0 border-emerald/30">
            <div className="p-4 pb-2 border-b border-emerald/10">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-emerald">
                <Check className="w-5 h-5" />
                Established Facts
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {codex.resolved_questions.map((fact, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-emerald">✓</span>
                    <p className="text-sm text-ash">{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </MaterialCard>
        )}

        {/* Player Portal Settings */}
        {codex.player_settings && (
          <MaterialCard className="p-0 border-teal-500/30 md:col-span-2">
            <div className="p-4 pb-2 border-b border-teal-500/10">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-teal-400">
                <Gamepad2 className="w-5 h-5" />
                Player Portal Settings
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Character Editing */}
                <div>
                  <p className="text-xs text-smoke uppercase tracking-wider mb-2">Character Editing</p>
                  <div className="space-y-1">
                    {codex.player_settings.character_editing?.backstory && (
                      <Badge variant="secondary" className="mr-1">Backstory</Badge>
                    )}
                    {codex.player_settings.character_editing?.personality && (
                      <Badge variant="secondary" className="mr-1">Personality</Badge>
                    )}
                    {codex.player_settings.character_editing?.notes && (
                      <Badge variant="secondary" className="mr-1">Notes</Badge>
                    )}
                    {codex.player_settings.character_editing?.appearance && (
                      <Badge variant="secondary" className="mr-1">Appearance</Badge>
                    )}
                  </div>
                </div>

                {/* Inventory */}
                <div>
                  <p className="text-xs text-smoke uppercase tracking-wider mb-2">Inventory</p>
                  <div className="space-y-1">
                    {codex.player_settings.inventory?.can_add_items && (
                      <Badge variant="secondary" className="mr-1">Add Items</Badge>
                    )}
                    {codex.player_settings.inventory?.requires_approval && (
                      <Badge variant="outline" className="mr-1 text-amber-400 border-amber-500/30">Approval Required</Badge>
                    )}
                    {codex.player_settings.inventory?.can_see_party_stash && (
                      <Badge variant="secondary" className="mr-1">Party Stash</Badge>
                    )}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <p className="text-xs text-smoke uppercase tracking-wider mb-2">Visibility</p>
                  <div className="space-y-1">
                    {codex.player_settings.visibility?.can_see_quests && (
                      <Badge variant="secondary" className="mr-1">Quests</Badge>
                    )}
                    {codex.player_settings.visibility?.can_see_world_map && (
                      <Badge variant="secondary" className="mr-1">World Map</Badge>
                    )}
                    {codex.player_settings.visibility?.can_see_party_members && (
                      <Badge variant="secondary" className="mr-1">Party</Badge>
                    )}
                    {codex.player_settings.visibility?.can_see_revealed_lore && (
                      <Badge variant="secondary" className="mr-1">Lore</Badge>
                    )}
                  </div>
                </div>

                {/* Communication */}
                <div>
                  <p className="text-xs text-smoke uppercase tracking-wider mb-2">Communication</p>
                  <div className="space-y-1">
                    {codex.player_settings.communication?.can_message_dm && (
                      <Badge variant="secondary" className="mr-1">Message DM</Badge>
                    )}
                    {codex.player_settings.communication?.can_message_party && (
                      <Badge variant="secondary" className="mr-1">Party Chat</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </MaterialCard>
        )}
      </div>
    </div>
  )
}
