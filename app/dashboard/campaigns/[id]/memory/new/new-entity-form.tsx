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
import { ArrowLeft, Save, Loader2, X, Plus, Brain } from 'lucide-react'
import { toast } from 'sonner'

interface NewEntityFormProps {
  campaignId: string
  campaignName: string
}

export function NewEntityForm({
  campaignId,
  campaignName,
}: NewEntityFormProps): JSX.Element {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [entityType, setEntityType] = useState<string>('')
  const [subtype, setSubtype] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [publicNotes, setPublicNotes] = useState('')
  const [dmNotes, setDmNotes] = useState('')
  const [status, setStatus] = useState('active')
  const [importance, setImportance] = useState('minor')
  const [visibility, setVisibility] = useState('dm_only')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

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

    if (!name.trim() || !entityType) {
      toast.error('Name and entity type are required')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('entities')
        .insert({
          campaign_id: campaignId,
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
          source_forge: null,
          forge_status: null,
        })
        .select('id')
        .single()

      if (error) throw error

      toast.success('Entity created')
      router.push(`/dashboard/campaigns/${campaignId}/memory/${data.id}`)
    } catch (error) {
      console.error('Failed to create entity:', error)
      toast.error('Failed to create entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/dashboard/campaigns/${campaignId}/memory`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Memory
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Add Entity</h1>
        </div>

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
                  placeholder="Enter entity name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Entity Type *</Label>
                  <Select value={entityType} onValueChange={setEntityType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
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
              <div className="flex flex-wrap gap-2 min-h-[32px]">
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
                {tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">No tags yet</span>
                )}
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
              <Link href={`/dashboard/campaigns/${campaignId}/memory`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !entityType}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Entity
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
