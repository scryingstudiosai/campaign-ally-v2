'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Check, MapPin, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { GeneratedNPC } from './npc-output-display'
import Link from 'next/link'

interface Location {
  id: string
  name: string
}

interface SaveToMemoryButtonProps {
  npc: GeneratedNPC
  campaignId: string
  onSaved?: (entityId: string) => void
}

export function SaveToMemoryButton({
  npc,
  campaignId,
  onSaved,
}: SaveToMemoryButtonProps): JSX.Element {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedEntityId, setSavedEntityId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('none')
  const [loadingLocations, setLoadingLocations] = useState(true)

  // Fetch available locations for this campaign
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('entities')
          .select('id, name')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'location')
          .is('deleted_at', null)
          .order('name')

        if (error) throw error
        setLocations(data || [])
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setLoadingLocations(false)
      }
    }

    fetchLocations()
  }, [campaignId])

  // Format loot for dm_notes (handle both array and legacy string)
  const formatLoot = (): string => {
    if (Array.isArray(npc.loot)) {
      return npc.loot.map(item => `• ${item}`).join('\n')
    }
    return npc.loot
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Build the entity data with all new fields
      const entityData = {
        campaign_id: campaignId,
        entity_type: 'npc',
        name: npc.name,
        summary: npc.dmSlug,
        description: npc.appearance,
        dm_notes: `**Secret:** ${npc.secret}\n\n**Plot Hook:** ${npc.plotHook}\n\n**Connection Hooks:**\n${npc.connectionHooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n**Loot:**\n${formatLoot()}`,
        attributes: {
          dmSlug: npc.dmSlug,
          race: npc.race,
          gender: npc.gender,
          appearance: npc.appearance,
          personality: npc.personality,
          voiceAndMannerisms: npc.voiceAndMannerisms,
          voiceReference: npc.voiceReference || null,
          motivation: npc.motivation,
          secret: npc.secret,
          plotHook: npc.plotHook,
          loot: npc.loot,
          combatStats: npc.combatStats || null,
          connectionHooks: npc.connectionHooks,
        },
        source_forge: 'npc',
        forge_status: 'complete',
        importance_tier: 'minor',
        visibility: 'dm_only',
        status: 'active',
        parent_entity_id: selectedLocation !== 'none' ? selectedLocation : null,
      }

      const { data, error } = await supabase
        .from('entities')
        .insert(entityData)
        .select('id')
        .single()

      if (error) {
        throw error
      }

      setSaved(true)
      setSavedEntityId(data.id)
      toast.success(`${npc.name} saved to campaign memory!`)

      if (onSaved && data) {
        onSaved(data.id)
      }
    } catch (error) {
      console.error('Failed to save NPC:', error)
      toast.error('Failed to save NPC. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-green-500">
          <Check className="w-4 h-4" />
          <span>Saved to Memory</span>
        </div>
        {savedEntityId && (
          <Link href={`/campaign/${campaignId}/memory/${savedEntityId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3 h-3" />
              View in Memory
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Location Tagging Dropdown */}
      {locations.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={saving}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tag location..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No location</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || loadingLocations} className="gap-2">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save to Memory
          </>
        )}
      </Button>
    </div>
  )
}
