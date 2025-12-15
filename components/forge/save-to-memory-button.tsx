'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Check } from 'lucide-react'
import { toast } from 'sonner'
import { GeneratedNPC } from './npc-output-display'

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

  const handleSave = async (): Promise<void> => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Build the entity data
      const entityData = {
        campaign_id: campaignId,
        entity_type: 'npc',
        name: npc.name,
        summary: `${npc.race} ${npc.gender.toLowerCase()}. ${npc.motivation}`,
        description: npc.appearance,
        dm_notes: `**Secret:** ${npc.secret}\n\n**Connection Hooks:**\n${npc.connectionHooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}`,
        attributes: {
          race: npc.race,
          gender: npc.gender,
          appearance: npc.appearance,
          personality: npc.personality,
          voiceAndMannerisms: npc.voiceAndMannerisms,
          motivation: npc.motivation,
          secret: npc.secret,
          connectionHooks: npc.connectionHooks,
          suggestedStats: npc.suggestedStats || null,
        },
        source_forge: 'npc',
        forge_status: 'complete',
        importance_tier: 'minor',
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

      setSaved(true)
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
      <Button disabled variant="outline" className="gap-2">
        <Check className="w-4 h-4" />
        Saved to Memory
      </Button>
    )
  }

  return (
    <Button onClick={handleSave} disabled={saving} className="gap-2">
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
  )
}
