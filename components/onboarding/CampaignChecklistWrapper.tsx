'use client'

import { useEffect, useCallback } from 'react'
import { useOnboarding, ChecklistProgress } from '@/hooks/useOnboarding'
import { CampaignChecklist } from './CampaignChecklist'
import { createClient } from '@/lib/supabase/client'

interface CampaignChecklistWrapperProps {
  campaignId: string
}

export function CampaignChecklistWrapper({ campaignId }: CampaignChecklistWrapperProps) {
  const { data, isLoading, getCompletionPercentage, updateChecklist } = useOnboarding()
  const supabase = createClient()

  // Auto-sync checklist progress by checking actual entity data
  const syncChecklistProgress = useCallback(async () => {
    if (!data || isLoading) return

    try {
      // Fetch entity counts by type for this campaign
      const { data: entities } = await supabase
        .from('entities')
        .select('entity_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)

      // Check codex has content
      const { data: codex } = await supabase
        .from('codex')
        .select('id, tone, themes')
        .eq('campaign_id', campaignId)
        .single()

      // Check sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('campaign_id', campaignId)
        .limit(1)

      const entityTypes = entities?.map(e => e.entity_type) || []
      const currentProgress = data.checklist_progress

      // Determine what should be marked as complete based on actual data
      const updates: Partial<ChecklistProgress> = {}

      // Check NPC
      if (!currentProgress.added_first_npc && entityTypes.includes('npc')) {
        updates.added_first_npc = true
      }

      // Check Location
      if (!currentProgress.added_first_location && entityTypes.includes('location')) {
        updates.added_first_location = true
      }

      // Check Quest
      if (!currentProgress.added_quest && entityTypes.includes('quest')) {
        updates.added_quest = true
      }

      // Check Faction
      if (!currentProgress.created_faction && entityTypes.includes('faction')) {
        updates.created_faction = true
      }

      // Check Codex explored
      if (!currentProgress.explored_codex && codex && (codex.tone || (codex.themes && codex.themes.length > 0))) {
        updates.explored_codex = true
      }

      // Check Session ran
      if (!currentProgress.ran_first_session && sessions && sessions.length > 0) {
        updates.ran_first_session = true
      }

      // Check AI generation usage - we'll mark this if any entities exist
      // (assuming they used AI to generate at least one)
      if (!currentProgress.used_ai_generation && entities && entities.length > 0) {
        updates.used_ai_generation = true
      }

      // Campaign was created if we're on this page
      if (!currentProgress.created_campaign) {
        updates.created_campaign = true
      }

      // Apply updates if any
      const updateKeys = Object.keys(updates) as (keyof ChecklistProgress)[]
      for (const key of updateKeys) {
        if (updates[key]) {
          await updateChecklist(key, true)
        }
      }
    } catch (error) {
      // Silently fail - don't break the UI if sync fails
      console.warn('Failed to sync checklist progress:', error)
    }
  }, [data, isLoading, campaignId, supabase, updateChecklist])

  // Run sync on mount and when campaignId changes
  useEffect(() => {
    syncChecklistProgress()
  }, [syncChecklistProgress])

  // Don't render if loading or if checklist is complete
  if (isLoading || !data) return null

  const percentage = getCompletionPercentage()

  // Hide once complete
  if (percentage === 100) return null

  return <CampaignChecklist campaignId={campaignId} />
}
