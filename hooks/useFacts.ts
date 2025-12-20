'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Fact, Visibility, FactCategory } from '@/types/living-entity'
import { toast } from 'sonner'

export function useFacts(entityId: string, campaignId: string) {
  const [facts, setFacts] = useState<Fact[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch Facts
  useEffect(() => {
    const fetchFacts = async () => {
      const { data, error } = await supabase
        .from('facts')
        .select('*')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching facts:', error)
      } else {
        setFacts(data || [])
      }
      setLoading(false)
    }

    fetchFacts()
  }, [entityId, supabase])

  // Add Fact (Optimistic)
  const addFact = async (
    content: string,
    category: FactCategory,
    visibility: Visibility
  ) => {
    const tempId = `temp-${Date.now()}`
    const newFact: Fact = {
      id: tempId,
      content,
      category,
      visibility,
      entity_id: entityId,
      campaign_id: campaignId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_current: true,
      source_type: 'manual',
      known_by: [],
    }

    // Optimistic update
    setFacts((prev) => [newFact, ...prev])

    const { data, error } = await supabase
      .from('facts')
      .insert({
        content,
        category,
        visibility,
        entity_id: entityId,
        campaign_id: campaignId,
        source_type: 'manual',
        is_current: true,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add fact')
      setFacts((prev) => prev.filter((f) => f.id !== tempId))
    } else {
      setFacts((prev) => prev.map((f) => (f.id === tempId ? data : f)))
      toast.success('Fact added')
    }

    return { data, error }
  }

  // Toggle Visibility (Optimistic)
  const toggleVisibility = async (
    factId: string,
    currentVisibility: Visibility
  ) => {
    const nextVisibility: Visibility =
      currentVisibility === 'public'
        ? 'dm_only'
        : currentVisibility === 'dm_only'
          ? 'limited'
          : 'public'

    // Optimistic update
    setFacts((prev) =>
      prev.map((f) =>
        f.id === factId ? { ...f, visibility: nextVisibility } : f
      )
    )

    const { error } = await supabase
      .from('facts')
      .update({ visibility: nextVisibility })
      .eq('id', factId)

    if (error) {
      toast.error('Failed to update visibility')
      // Rollback
      setFacts((prev) =>
        prev.map((f) =>
          f.id === factId ? { ...f, visibility: currentVisibility } : f
        )
      )
    }
  }

  // Supersede Fact (mark as outdated)
  const supersedeFact = async (factId: string) => {
    // Optimistic update
    setFacts((prev) =>
      prev.map((f) => (f.id === factId ? { ...f, is_current: false } : f))
    )

    const { error } = await supabase
      .from('facts')
      .update({ is_current: false })
      .eq('id', factId)

    if (error) {
      toast.error('Failed to archive fact')
      // Rollback
      setFacts((prev) =>
        prev.map((f) => (f.id === factId ? { ...f, is_current: true } : f))
      )
    } else {
      toast.success('Fact archived')
    }
  }

  // Restore Fact (bring back from superseded)
  const restoreFact = async (factId: string) => {
    // Optimistic update
    setFacts((prev) =>
      prev.map((f) => (f.id === factId ? { ...f, is_current: true } : f))
    )

    const { error } = await supabase
      .from('facts')
      .update({ is_current: true })
      .eq('id', factId)

    if (error) {
      toast.error('Failed to restore fact')
      // Rollback
      setFacts((prev) =>
        prev.map((f) => (f.id === factId ? { ...f, is_current: false } : f))
      )
    } else {
      toast.success('Fact restored')
    }
  }

  // Delete Fact (Optimistic)
  const deleteFact = async (factId: string) => {
    const oldFacts = [...facts]

    // Optimistic update
    setFacts((prev) => prev.filter((f) => f.id !== factId))

    const { error } = await supabase.from('facts').delete().eq('id', factId)

    if (error) {
      toast.error('Failed to delete fact')
      setFacts(oldFacts)
    } else {
      toast.success('Fact deleted')
    }
  }

  // Computed values
  const activeFacts = facts.filter((f) => f.is_current)
  const supersededFacts = facts.filter((f) => !f.is_current)

  return {
    facts,
    activeFacts,
    supersededFacts,
    loading,
    addFact,
    toggleVisibility,
    supersedeFact,
    restoreFact,
    deleteFact,
  }
}
