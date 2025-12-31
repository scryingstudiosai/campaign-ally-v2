'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChecklistProgress {
  created_campaign: boolean
  added_first_npc: boolean
  added_first_location: boolean
  ran_first_session: boolean
  used_ai_generation: boolean
  explored_codex: boolean
  created_faction: boolean
  added_quest: boolean
  exported_campaign: boolean
  invited_player: boolean
}

export interface OnboardingData {
  user_id: string
  has_completed_wizard: boolean
  wizard_completed_at: string | null
  checklist_progress: ChecklistProgress
  dismissed_hints: string[]
  tutorials_completed: string[]
  first_campaign_id: string | null
  created_at: string
  updated_at: string
}

const DEFAULT_CHECKLIST: ChecklistProgress = {
  created_campaign: false,
  added_first_npc: false,
  added_first_location: false,
  ran_first_session: false,
  used_ai_generation: false,
  explored_codex: false,
  created_faction: false,
  added_quest: false,
  exported_campaign: false,
  invited_player: false,
}

export function useOnboarding() {
  const supabase = createClient()
  const [data, setData] = useState<OnboardingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch onboarding data
  const fetchOnboarding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: onboarding, error: fetchError } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw fetchError
      }

      if (!onboarding) {
        // Create initial onboarding record
        const { data: newOnboarding, error: insertError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (insertError) throw insertError
        setData(newOnboarding)
      } else {
        setData(onboarding)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOnboarding()
  }, [fetchOnboarding])

  // Complete the setup wizard
  const completeWizard = useCallback(async (firstCampaignId?: string) => {
    if (!data) return

    try {
      const updates: Partial<OnboardingData> = {
        has_completed_wizard: true,
        wizard_completed_at: new Date().toISOString(),
      }

      if (firstCampaignId) {
        updates.first_campaign_id = firstCampaignId
        updates.checklist_progress = {
          ...data.checklist_progress,
          created_campaign: true,
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from('user_onboarding')
        .update(updates)
        .eq('user_id', data.user_id)
        .select()
        .single()

      if (updateError) throw updateError
      setData(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wizard')
    }
  }, [data, supabase])

  // Update a checklist item
  const updateChecklist = useCallback(async (key: keyof ChecklistProgress, value: boolean = true) => {
    if (!data) return

    try {
      const newProgress = {
        ...data.checklist_progress,
        [key]: value,
      }

      const { data: updated, error: updateError } = await supabase
        .from('user_onboarding')
        .update({ checklist_progress: newProgress })
        .eq('user_id', data.user_id)
        .select()
        .single()

      if (updateError) throw updateError
      setData(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update checklist')
    }
  }, [data, supabase])

  // Dismiss a hint
  const dismissHint = useCallback(async (hintId: string) => {
    if (!data) return

    try {
      const newDismissed = [...data.dismissed_hints, hintId]

      const { data: updated, error: updateError } = await supabase
        .from('user_onboarding')
        .update({ dismissed_hints: newDismissed })
        .eq('user_id', data.user_id)
        .select()
        .single()

      if (updateError) throw updateError
      setData(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss hint')
    }
  }, [data, supabase])

  // Check if a hint is dismissed
  const isHintDismissed = useCallback((hintId: string): boolean => {
    return data?.dismissed_hints.includes(hintId) ?? false
  }, [data])

  // Complete a tutorial
  const completeTutorial = useCallback(async (tutorialId: string) => {
    if (!data) return

    try {
      const newCompleted = [...data.tutorials_completed, tutorialId]

      const { data: updated, error: updateError } = await supabase
        .from('user_onboarding')
        .update({ tutorials_completed: newCompleted })
        .eq('user_id', data.user_id)
        .select()
        .single()

      if (updateError) throw updateError
      setData(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete tutorial')
    }
  }, [data, supabase])

  // Check if a tutorial is completed
  const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
    return data?.tutorials_completed.includes(tutorialId) ?? false
  }, [data])

  // Calculate checklist completion percentage
  const getCompletionPercentage = useCallback((): number => {
    if (!data) return 0
    const progress = data.checklist_progress
    const completed = Object.values(progress).filter(Boolean).length
    const total = Object.keys(progress).length
    return Math.round((completed / total) * 100)
  }, [data])

  // Get completed count
  const getCompletedCount = useCallback((): number => {
    if (!data) return 0
    return Object.values(data.checklist_progress).filter(Boolean).length
  }, [data])

  // Get total count
  const getTotalCount = useCallback((): number => {
    return Object.keys(DEFAULT_CHECKLIST).length
  }, [])

  // Check if user needs setup wizard
  const needsWizard = !isLoading && data && !data.has_completed_wizard

  // Check if user is a new user (no checklist progress)
  const isNewUser = !isLoading && data && getCompletedCount() === 0

  return {
    data,
    isLoading,
    error,
    needsWizard,
    isNewUser,
    completeWizard,
    updateChecklist,
    dismissHint,
    isHintDismissed,
    completeTutorial,
    isTutorialCompleted,
    getCompletionPercentage,
    getCompletedCount,
    getTotalCount,
    refetch: fetchOnboarding,
  }
}
