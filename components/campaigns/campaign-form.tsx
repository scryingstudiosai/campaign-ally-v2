'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'

const GENRES = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'horror', label: 'Horror' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'other', label: 'Other' },
]

const GAME_SYSTEMS = [
  { value: 'dnd5e', label: 'D&D 5e' },
  { value: 'pathfinder2e', label: 'Pathfinder 2e' },
  { value: 'daggerheart', label: 'Daggerheart' },
  { value: 'system_agnostic', label: 'System Agnostic' },
  { value: 'other', label: 'Other' },
]

export function CampaignForm(): JSX.Element {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [gameSystem, setGameSystem] = useState('dnd5e')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to create a campaign')
        setLoading(false)
        return
      }

      // Create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          genre: genre || null,
          game_system: gameSystem,
        })
        .select()
        .single()

      if (campaignError) {
        throw campaignError
      }

      // Auto-create a codex entry for the campaign
      const { error: codexError } = await supabase
        .from('codex')
        .insert({
          campaign_id: campaign.id,
          world_name: name.trim(),
        })

      if (codexError) {
        console.error('Failed to create codex:', codexError)
        // Don't fail the whole operation if codex creation fails
      }

      toast.success('Campaign created successfully!')
      router.push(`/dashboard/campaigns/${campaign.id}`)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter campaign name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your campaign..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre</Label>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger id="genre">
            <SelectValue placeholder="Select a genre" />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="game-system">Game System</Label>
        <Select value={gameSystem} onValueChange={setGameSystem}>
          <SelectTrigger id="game-system">
            <SelectValue placeholder="Select a game system" />
          </SelectTrigger>
          <SelectContent>
            {GAME_SYSTEMS.map((gs) => (
              <SelectItem key={gs.value} value={gs.value}>
                {gs.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Campaign'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
