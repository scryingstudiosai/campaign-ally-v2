'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { toast } from 'sonner'

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
}

interface CodexFormProps {
  codex: Codex
  campaignId: string
}

const PILLARS = [
  { value: 'exploration', label: 'Exploration' },
  { value: 'combat', label: 'Combat' },
  { value: 'roleplay', label: 'Roleplay' },
  { value: 'intrigue', label: 'Intrigue' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'horror', label: 'Horror' },
  { value: 'survival', label: 'Survival' },
  { value: 'humor', label: 'Humor' },
  { value: 'romance', label: 'Romance' },
]

const TONES = [
  { value: 'heroic', label: 'Heroic' },
  { value: 'gritty', label: 'Gritty' },
  { value: 'dark', label: 'Dark' },
  { value: 'comedic', label: 'Comedic' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'whimsical', label: 'Whimsical' },
]

const MAGIC_LEVELS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'wild', label: 'Wild' },
]

const TECH_LEVELS = [
  { value: 'prehistoric', label: 'Prehistoric' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'renaissance', label: 'Renaissance' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'modern', label: 'Modern' },
  { value: 'futuristic', label: 'Futuristic' },
  { value: 'steampunk', label: 'Steampunk' },
  { value: 'magitech', label: 'Magitech' },
]

const THEMES = [
  { value: 'redemption', label: 'Redemption' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'war', label: 'War' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'survival', label: 'Survival' },
  { value: 'political_intrigue', label: 'Political Intrigue' },
  { value: 'good_vs_evil', label: 'Good vs Evil' },
]

const NARRATIVE_VOICES = [
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'casual', label: 'Casual' },
  { value: 'poetic', label: 'Poetic' },
  { value: 'gritty', label: 'Gritty' },
  { value: 'humorous', label: 'Humorous' },
]

const CONTENT_WARNING_PRESETS = [
  // Violence & Gore
  'Violence',
  'Gore',
  'Body Horror',
  'Death',
  'Torture',
  // Sexual & Romance
  'Sexual Content',
  'Romance',
  'Substance Use',
  // Mental & Emotional
  'Mental Health',
  'Trauma',
  'Abuse',
  'Child Endangerment',
  // Other
  'Phobias',
  'Imprisonment',
  'Slavery',
]

const COMMON_LANGUAGES = [
  'Common',
  'Elvish',
  'Dwarvish',
  'Draconic',
  'Infernal',
  'Celestial',
  'Abyssal',
  'Primordial',
  'Undercommon',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Sylvan',
  'Deep Speech',
  'Thieves\' Cant',
]

const CALENDAR_PRESETS = [
  { value: 'gregorian', label: 'Gregorian (Real World)' },
  { value: 'harptos', label: 'Harptos (Forgotten Realms)' },
  { value: 'golarion', label: 'Golarion (Pathfinder)' },
  { value: 'eberron', label: 'Eberron' },
  { value: 'custom', label: 'Custom' },
]

