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

interface CodexFormProps {
  codex: Codex
  campaignId: string
}

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

export function CodexForm({ codex, campaignId }: CodexFormProps): JSX.Element {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // World Foundation
  const [worldName, setWorldName] = useState(codex.world_name || '')
  const [tone, setTone] = useState<string[]>(codex.tone || [])
  const [magicLevel, setMagicLevel] = useState(codex.magic_level || 'medium')
  const [techLevel, setTechLevel] = useState(codex.tech_level || 'medieval')
  const [themes, setThemes] = useState<string[]>(codex.themes || [])

  // Style Settings
  const [narrativeVoice, setNarrativeVoice] = useState(codex.narrative_voice || '')
  const [contentWarnings, setContentWarnings] = useState<string[]>(codex.content_warnings || [])
  const [newWarning, setNewWarning] = useState('')

  // World Details
  const [languages, setLanguages] = useState<string[]>(codex.languages || [])
  const [newLanguage, setNewLanguage] = useState('')
  const [geographyNotes, setGeographyNotes] = useState(codex.geography_notes || '')
  const [calendarSystem, setCalendarSystem] = useState(codex.calendar_system || '')
  const [currentDate, setCurrentDate] = useState(codex.current_date || '')

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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('codex')
        .update({
          world_name: worldName.trim() || null,
          tone,
          magic_level: magicLevel,
          tech_level: techLevel,
          themes,
          narrative_voice: narrativeVoice || null,
          content_warnings: contentWarnings,
          languages,
          geography_notes: geographyNotes.trim() || null,
          calendar_system: calendarSystem.trim() || null,
          current_date: currentDate.trim() || null,
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
          <Label htmlFor="content-warnings">Content Warnings (Lines &amp; Veils)</Label>
          <div className="flex gap-2">
            <Input
              id="content-warnings"
              value={newWarning}
              onChange={(e) => setNewWarning(e.target.value)}
              placeholder="Add a content warning"
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
          {contentWarnings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contentWarnings.map((warning) => (
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
          <Label htmlFor="languages">Languages</Label>
          <div className="flex gap-2">
            <Input
              id="languages"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Add a language"
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
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {languages.map((lang) => (
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
          <Label htmlFor="geography-notes">Geography Notes</Label>
          <Textarea
            id="geography-notes"
            value={geographyNotes}
            onChange={(e) => setGeographyNotes(e.target.value)}
            placeholder="Describe the geography of your world..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calendar-system">Calendar System</Label>
            <Input
              id="calendar-system"
              value={calendarSystem}
              onChange={(e) => setCalendarSystem(e.target.value)}
              placeholder="e.g., Harptos Calendar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-date">Current Game Date</Label>
            <Input
              id="current-date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              placeholder="e.g., 15th of Mirtul, 1492 DR"
            />
          </div>
        </div>
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
