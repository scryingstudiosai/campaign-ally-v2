'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, X, Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Entity } from '@/components/memory/entity-card'

// Handle array inputs cleanly (commas, newlines, extra whitespace)
const parseArrayInput = (input: string): string[] =>
  input.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)

const formatArrayOutput = (arr: unknown): string =>
  Array.isArray(arr) ? arr.join(', ') : ''

interface EntityEditFormProps {
  entity: Entity & {
    public_notes?: string
    dm_notes?: string
    tags?: string[]
    attributes?: Record<string, unknown>
    brain?: Record<string, unknown>
    voice?: Record<string, unknown>
    read_aloud?: string
  }
  campaignId: string
  campaignName: string
}

export function EntityEditForm({
  entity,
  campaignId,
  campaignName,
}: EntityEditFormProps): JSX.Element {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState(entity.name)
  const [entityType, setEntityType] = useState<string>(entity.entity_type)
  const [subtype, setSubtype] = useState(entity.subtype || '')
  const [subType, setSubType] = useState(entity.sub_type || 'standard') // NPC role: standard/villain/hero
  const [summary, setSummary] = useState(entity.summary || '')
  const [description, setDescription] = useState(entity.description || '')
  const [publicNotes, setPublicNotes] = useState(entity.public_notes || '')
  const [dmNotes, setDmNotes] = useState(entity.dm_notes || '')
  const [status, setStatus] = useState<string>(entity.status)
  const [importance, setImportance] = useState<string>(entity.importance_tier)
  const [visibility, setVisibility] = useState<string>(entity.visibility)
  const [tags, setTags] = useState<string[]>(entity.tags || [])
  const [newTag, setNewTag] = useState('')

  // NPC Brain/Voice/ReadAloud state
  const [brain, setBrain] = useState<Record<string, unknown>>(entity.brain || {})
  const [voice, setVoice] = useState<Record<string, unknown>>(entity.voice || {})
  const [readAloud, setReadAloud] = useState(entity.read_aloud || '')

  // Detect NPC types
  const isNpc = entityType === 'npc'
  const isVillain = subType === 'villain'
  const isHero = subType === 'hero'

  // Track if entity type changed
  const typeChanged = entityType !== entity.entity_type

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      // Build update object
      const updates: Record<string, unknown> = {
        name: name.trim(),
        entity_type: entityType,
        subtype: subtype.trim() || null,
        summary: summary.trim() || null,
        description: description.trim() || null,
        public_notes: publicNotes.trim() || null,
        dm_notes: dmNotes.trim() || null,
        status,
        importance_tier: importance,
        visibility,
        tags: tags.length > 0 ? tags : null,
        updated_at: new Date().toISOString(),
      }

      // Only include NPC-specific fields if it's an NPC
      if (isNpc) {
        updates.sub_type = subType
        updates.brain = brain
        updates.voice = voice
        updates.read_aloud = readAloud.trim() || null
      }

      const { error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', entity.id)

      if (error) throw error

      toast.success('Entity updated')
      router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`)
      router.refresh()
    } catch (error) {
      console.error('Failed to update entity:', error)
      toast.error('Failed to update entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-6">Edit Entity</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Entity Type *</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="npc">NPC</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="item">Item</SelectItem>
                      <SelectItem value="faction">Faction</SelectItem>
                      <SelectItem value="quest">Quest</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {typeChanged && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Changing type may affect how attributes are displayed
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtype">Subtype</Label>
                  <Input
                    id="subtype"
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    placeholder="e.g., Merchant, Tavern, Magic Weapon"
                  />
                </div>
              </div>

              {/* NPC Type Selector */}
              {isNpc && (
                <div className="space-y-2">
                  <Label>NPC Type</Label>
                  <Select value={subType} onValueChange={setSubType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard NPC</SelectItem>
                      <SelectItem value="villain">Villain</SelectItem>
                      <SelectItem value="hero">Hero / Ally</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Changing type will show different fields below.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief one-line description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* NPC Brain Section */}
          {isNpc && (
            <Card>
              <CardHeader>
                <CardTitle>NPC Brain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Desire</Label>
                    <Textarea
                      value={(brain.desire as string) || ''}
                      onChange={(e) => setBrain({ ...brain, desire: e.target.value })}
                      placeholder="What do they want most?"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fear</Label>
                    <Textarea
                      value={(brain.fear as string) || ''}
                      onChange={(e) => setBrain({ ...brain, fear: e.target.value })}
                      placeholder="What terrifies them?"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leverage</Label>
                    <Textarea
                      value={(brain.leverage as string) || ''}
                      onChange={(e) => setBrain({ ...brain, leverage: e.target.value })}
                      placeholder="How can they be manipulated?"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line They Won&apos;t Cross</Label>
                    <Textarea
                      value={(brain.line as string) || ''}
                      onChange={(e) => setBrain({ ...brain, line: e.target.value })}
                      placeholder="What will they NEVER do?"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Villain-specific fields */}
                {isVillain && (
                  <div className="space-y-4 mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <h4 className="text-md font-medium text-red-400">Villain Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Scheme</Label>
                        <Textarea
                          value={(brain.scheme as string) || ''}
                          onChange={(e) => setBrain({ ...brain, scheme: e.target.value })}
                          placeholder="Their active plot..."
                          className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Scheme Phase</Label>
                        <Select
                          value={(brain.scheme_phase as string) || 'planning'}
                          onValueChange={(v) => setBrain({ ...brain, scheme_phase: v })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning - Gathering resources</SelectItem>
                            <SelectItem value="executing">Executing - Plan in motion</SelectItem>
                            <SelectItem value="desperate">Desperate - Cornered and dangerous</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Resources (comma or newline separated)</Label>
                        <Textarea
                          value={formatArrayOutput(brain.resources)}
                          onChange={(e) => setBrain({ ...brain, resources: parseArrayInput(e.target.value) })}
                          placeholder="20 loyal thugs&#10;10,000 gold in bribes&#10;A corrupted guard captain"
                          className="bg-slate-900/50 border-slate-700 min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Escape Plan</Label>
                        <Textarea
                          value={(brain.escape_plan as string) || ''}
                          onChange={(e) => setBrain({ ...brain, escape_plan: e.target.value })}
                          placeholder="How they survive when beaten..."
                          className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Escalation (If Unchecked)</Label>
                        <Textarea
                          value={(brain.escalation as string) || ''}
                          onChange={(e) => setBrain({ ...brain, escalation: e.target.value })}
                          placeholder="What happens if the party fails to stop them?"
                          className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Hero-specific fields */}
                {isHero && (
                  <div className="space-y-4 mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <h4 className="text-md font-medium text-amber-400">Hero Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Limitation</Label>
                        <Textarea
                          value={(brain.limitation as string) || ''}
                          onChange={(e) => setBrain({ ...brain, limitation: e.target.value })}
                          placeholder="Why can't they solve the problem themselves?"
                          className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Role</Label>
                        <Textarea
                          value={(brain.support_role as string) || ''}
                          onChange={(e) => setBrain({ ...brain, support_role: e.target.value })}
                          placeholder="How do they help the party?"
                          className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select
                          value={(brain.availability as string) || 'scheduled'}
                          onValueChange={(v) => setBrain({ ...brain, availability: v })}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always Available</SelectItem>
                            <SelectItem value="scheduled">By Appointment</SelectItem>
                            <SelectItem value="emergency">Emergencies Only</SelectItem>
                            <SelectItem value="once">One-Time Help</SelectItem>
                            <SelectItem value="random">Unpredictable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* NPC Voice Section */}
          {isNpc && (
            <Card>
              <CardHeader>
                <CardTitle>Voice Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Voice Style (comma separated)</Label>
                    <Input
                      value={formatArrayOutput(voice.style)}
                      onChange={(e) => setVoice({ ...voice, style: parseArrayInput(e.target.value) })}
                      placeholder="Gruff, Commanding, Warm..."
                      className="bg-slate-900/50 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catchphrase</Label>
                    <Input
                      value={(voice.catchphrase as string) || ''}
                      onChange={(e) => setVoice({ ...voice, catchphrase: e.target.value })}
                      placeholder="A memorable phrase..."
                      className="bg-slate-900/50 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Energy</Label>
                    <Select
                      value={(voice.energy as string) || 'measured'}
                      onValueChange={(v) => setVoice({ ...voice, energy: v })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subdued">Subdued</SelectItem>
                        <SelectItem value="measured">Measured</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="manic">Manic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vocabulary</Label>
                    <Select
                      value={(voice.vocabulary as string) || 'simple'}
                      onValueChange={(v) => setVoice({ ...voice, vocabulary: v })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="educated">Educated</SelectItem>
                        <SelectItem value="archaic">Archaic</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="street">Street</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Speech Patterns (comma or newline separated)</Label>
                    <Textarea
                      value={formatArrayOutput(voice.speech_patterns)}
                      onChange={(e) => setVoice({ ...voice, speech_patterns: parseArrayInput(e.target.value) })}
                      placeholder="Speaks in third person&#10;Ends sentences with questions"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tells (comma or newline separated)</Label>
                    <Textarea
                      value={formatArrayOutput(voice.tells)}
                      onChange={(e) => setVoice({ ...voice, tells: parseArrayInput(e.target.value) })}
                      placeholder="Tugs ear when lying&#10;Avoids eye contact when nervous"
                      className="bg-slate-900/50 border-slate-700 min-h-[60px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NPC Read Aloud Section */}
          {isNpc && (
            <Card>
              <CardHeader>
                <CardTitle>Read Aloud Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  value={readAloud}
                  onChange={(e) => setReadAloud(e.target.value)}
                  placeholder="A 40-60 word sensory description to read to players when they first meet this NPC..."
                  className="min-h-[100px] bg-slate-900/50 border-slate-700"
                />
                <p className="text-xs text-muted-foreground">
                  Use **bold** for emphasis on key details.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="public-notes" className="flex items-center gap-2">
                  Public Notes
                  <Badge variant="outline" className="text-green-500 text-xs">
                    Player Safe
                  </Badge>
                </Label>
                <Textarea
                  id="public-notes"
                  value={publicNotes}
                  onChange={(e) => setPublicNotes(e.target.value)}
                  placeholder="Information that can be shared with players"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dm-notes" className="flex items-center gap-2">
                  DM Notes
                  <Badge variant="outline" className="text-amber-500 text-xs">
                    DM Only
                  </Badge>
                </Label>
                <Textarea
                  id="dm-notes"
                  value={dmNotes}
                  onChange={(e) => setDmNotes(e.target.value)}
                  placeholder="Secret information for DM only"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                      <SelectItem value="destroyed">Destroyed</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Importance</Label>
                  <Select value={importance} onValueChange={setImportance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legendary">Legendary</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="background">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="dm_only">DM Only</SelectItem>
                      <SelectItem value="revealable">Revealable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