export function CodexForm({ codex, campaignId }: CodexFormProps): JSX.Element {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // World Foundation
  const [worldName, setWorldName] = useState(codex.world_name || '')
  const [premise, setPremise] = useState(codex.premise || '')
  const [pillars, setPillars] = useState<string[]>(codex.pillars || [])
  const [tone, setTone] = useState<string[]>(codex.tone || [])
  const [magicLevel, setMagicLevel] = useState(codex.magic_level || '')
  const [techLevel, setTechLevel] = useState(codex.tech_level || '')
  const [themes, setThemes] = useState<string[]>(codex.themes || [])

  // Style Settings
  const [narrativeVoice, setNarrativeVoice] = useState(codex.narrative_voice || '')
  const [contentWarnings, setContentWarnings] = useState<string[]>(codex.content_warnings || [])
  const [newWarning, setNewWarning] = useState('')

  // World Details
  const [languages, setLanguages] = useState<string[]>(codex.languages || [])
  const [newLanguage, setNewLanguage] = useState('')
  const [geographyNotes, setGeographyNotes] = useState(codex.geography_notes || '')
  const [calendarPreset, setCalendarPreset] = useState(() => {
    const preset = CALENDAR_PRESETS.find(p => p.label === codex.calendar_system)
    return preset ? preset.value : (codex.calendar_system ? 'custom' : '')
  })
  const [customCalendar, setCustomCalendar] = useState(() => {
    const preset = CALENDAR_PRESETS.find(p => p.label === codex.calendar_system)
    return preset ? '' : (codex.calendar_system || '')
  })
  const [currentGameDate, setCurrentGameDate] = useState(codex.current_game_date || '')

  // Open Questions
  const [openQuestions, setOpenQuestions] = useState<string[]>(codex.open_questions || [])
  const [newQuestion, setNewQuestion] = useState('')

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item))
    } else {
      setArr([...arr, item])
    }
  }

  const addTag = (
    value: string,
    setValue: (val: string) => void,
    arr: string[],
    setArr: (val: string[]) => void
  ) => {
    const trimmed = value.trim()
    if (trimmed && !arr.includes(trimmed)) {
      setArr([...arr, trimmed])
    }
    setValue('')
  }

  const removeTag = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    setArr(arr.filter((i) => i !== item))
  }

  const selectAllLanguages = () => {
    const allCommon = Array.from(new Set([...languages, ...COMMON_LANGUAGES]))
    setLanguages(allCommon)
  }

  const clearAllLanguages = () => {
    // Keep only custom languages
    setLanguages(languages.filter(l => !COMMON_LANGUAGES.includes(l)))
  }

  const getCalendarSystemValue = (): string | null => {
    if (!calendarPreset) return null
    if (calendarPreset === 'custom') return customCalendar.trim() || null
    const preset = CALENDAR_PRESETS.find(p => p.value === calendarPreset)
    return preset ? preset.label : null
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('codex')
        .update({
          world_name: worldName.trim() || null,
          premise: premise.trim() || null,
          pillars,
          tone,
          magic_level: magicLevel || null,
          tech_level: techLevel || null,
          themes,
          narrative_voice: narrativeVoice || null,
          content_warnings: contentWarnings,
          languages,
          geography_notes: geographyNotes.trim() || null,
          calendar_system: getCalendarSystemValue(),
          current_game_date: currentGameDate.trim() || null,
          open_questions: openQuestions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', codex.id)

      if (error) {
        throw error
      }

      toast.success('Codex updated successfully!')
      window.location.href = `/dashboard/campaigns/${campaignId}/codex`
    } catch (error) {
      console.error('Error updating codex:', error)
      toast.error('Failed to update codex')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* World Foundation */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">World Foundation</h2>

        <div className="space-y-2">
          <Label htmlFor="world-name">World Name</Label>
          <Input
            id="world-name"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Enter the name of your world"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="premise">Campaign Premise</Label>
          <p className="text-sm text-muted-foreground">
            This helps AI understand the core of your campaign.
          </p>
          <Textarea
            id="premise"
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            placeholder="What is this campaign about? The central conflict or hook in 1-2 sentences."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Campaign Pillars</Label>
          <p className="text-sm text-muted-foreground">
            What does your campaign focus on? Select all that apply.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {PILLARS.map((p) => (
              <Badge
                key={p.value}
                variant={pillars.includes(p.value) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20"
                onClick={() => toggleArrayItem(pillars, setPillars, p.value)}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tone (select multiple)</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <Badge
                key={t.value}
                variant={tone.includes(t.value) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20"
                onClick={() => toggleArrayItem(tone, setTone, t.value)}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="magic-level">Magic Level</Label>
            <Select value={magicLevel} onValueChange={setMagicLevel}>
              <SelectTrigger id="magic-level">
                <SelectValue placeholder="Select magic level" />
              </SelectTrigger>
              <SelectContent>
                {MAGIC_LEVELS.map((ml) => (
                  <SelectItem key={ml.value} value={ml.value}>
                    {ml.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech-level">Tech Level</Label>
            <Select value={techLevel} onValueChange={setTechLevel}>
              <SelectTrigger id="tech-level">
                <SelectValue placeholder="Select tech level" />
              </SelectTrigger>
              <SelectContent>
                {TECH_LEVELS.map((tl) => (
                  <SelectItem key={tl.value} value={tl.value}>
                    {tl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Themes (select multiple)</Label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <Badge
                key={t.value}
                variant={themes.includes(t.value) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20"
                onClick={() => toggleArrayItem(themes, setThemes, t.value)}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Style Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Style Settings</h2>

        <div className="space-y-2">
          <Label htmlFor="narrative-voice">Narrative Voice</Label>
          <Select value={narrativeVoice} onValueChange={setNarrativeVoice}>
            <SelectTrigger id="narrative-voice">
              <SelectValue placeholder="Select narrative voice" />
            </SelectTrigger>
            <SelectContent>
              {NARRATIVE_VOICES.map((nv) => (
                <SelectItem key={nv.value} value={nv.value}>
                  {nv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Content Warnings (Lines &amp; Veils)</Label>
          <p className="text-sm text-muted-foreground">
            Topics to handle carefully or avoid entirely in AI-generated content.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {CONTENT_WARNING_PRESETS.map((warning) => (
              <Badge
                key={warning}
                variant={contentWarnings.includes(warning) ? 'destructive' : 'outline'}
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleArrayItem(contentWarnings, setContentWarnings, warning)}
              >
                {warning}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              value={newWarning}
              onChange={(e) => setNewWarning(e.target.value)}
              placeholder="Add custom warning..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(newWarning, setNewWarning, contentWarnings, setContentWarnings)
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addTag(newWarning, setNewWarning, contentWarnings, setContentWarnings)}
            >
              Add
            </Button>
          </div>
          {contentWarnings.filter(w => !CONTENT_WARNING_PRESETS.includes(w)).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-muted-foreground mr-2">Custom:</span>
              {contentWarnings.filter(w => !CONTENT_WARNING_PRESETS.includes(w)).map((warning) => (
                <Badge key={warning} variant="destructive" className="gap-1">
                  {warning}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(contentWarnings, setContentWarnings, warning)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* World Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">World Details</h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Languages</Label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={selectAllLanguages}>
                Select All Common
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAllLanguages}>
                Clear All
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Select common languages spoken in your world or add custom ones.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {COMMON_LANGUAGES.map((lang) => (
              <Badge
                key={lang}
                variant={languages.includes(lang) ? 'secondary' : 'outline'}
                className="cursor-pointer hover:bg-secondary/20"
                onClick={() => toggleArrayItem(languages, setLanguages, lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Add custom language..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(newLanguage, setNewLanguage, languages, setLanguages)
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addTag(newLanguage, setNewLanguage, languages, setLanguages)}
            >
              Add
            </Button>
          </div>
          {languages.filter(l => !COMMON_LANGUAGES.includes(l)).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-muted-foreground mr-2">Custom:</span>
              {languages.filter(l => !COMMON_LANGUAGES.includes(l)).map((lang) => (
                <Badge key={lang} variant="secondary" className="gap-1">
                  {lang}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(languages, setLanguages, lang)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="geography-notes">Geography Notes (Optional)</Label>
          <Textarea
            id="geography-notes"
            value={geographyNotes}
            onChange={(e) => setGeographyNotes(e.target.value)}
            placeholder="Brief overview of your world's geography. Detailed locations can be added as Entities later."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="calendar-system">Calendar System</Label>
          <p className="text-sm text-muted-foreground">
            The calendar system your world uses for tracking dates.
          </p>
          <Select value={calendarPreset} onValueChange={setCalendarPreset}>
            <SelectTrigger id="calendar-system">
              <SelectValue placeholder="Select a calendar system" />
            </SelectTrigger>
            <SelectContent>
              {CALENDAR_PRESETS.map((cal) => (
                <SelectItem key={cal.value} value={cal.value}>
                  {cal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {calendarPreset === 'custom' && (
            <Input
              value={customCalendar}
              onChange={(e) => setCustomCalendar(e.target.value)}
              placeholder="Enter your custom calendar name"
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-game-date">Current Game Date (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Where your campaign currently is in the timeline.
          </p>
          <Input
            id="current-game-date"
            value={currentGameDate}
            onChange={(e) => setCurrentGameDate(e.target.value)}
            placeholder="e.g., 15th of Mirtul, 1492 DR"
          />
        </div>
      </div>

      {/* Open Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Open Questions</h2>
        <p className="text-sm text-muted-foreground">
          Things you haven&apos;t decided yet — AI will avoid committing to these.
        </p>

        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g., Who is the real villain?, What destroyed the ancient kingdom?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag(newQuestion, setNewQuestion, openQuestions, setOpenQuestions)
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(newQuestion, setNewQuestion, openQuestions, setOpenQuestions)}
          >
            Add
          </Button>
        </div>

        {openQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {openQuestions.map((question) => (
              <Badge key={question} variant="outline" className="gap-1 py-1 px-2">
                {question}
                <X
                  className="w-3 h-3 cursor-pointer ml-1"
                  onClick={() => removeTag(openQuestions, setOpenQuestions, question)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Codex'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = `/dashboard/campaigns/${campaignId}/codex`}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
