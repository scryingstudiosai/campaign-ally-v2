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
import { Loader2, Save, Check, MapPin, User, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { GeneratedItem } from './item-output-display'
import Link from 'next/link'

interface Entity {
  id: string
  name: string
  entity_type: string
}

interface ItemSaveToMemoryButtonProps {
  item: GeneratedItem
  campaignId: string
  onSaved?: (entityId: string) => void
}

export function ItemSaveToMemoryButton({
  item,
  campaignId,
  onSaved,
}: ItemSaveToMemoryButtonProps): JSX.Element {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedEntityId, setSavedEntityId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Entity[]>([])
  const [npcs, setNpcs] = useState<Entity[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('none')
  const [selectedOwner, setSelectedOwner] = useState<string>('none')
  const [loadingEntities, setLoadingEntities] = useState(true)

  // Fetch available locations and NPCs for this campaign
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const supabase = createClient()

        // Fetch locations
        const { data: locationData, error: locationError } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'location')
          .is('deleted_at', null)
          .order('name')

        if (locationError) throw locationError
        setLocations(locationData || [])

        // Fetch NPCs (potential owners)
        const { data: npcData, error: npcError } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'npc')
          .is('deleted_at', null)
          .order('name')

        if (npcError) throw npcError
        setNpcs(npcData || [])
      } catch (error) {
        console.error('Failed to fetch entities:', error)
      } finally {
        setLoadingEntities(false)
      }
    }

    fetchEntities()
  }, [campaignId])

  const handleSave = async (): Promise<void> => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Build the entity data
      const entityData = {
        campaign_id: campaignId,
        entity_type: 'item',
        name: item.name,
        subtype: item.item_type,
        summary: `${item.rarity} ${item.item_type}${item.magical_aura !== 'none' ? ` (${item.magical_aura})` : ''}`,
        description: item.public_description,
        public_notes: item.public_description,
        dm_notes: `**True Nature:** ${item.secret_description}\n\n**Origin:** ${item.origin_history}\n\n**Secret:** ${item.secret}\n\n**Value:** ${item.value_gp} gp | **Weight:** ${item.weight}`,
        attributes: {
          item_type: item.item_type,
          rarity: item.rarity,
          magical_aura: item.magical_aura,
          is_identified: item.is_identified,
          public_description: item.public_description,
          secret_description: item.secret_description,
          mechanical_properties: item.mechanical_properties,
          origin_history: item.origin_history,
          value_gp: item.value_gp,
          weight: item.weight,
          secret: item.secret,
          history: item.history,
        },
        source_forge: 'item',
        forge_status: 'complete',
        importance_tier: item.rarity === 'legendary' || item.rarity === 'artifact' ? 'major' : 'minor',
        visibility: 'dm_only',
        status: 'active',
      }

      const { data, error } = await supabase
        .from('entities')
        .insert(entityData)
        .select('id')
        .single()

      if (error) {
        throw error
      }

      // Create location relationship if selected
      if (selectedLocation !== 'none' && data?.id) {
        const { error: locationRelError } = await supabase
          .from('relationships')
          .insert({
            campaign_id: campaignId,
            source_id: data.id,
            target_id: selectedLocation,
            relationship_type: 'located_in',
          })

        if (locationRelError) {
          console.error('Failed to create location relationship:', locationRelError)
        }
      }

      // Create owner relationship if selected
      if (selectedOwner !== 'none' && data?.id) {
        const { error: ownerRelError } = await supabase
          .from('relationships')
          .insert({
            campaign_id: campaignId,
            source_id: data.id,
            target_id: selectedOwner,
            relationship_type: 'owned_by',
          })

        if (ownerRelError) {
          console.error('Failed to create owner relationship:', ownerRelError)
        }
      }

      setSaved(true)
      setSavedEntityId(data.id)
      toast.success(`${item.name} saved to campaign memory!`)

      if (onSaved && data) {
        onSaved(data.id)
      }
    } catch (error) {
      console.error('Failed to save item:', error)
      toast.error('Failed to save item. Please try again.')
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
          <Link href={`/dashboard/campaigns/${campaignId}/memory/${savedEntityId}`}>
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
    <div className="flex flex-wrap items-center gap-3">
      {/* Location Tagging Dropdown */}
      {locations.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={saving}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Location..." />
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

      {/* Owner Tagging Dropdown */}
      {npcs.length > 0 && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedOwner} onValueChange={setSelectedOwner} disabled={saving}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Owner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No owner</SelectItem>
              {npcs.map((npc) => (
                <SelectItem key={npc.id} value={npc.id}>
                  {npc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || loadingEntities} className="gap-2">
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
