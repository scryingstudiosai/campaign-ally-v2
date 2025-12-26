'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, User, Skull, Shield, Loader2, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Forge foundation imports
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EmptyForgeState } from '@/components/forge/EmptyForgeState'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import type { Discovery, Conflict, EntityType } from '@/types/forge'

// NPC-specific components
import {
  NpcInputForm,
  NpcOutputCard,
  type NpcInputData,
  type GeneratedNPC,
} from '@/components/forge/npc'
import { QuickReference } from '@/components/forge/QuickReference'
import { processLootToInventory } from '@/lib/forge/entity-minter'

interface StubContext {
  stubId: string
  name: string
  entityType: string
  sourceEntityId?: string
  sourceEntityName?: string
  snippet?: string
  suggestedTraits?: string[]
}


export default function NpcForgePage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = params.id as string
  const supabase = createClient()

  // Parse stub context from URL params
  const stubId = searchParams.get('stubId')
  const stubName = searchParams.get('name')
  const stubContextRaw = searchParams.get('context')
  const stubContext: StubContext | null = stubContextRaw
    ? JSON.parse(stubContextRaw)
    : null

  // Campaign and profile state
  const [campaignName, setCampaignName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Related entities for dropdowns
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [factions, setFactions] = useState<Array<{ id: string; name: string }>>(
    []
  )

  // Local state for managing discoveries/conflicts during review
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // All entities for linking
  const [allEntities, setAllEntities] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])

  // NPC type (standard, villain, hero)
  const [npcType, setNpcType] = useState<'standard' | 'villain' | 'hero'>('standard')

  // Standard NPC state
  // Pre-populate concept with hook/backstory from stub context (everything after " - ")
  const getInitialConcept = (): string => {
    if (!stubContext?.snippet) return ''
    const parts = stubContext.snippet.split(' - ')
    if (parts.length > 1) {
      // Join everything after the first part (role) as the concept
      return `Flesh out ${stubName}. ${parts.slice(1).join(' - ').trim()}`
    }
    return `Flesh out ${stubName}.`
  }
  const [concept, setConcept] = useState(getInitialConcept)

  // Villain state
  const [villainConcept, setVillainConcept] = useState('')
  const [villainScheme, setVillainScheme] = useState('')
  const [villainResources, setVillainResources] = useState<string[]>([])
  const [threatLevel, setThreatLevel] = useState('regional')
  const [villainEscapePlan, setVillainEscapePlan] = useState('')

  // Hero state
  const [heroConcept, setHeroConcept] = useState('')
  const [heroLimitation, setHeroLimitation] = useState('')
  const [heroLimitationCustom, setHeroLimitationCustom] = useState('')
  const [heroSupportRoles, setHeroSupportRoles] = useState<string[]>([])
  const [heroAvailability, setHeroAvailability] = useState('scheduled')
  const [heroPowerTier, setHeroPowerTier] = useState('equal')

  // Quick Reference - track referenced entities for context injection
  const [referencedEntities, setReferencedEntities] = useState<{ id: string; name: string }[]>([])
  // Store referenced entities at generation time for use during commit
  const [generationReferencedEntities, setGenerationReferencedEntities] = useState<{ id: string; name: string; type?: string; sub_type?: string }[]>([])

  // The forge hook
  const forge = useForge<NpcInputData, GeneratedNPC>({
    campaignId,
    forgeType: 'npc',
    stubId: stubId || undefined, // Skip duplicate check when fleshing out a stub
    generateFn: async (input) => {
      // Call existing API endpoint with existing format
      const response = await fetch('/api/generate/npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.npc
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      return extractTextForScanning({
        appearance: output.appearance,
        personality: output.personality,
        voiceAndMannerisms: output.voiceAndMannerisms,
        motivation: output.motivation,
        secret: output.secret,
        plotHook: output.plotHook,
        loot: output.loot,
        connectionHooks: output.connectionHooks,
      })
    },
    getEntityName: (output) => output.name, // Exclude NPC name from discoveries
  })

  // Sync scan results to local review state
  useEffect(() => {
    if (forge.scanResult) {
      setReviewDiscoveries(forge.scanResult.discoveries)
      setReviewConflicts(forge.scanResult.conflicts)
    }
  }, [forge.scanResult])

  // Fetch initial data
  useEffect(() => {
    async function fetchData(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (campaignError || !campaignData) {
        router.push('/dashboard')
        return
      }

      setCampaignName(campaignData.name)

      // Fetch locations for dropdown
      const { data: locationData } = await supabase
        .from('entities')
        .select('id, name')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .is('deleted_at', null)
        .order('name')

      if (locationData) setLocations(locationData)

      // Fetch factions for dropdown
      const { data: factionData } = await supabase
        .from('entities')
        .select('id, name')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'faction')
        .is('deleted_at', null)
        .order('name')

      if (factionData) setFactions(factionData)

      setLoading(false)
    }

    fetchData()
  }, [campaignId, supabase, router])

  // Fetch all entities for linking
  useEffect(() => {
    async function fetchEntities(): Promise<void> {
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
      if (data) {
        setAllEntities(
          data.map((e) => ({ id: e.id, name: e.name, type: e.entity_type }))
        )
      }
    }
    fetchEntities()
  }, [campaignId, supabase])

  // Handle discovery actions
  const handleDiscoveryAction = (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ): void => {
    setReviewDiscoveries((prev) =>
      prev.map((d) =>
        d.id === discoveryId ? { ...d, status: action, linkedEntityId } : d
      )
    )
  }

  // Handle discovery type changes
  const handleDiscoveryTypeChange = (
    discoveryId: string,
    newType: EntityType
  ): void => {
    setReviewDiscoveries((prev) =>
      prev.map((d) =>
        d.id === discoveryId ? { ...d, suggestedType: newType } : d
      )
    )
  }

  // Handle conflict resolutions
  const handleConflictResolution = (
    conflictId: string,
    resolution: Conflict['resolution']
  ): void => {
    setReviewConflicts((prev) =>
      prev.map((c) => (c.id === conflictId ? { ...c, resolution } : c))
    )
  }

  // Handle manual discovery creation from text selection
  const handleManualDiscovery = (text: string, type: string): void => {
    const newDiscovery: Discovery = {
      id: `manual-${Date.now()}`,
      text,
      suggestedType: type as EntityType,
      context: 'Manually selected by user',
      status: 'pending',
    }
    setReviewDiscoveries((prev) => [...prev, newDiscovery])
  }

  // Handle linking to existing entity from text selection
  const handleLinkExisting = (entityId: string): void => {
    const entity = allEntities.find((e) => e.id === entityId)
    if (entity) {
      const newDiscovery: Discovery = {
        id: `link-${Date.now()}`,
        text: entity.name,
        suggestedType: entity.type as EntityType,
        context: 'Manually linked by user',
        status: 'link_existing',
        linkedEntityId: entityId,
      }
      setReviewDiscoveries((prev) => [...prev, newDiscovery])
    }
  }

  // Handle quick reference entity selection - insert name into concept and track for context
  const handleQuickReferenceSelect = (
    name: string,
    entityId: string,
    targetTab: 'standard' | 'villain' | 'hero' = 'standard'
  ): void => {
    // Insert entity name into the appropriate concept field
    const insertName = (prev: string) =>
      prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + name

    if (targetTab === 'standard') {
      setConcept(insertName)
    } else if (targetTab === 'villain') {
      setVillainConcept(insertName)
    } else if (targetTab === 'hero') {
      setHeroConcept(insertName)
    }

    // Track entity for context injection (if not already tracked)
    if (!referencedEntities.some((e) => e.id === entityId)) {
      setReferencedEntities((prev) => [...prev, { id: entityId, name }])
    }
  }

  // Remove referenced entity
  const handleRemoveReferencedEntity = (entityId: string): void => {
    setReferencedEntities((prev) => prev.filter((e) => e.id !== entityId))
  }

  // Helper function to infer relationship type based on entity types
  const inferRelationshipType = (
    mySubType: string,
    theirType: string,
    theirSubType?: string
  ): string => {
    // Villain relationships
    if (mySubType === 'villain') {
      if (theirType === 'npc' && theirSubType === 'villain') return 'rival_of'
      if (theirType === 'npc' && theirSubType === 'hero') return 'nemesis_of'
      if (theirType === 'npc') return 'threatens'
      if (theirType === 'location') return 'terrorizes'
      if (theirType === 'faction') return 'opposes'
      return 'connected_to'
    }
    // Hero relationships
    if (mySubType === 'hero') {
      if (theirType === 'npc' && theirSubType === 'villain') return 'opposes'
      if (theirType === 'npc' && theirSubType === 'hero') return 'allied_with'
      if (theirType === 'npc') return 'protects'
      if (theirType === 'location') return 'defends'
      if (theirType === 'faction') return 'champions'
      return 'connected_to'
    }
    // Standard NPC relationships
    if (theirType === 'npc') return 'knows'
    if (theirType === 'location') return 'frequents'
    if (theirType === 'faction') return 'affiliated_with'
    if (theirType === 'item') return 'possesses_knowledge_of'
    return 'connected_to'
  }

  // Clear referenced entities after successful generation (but preserve for commit)
  // Only runs when there are entities to clear - prevents infinite loop
  useEffect(() => {
    if (forge.output && referencedEntities.length > 0) {
      // Store referenced entities with their types for relationship creation during commit
      const enrichedEntities = referencedEntities.map((e) => {
        const fullEntity = allEntities.find((ae) => ae.id === e.id)
        return {
          ...e,
          type: fullEntity?.type,
        }
      })
      setGenerationReferencedEntities(enrichedEntities)
      setReferencedEntities([])
    }
  }, [forge.output, referencedEntities, allEntities])

  // Handle commit
  const handleCommit = async (): Promise<void> => {
    if (!forge.output) return

    // If fleshing out a stub, update the existing entity instead of creating new
    if (stubId) {
      try {
        console.log('[NPC Forge] Fleshing out stub:', stubId)
        console.log('[NPC Forge] forge.output:', forge.output?.name, forge.output?.sub_type)

        // Fetch existing stub to get its history and current state
        const { data: existingStub, error: fetchError } = await supabase
          .from('entities')
          .select('id, name, attributes, forge_status')
          .eq('id', stubId)
          .single()

        if (fetchError || !existingStub) {
          console.error('[NPC Forge] Failed to fetch stub:', fetchError)
          toast.error('Failed to find stub entity')
          return
        }

        console.log('[NPC Forge] Existing stub state:', {
          id: existingStub.id,
          name: existingStub.name,
          forge_status: existingStub.forge_status,
        })

        const existingHistory =
          (existingStub?.attributes as Record<string, unknown>)?.history || []

        // Build update payload
        const updatePayload = {
          name: forge.output.name,
          subtype: forge.output.race,
          summary: forge.output.dm_slug || forge.output.dmSlug,
          description: `**Appearance:** ${forge.output.appearance}\n\n**Personality:** ${forge.output.personality}`,
          // New Brain/Voice architecture columns
          sub_type: forge.output.sub_type || 'standard',
          brain: forge.output.brain || {},
          voice: forge.output.voice || {},
          read_aloud: forge.output.read_aloud,
          dm_slug: forge.output.dm_slug || forge.output.dmSlug,
          // Mark as complete (no longer a stub)
          forge_status: 'complete',
          // Legacy attributes (backward compatibility)
          attributes: {
            race: forge.output.race,
            gender: forge.output.gender,
            appearance: forge.output.appearance,
            personality: forge.output.personality,
            voiceAndMannerisms: forge.output.voiceAndMannerisms,
            voiceReference: forge.output.voiceReference,
            motivation: forge.output.motivation,
            secret: forge.output.secret,
            plotHook: forge.output.plotHook,
            loot: forge.output.loot,
            combatStats: forge.output.combatStats,
            connectionHooks: forge.output.connectionHooks,
            is_stub: false,
            needs_review: false,
            history: [
              ...(existingHistory as Array<Record<string, unknown>>),
              {
                event: 'fleshed_out',
                timestamp: new Date().toISOString(),
                note: 'Completed via NPC forge',
              },
            ],
          },
        }

        console.log('[NPC Forge] Update payload forge_status:', updatePayload.forge_status)
        console.log('[NPC Forge] Update payload is_stub:', updatePayload.attributes.is_stub)

        // Update the stub with the generated content
        const { error, count } = await supabase
          .from('entities')
          .update(updatePayload)
          .eq('id', stubId)
          .select('id, forge_status')

        console.log('[NPC Forge] Update result - error:', error, 'count:', count)

        if (error) {
          console.error('[NPC Forge] Update failed:', error)
          toast.error(`Failed to update entity: ${error.message}`)
          return
        }

        // Verify the update worked by checking the entity again
        const { data: verifyEntity } = await supabase
          .from('entities')
          .select('id, name, forge_status, attributes')
          .eq('id', stubId)
          .single()

        console.log('[NPC Forge] Verification after update:', {
          id: verifyEntity?.id,
          name: verifyEntity?.name,
          forge_status: verifyEntity?.forge_status,
          is_stub: (verifyEntity?.attributes as Record<string, unknown>)?.is_stub,
        })

        if (verifyEntity?.forge_status !== 'complete') {
          console.error('[NPC Forge] forge_status not updated! Current value:', verifyEntity?.forge_status)
          toast.error('Update may not have completed properly')
        }

        // Save facts to the facts table (if available)
        const facts = forge.output.facts
        if (facts && Array.isArray(facts) && facts.length > 0) {
          // Valid categories per database constraint
          const validCategories = ['lore', 'plot', 'mechanical', 'secret', 'flavor', 'appearance', 'personality', 'backstory']

          // Map any invalid categories to valid ones
          const mapCategory = (cat: string): string => {
            if (validCategories.includes(cat)) return cat
            // Common mappings for AI-generated categories
            const lowerCat = cat.toLowerCase()
            if (lowerCat.includes('appear')) return 'appearance'
            if (lowerCat.includes('personal')) return 'personality'
            if (lowerCat.includes('secret') || lowerCat.includes('hidden')) return 'secret'
            if (lowerCat.includes('plot') || lowerCat.includes('story')) return 'plot'
            if (lowerCat.includes('back') || lowerCat.includes('history')) return 'backstory'
            if (lowerCat.includes('lore') || lowerCat.includes('world')) return 'lore'
            if (lowerCat.includes('mechanic') || lowerCat.includes('combat') || lowerCat.includes('stat')) return 'mechanical'
            return 'flavor' // Default fallback
          }

          const factRecords = facts.map((fact) => ({
            entity_id: stubId,
            campaign_id: campaignId,
            content: fact.content,
            category: mapCategory(fact.category),
            visibility: fact.visibility || 'dm_only',
            is_current: true,
            source_type: 'generated',
          }))

          const { error: factsError } = await supabase.from('facts').insert(factRecords)

          if (factsError) {
            console.error('Failed to save facts:', factsError)
            // Don't fail the commit - entity was saved successfully
          }
        }

        // Create relationship to source entity if exists
        if (stubContext?.sourceEntityId) {
          await supabase.from('relationships').insert({
            campaign_id: campaignId,
            source_id: stubId,
            target_id: stubContext.sourceEntityId,
            relationship_type: 'mentioned_in',
            description: `First mentioned in ${stubContext.sourceEntityName}`,
          })
        }

        // Auto-create relationships with referenced entities for stubs too
        const mySubType = forge.output?.sub_type || 'standard'
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: stubId,
              target_id: refEntity.id,
              relationship_type: inferRelationshipType(
                mySubType,
                refEntity.type || 'npc',
                refEntity.sub_type
              ),
              surface_description: `Referenced during creation`,
              is_active: true,
            })
          )

          await Promise.allSettled(relationshipPromises)
        }
        setGenerationReferencedEntities([])

        // Process loot into inventory system
        if (forge.output?.loot && forge.output.loot.length > 0) {
          const lootResult = await processLootToInventory(
            supabase,
            campaignId,
            stubId,
            forge.output.name,
            forge.output.loot
          )
          if (lootResult.errors.length > 0) {
            console.error('Loot processing errors:', lootResult.errors)
          }
        }

        toast.success('NPC fleshed out and saved!')
        // Force Next.js to invalidate cache and refetch server data
        router.refresh()
        router.push(`/dashboard/campaigns/${campaignId}/memory/${stubId}`)
      } catch {
        toast.error('Failed to update stub')
      }
    } else {
      // Normal create flow
      const result = await forge.handleCommit({
        discoveries: reviewDiscoveries,
        conflicts: reviewConflicts,
      })

      if (result.success && result.entity) {
        const entity = result.entity as { id: string }
        const mySubType = forge.output?.sub_type || 'standard'

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: entity.id,
              target_id: refEntity.id,
              relationship_type: inferRelationshipType(
                mySubType,
                refEntity.type || 'npc',
                refEntity.sub_type
              ),
              surface_description: `Referenced during creation`,
              is_active: true,
            })
          )

          const relationshipResults = await Promise.allSettled(relationshipPromises)
          const failures = relationshipResults.filter((r) => r.status === 'rejected')
          if (failures.length > 0) {
            console.error('Some relationships failed to create:', failures)
          }
        }

        // Clear generation referenced entities after commit
        setGenerationReferencedEntities([])

        // Process loot into inventory system
        if (forge.output?.loot && forge.output.loot.length > 0) {
          const lootResult = await processLootToInventory(
            supabase,
            campaignId,
            entity.id,
            forge.output.name,
            forge.output.loot
          )
          if (lootResult.errors.length > 0) {
            console.error('Loot processing errors:', lootResult.errors)
          }
        }

        toast.success('NPC saved to Memory!')
        // Force Next.js to invalidate cache and refetch server data
        router.refresh()
        router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`)
      } else if (result.error) {
        toast.error(result.error)
      }
    }
  }

  // Handle generation with toast
  const handleGenerate = async (input: NpcInputData): Promise<void> => {
    // Clear previous discoveries before generating new content
    setReviewDiscoveries([])
    setReviewConflicts([])

    try {
      // Include concept and referenced entity IDs for context injection
      const referencedIds = referencedEntities.map((e) => e.id)
      const inputWithContext = {
        ...input,
        concept: concept.trim() || undefined,
        referencedEntityIds: referencedIds.length > 0 ? referencedIds : undefined,
      }
      const result = await forge.handleGenerate(inputWithContext)
      // Only show success toast if generation actually completed
      if (result.success) {
        toast.success('NPC generated successfully!')
      }
      // Don't show error toast for validation_failed - the UI shows the warnings
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate NPC'
      )
    }
  }

  // Handle villain generation
  const handleGenerateVillain = async (): Promise<void> => {
    if (!villainConcept.trim()) {
      toast.error('Please enter a villain concept')
      return
    }

    // Clear previous discoveries before generating new content
    setReviewDiscoveries([])
    setReviewConflicts([])

    const referencedIds = referencedEntities.map((e) => e.id)

    try {
      const result = await forge.handleGenerate({
        role: villainConcept,
        npcType: 'villain',
        villainInputs: {
          scheme: villainScheme,
          resources: villainResources,
          threatLevel,
          escapePlan: villainEscapePlan,
        },
        referencedEntityIds: referencedIds.length > 0 ? referencedIds : undefined,
      } as NpcInputData)

      if (result.success) {
        toast.success('Villain forged successfully!')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to forge villain'
      )
    }
  }

  // Handle hero generation
  const handleGenerateHero = async (): Promise<void> => {
    if (!heroConcept.trim()) {
      toast.error('Please enter a hero concept')
      return
    }

    // Clear previous discoveries before generating new content
    setReviewDiscoveries([])
    setReviewConflicts([])

    const limitation = heroLimitation === 'other' ? heroLimitationCustom : heroLimitation
    const referencedIds = referencedEntities.map((e) => e.id)

    try {
      const result = await forge.handleGenerate({
        role: heroConcept,
        npcType: 'hero',
        heroInputs: {
          limitation,
          supportRoles: heroSupportRoles,
          availability: heroAvailability,
          powerTier: heroPowerTier,
        },
        referencedEntityIds: referencedIds.length > 0 ? referencedIds : undefined,
      } as NpcInputData)

      if (result.success) {
        toast.success('Hero forged successfully!')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to forge hero'
      )
    }
  }

  // Handle discard - clear discoveries and reset forge
  const handleDiscard = (): void => {
    setReviewDiscoveries([])
    setReviewConflicts([])
    forge.reset()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ForgeShell
      title={stubContext ? `Flesh Out: ${stubName}` : 'NPC Forge'}
      description={
        stubContext
          ? 'Complete this stub entity with full details'
          : 'Generate unique NPCs with personality, secrets, and plot hooks'
      }
      status={forge.status}
      backHref={`/dashboard/campaigns/${campaignId}`}
      backLabel={`Back to ${campaignName}`}
      inputSection={
        <>
          {/* Stub Context Banner */}
          {stubContext && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                Fleshing out: {stubName}
              </div>
              {stubContext.sourceEntityName && (
                <p className="text-sm text-slate-300">
                  Origin:{' '}
                  <span className="text-teal-400">
                    {stubContext.sourceEntityName}
                  </span>
                </p>
              )}
              {stubContext.snippet && (
                <p className="text-sm text-slate-400 mt-1 italic">
                  &quot;{stubContext.snippet.substring(0, 150)}
                  {stubContext.snippet.length > 150 ? '...' : ''}&quot;
                </p>
              )}
              {stubContext.suggestedTraits &&
                stubContext.suggestedTraits.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {stubContext.suggestedTraits.map((trait: string) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* NPC Type Tabs */}
          <Tabs
            value={npcType}
            onValueChange={(v) => setNpcType(v as typeof npcType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="standard" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Standard
              </TabsTrigger>
              <TabsTrigger value="villain" className="flex items-center gap-2">
                <Skull className="w-4 h-4" />
                Villain
              </TabsTrigger>
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Hero
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              {/* Concept / Situation field with integrated QuickReference */}
              <div className="ca-panel p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="concept">Concept / Situation</Label>
                  <Textarea
                    id="concept"
                    placeholder="A nervous merchant recently threatened by a local gang... A retired soldier haunted by a past mistake..."
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="min-h-[80px] bg-slate-900/50 border-slate-700"
                    disabled={forge.status !== 'idle' && forge.status !== 'error'}
                  />
                  <p className="text-xs text-slate-500">
                    Describe the situation, connections, or story hooks for this NPC
                  </p>
                </div>

                {/* Quick Reference - click to insert entity names */}
                <QuickReference
                  campaignId={campaignId}
                  onSelect={(name, entityId) => handleQuickReferenceSelect(name, entityId, 'standard')}
                  excludeIds={referencedEntities.map((e) => e.id)}
                />
              </div>

              {/* Standard NPC form */}
              <NpcInputForm
                onSubmit={handleGenerate}
                isLocked={forge.status !== 'idle' && forge.status !== 'error'}
                preValidation={forge.preValidation}
                onProceedAnyway={forge.proceedAnyway}
                existingLocations={locations}
                existingFactions={factions}
                initialValues={
                  stubContext
                    ? {
                        name: stubName || '',
                        // Extract just the role (before " - ") for the role field
                        slug: stubContext.snippet?.split(' - ')[0]?.trim() || '',
                      }
                    : undefined
                }
                conceptProvided={!!concept.trim()}
              />
            </TabsContent>

            <TabsContent value="villain" className="space-y-4">
              {/* Villain-specific inputs */}
              <div className="ca-panel p-4 space-y-4">
                {/* The Concept */}
                <div className="space-y-2">
                  <Label htmlFor="villainConcept">Villain Concept</Label>
                  <Textarea
                    id="villainConcept"
                    placeholder="A corrupt noble who secretly controls the thieves guild..."
                    value={villainConcept}
                    onChange={(e) => setVillainConcept(e.target.value)}
                    className="min-h-[80px] bg-slate-900/50 border-slate-700"
                    disabled={forge.status !== 'idle' && forge.status !== 'error'}
                  />
                  <p className="text-xs text-slate-500">
                    Click entities below to reference them in your villain&apos;s story
                  </p>
                  <QuickReference
                    campaignId={campaignId}
                    onSelect={(name, entityId) => handleQuickReferenceSelect(name, entityId, 'villain')}
                    excludeIds={referencedEntities.map((e) => e.id)}
                  />
                </div>

                {/* The Master Plan (Scheme) */}
                <div className="space-y-2">
                  <Label htmlFor="scheme">The Master Plan</Label>
                  <Textarea
                    id="scheme"
                    placeholder="Summon a demon, overthrow the king, monopolize the grain trade..."
                    value={villainScheme}
                    onChange={(e) => setVillainScheme(e.target.value)}
                    className="min-h-[60px] bg-slate-900/50 border-slate-700"
                  />
                  <p className="text-xs text-slate-500">What is their active goal right now?</p>
                </div>

                {/* The Power Source (Resources) */}
                <div className="space-y-2">
                  <Label>Power Source</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Magic', 'Wealth', 'Political Power', 'Brute Force', 'Cult/Minions', 'Knowledge', 'Fear'].map((resource) => (
                      <button
                        key={resource}
                        type="button"
                        onClick={() => {
                          setVillainResources(prev =>
                            prev.includes(resource)
                              ? prev.filter(r => r !== resource)
                              : [...prev, resource]
                          )
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition-colors',
                          villainResources.includes(resource)
                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {resource}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">How do they enforce their will? (Select multiple)</p>
                </div>

                {/* Threat Level */}
                <div className="space-y-2">
                  <Label htmlFor="threatLevel">Threat Level</Label>
                  <Select value={threatLevel} onValueChange={setThreatLevel}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select threat level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Nuisance - Affects a village or neighborhood</SelectItem>
                      <SelectItem value="regional">Regional Threat - Affects a city or region</SelectItem>
                      <SelectItem value="kingdom">Kingdom Threat - Affects the entire realm</SelectItem>
                      <SelectItem value="world">World Threat - Apocalyptic stakes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* The Failsafe (Escape Plan) - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="escapePlan">Escape Plan (Optional)</Label>
                  <Input
                    id="escapePlan"
                    placeholder="Teleportation ring, body double, holds a hostage..."
                    value={villainEscapePlan}
                    onChange={(e) => setVillainEscapePlan(e.target.value)}
                    className="bg-slate-900/50 border-slate-700"
                  />
                  <p className="text-xs text-slate-500">How do they escape when beaten? Leave blank for AI to invent one.</p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateVillain}
                  disabled={forge.status === 'generating' || forge.status === 'validating' || !villainConcept.trim()}
                  className="w-full ca-btn ca-btn-primary"
                >
                  {forge.status === 'generating' || forge.status === 'validating' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Forging Villain...
                    </>
                  ) : (
                    <>
                      <Skull className="w-4 h-4 mr-2" />
                      Forge Villain
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="space-y-4">
              {/* Hero-specific inputs */}
              <div className="ca-panel p-4 space-y-4">
                {/* The Concept */}
                <div className="space-y-2">
                  <Label htmlFor="heroConcept">Hero Concept</Label>
                  <Textarea
                    id="heroConcept"
                    placeholder="A retired adventurer who runs the local tavern, a young squire with a noble heart..."
                    value={heroConcept}
                    onChange={(e) => setHeroConcept(e.target.value)}
                    className="min-h-[80px] bg-slate-900/50 border-slate-700"
                    disabled={forge.status !== 'idle' && forge.status !== 'error'}
                  />
                  <p className="text-xs text-slate-500">
                    Click entities below to reference them in your hero&apos;s story
                  </p>
                  <QuickReference
                    campaignId={campaignId}
                    onSelect={(name, entityId) => handleQuickReferenceSelect(name, entityId, 'hero')}
                    excludeIds={referencedEntities.map((e) => e.id)}
                  />
                </div>

                {/* The Limitation (Why they can't solve the plot) */}
                <div className="space-y-2">
                  <Label>The Limitation</Label>
                  <p className="text-xs text-slate-500 mb-2">Why can&apos;t they solve the problem themselves?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'old_injured', label: 'Too Old / Injured', desc: 'Past their prime, body failing' },
                      { value: 'cursed', label: 'Cursed', desc: 'Magical restriction prevents action' },
                      { value: 'oath_bound', label: 'Bound by Oath', desc: 'Sworn vow limits what they can do' },
                      { value: 'political', label: 'Political Constraints', desc: 'Action would cause diplomatic crisis' },
                      { value: 'protecting', label: 'Must Protect Something', desc: 'Cannot leave their charge' },
                      { value: 'hunted', label: 'Hunted / In Hiding', desc: 'Drawing attention means death' },
                      { value: 'powerless', label: 'Lost Their Power', desc: 'Once mighty, now diminished' },
                      { value: 'other', label: 'Other', desc: 'Custom limitation' },
                    ].map((limitation) => (
                      <button
                        key={limitation.value}
                        type="button"
                        onClick={() => setHeroLimitation(limitation.value)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-colors',
                          heroLimitation === limitation.value
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        <div className="font-medium text-sm">{limitation.label}</div>
                        <div className="text-xs opacity-70">{limitation.desc}</div>
                      </button>
                    ))}
                  </div>
                  {heroLimitation === 'other' && (
                    <Input
                      placeholder="Describe their limitation..."
                      value={heroLimitationCustom}
                      onChange={(e) => setHeroLimitationCustom(e.target.value)}
                      className="mt-2 bg-slate-900/50 border-slate-700"
                    />
                  )}
                </div>

                {/* The Support Role (How they help) */}
                <div className="space-y-2">
                  <Label>Support Role</Label>
                  <p className="text-xs text-slate-500 mb-2">What do they offer the party?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Knowledge / Lore',
                      'Safe Haven',
                      'Healing',
                      'Political Access',
                      'Rare Items',
                      'Combat Training',
                      'Information Network',
                      'Transportation',
                      'Magical Aid',
                    ].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setHeroSupportRoles(prev =>
                            prev.includes(role)
                              ? prev.filter(r => r !== role)
                              : [...prev, role]
                          )
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition-colors',
                          heroSupportRoles.includes(role)
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select value={heroAvailability} onValueChange={setHeroAvailability}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="How often can they help?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always Available - Lives nearby, easy to reach</SelectItem>
                      <SelectItem value="scheduled">By Appointment - Busy but can be scheduled</SelectItem>
                      <SelectItem value="emergency">Emergencies Only - Has own responsibilities</SelectItem>
                      <SelectItem value="once">One-Time Help - After this, they&apos;re unavailable</SelectItem>
                      <SelectItem value="random">Unpredictable - Shows up when least expected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Power Tier */}
                <div className="space-y-2">
                  <Label htmlFor="powerTier">Power Level (Relative to Party)</Label>
                  <Select value={heroPowerTier} onValueChange={setHeroPowerTier}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="How powerful are they?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weaker">Weaker - Needs party&apos;s protection sometimes</SelectItem>
                      <SelectItem value="equal">Equal - Peer to the party</SelectItem>
                      <SelectItem value="stronger">Stronger - Could solve problems but won&apos;t/can&apos;t</SelectItem>
                      <SelectItem value="legendary">Legendary - Famous hero, way above party level</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Stronger heroes need stronger limitations to explain why they don&apos;t just fix everything.</p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateHero}
                  disabled={forge.status === 'generating' || forge.status === 'validating' || !heroConcept.trim()}
                  className="w-full ca-btn ca-btn-primary"
                >
                  {forge.status === 'generating' || forge.status === 'validating' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Forging Hero...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Forge Hero
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Show tracked context entities */}
          {referencedEntities.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Context from:</span>
                {referencedEntities.map((entity) => (
                  <span
                    key={entity.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
                  >
                    {entity.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveReferencedEntity(entity.id)}
                      className="text-slate-500 hover:text-red-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                These entities will be included in the AI context for world-consistent generation.
              </p>
            </div>
          )}
        </>
      }
      outputSection={
        forge.output ? (
          <NpcOutputCard
            data={forge.output}
            scanResult={forge.scanResult}
            campaignId={campaignId}
            onDiscoveryAction={handleDiscoveryAction}
            onManualDiscovery={handleManualDiscovery}
            onLinkExisting={handleLinkExisting}
            existingEntities={allEntities}
          />
        ) : (
          <EmptyForgeState
            forgeType="NPC"
            description='Enter the NPC&apos;s role on the left and click "Generate NPC" to bring them to life.'
          />
        )
      }
      commitPanel={
        (forge.status === 'review' || forge.status === 'saving') && forge.scanResult ? (
          <CommitPanel
            scanResult={{
              ...forge.scanResult,
              discoveries: reviewDiscoveries,
              conflicts: reviewConflicts,
            }}
            onDiscoveryAction={handleDiscoveryAction}
            onDiscoveryTypeChange={handleDiscoveryTypeChange}
            onConflictResolution={handleConflictResolution}
            onCommit={handleCommit}
            onDiscard={handleDiscard}
            isCommitting={forge.status === 'saving'}
          />
        ) : undefined
      }
    />
  )
}
