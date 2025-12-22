'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

// Forge foundation imports
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EmptyForgeState } from '@/components/forge/EmptyForgeState'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import type { Discovery, Conflict, EntityType } from '@/types/forge'

// Location-specific components
import {
  LocationInputForm,
  LocationOutputCard,
  type LocationInputData,
  type GeneratedLocation,
} from '@/components/forge/location'

interface StubContext {
  stubId: string
  name: string
  entityType: string
  sourceEntityId?: string
  sourceEntityName?: string
  snippet?: string
  suggestedTraits?: string[]
}

export default function LocationForgePage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = params.id as string
  const supabase = createClient()

  // Parse URL params
  const stubId = searchParams.get('stubId')
  const stubName = searchParams.get('name')
  const contextRaw = searchParams.get('context')

  // Parse context
  const parsedContext = contextRaw ? JSON.parse(contextRaw) : null
  const stubContext: StubContext | null = stubId && parsedContext ? parsedContext : null

  // Campaign state
  const [campaignName, setCampaignName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Local state for managing discoveries/conflicts during review
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // All entities for linking
  const [allEntities, setAllEntities] = useState<
    Array<{ id: string; name: string; type: string; sub_type?: string }>
  >([])

  // Store referenced entities at generation time for use during commit
  const [generationReferencedEntities, setGenerationReferencedEntities] = useState<
    { id: string; name: string; type?: string; sub_type?: string }[]
  >([])

  // The forge hook
  const forge = useForge<LocationInputData, GeneratedLocation>({
    campaignId,
    forgeType: 'location',
    stubId: stubId || undefined,
    generateFn: async (input) => {
      const response = await fetch('/api/generate/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.location
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      return extractTextForScanning({
        read_aloud: output.read_aloud,
        dm_slug: output.dm_slug,
        purpose: output.brain?.purpose,
        history: output.brain?.history,
        secret: output.brain?.secret,
        conflict: output.brain?.conflict,
        opportunity: output.brain?.opportunity,
      })
    },
    getEntityName: (output) => output.name,
  })

  // Sync scan results to local review state
  // IMPORTANT: This must MERGE with contains discoveries, not replace them
  useEffect(() => {
    if (forge.scanResult) {
      setReviewDiscoveries((prev) => {
        // Keep any contains discoveries that were already added
        const containsDiscoveries = prev.filter((d) => d.id.startsWith('contains-'))
        // Merge scan discoveries with contains discoveries, avoiding duplicates
        const scanDiscoveries = forge.scanResult!.discoveries.filter((scanD) =>
          !containsDiscoveries.some((cd) => cd.text.toLowerCase() === scanD.text.toLowerCase())
        )
        return [...scanDiscoveries, ...containsDiscoveries]
      })
      setReviewConflicts(forge.scanResult.conflicts)
    }
  }, [forge.scanResult])

  // Sync "contains" sub-locations to discoveries so users can review/ignore them
  useEffect(() => {
    if (forge.output?.brain?.contains && forge.output.brain.contains.length > 0) {
      const containsNames = forge.output.brain.contains as string[]

      setReviewDiscoveries((prev) => {
        // Avoid duplicates - check both existing discoveries and existing entities
        const existingDiscoveryTexts = new Set(prev.map((d) => d.text.toLowerCase()))
        const existingEntityNames = new Set(allEntities.map((e) => e.name.toLowerCase()))

        const newContainsDiscoveries: Discovery[] = []

        containsNames.forEach((rawName) => {
          // Clean the name: remove " - description" suffix if present
          const cleanName = rawName.includes(' - ')
            ? rawName.split(' - ')[0].trim()
            : rawName.trim()

          if (!cleanName) return

          const nameLower = cleanName.toLowerCase()
          const isDuplicate = existingDiscoveryTexts.has(nameLower) || existingEntityNames.has(nameLower)

          if (!isDuplicate) {
            newContainsDiscoveries.push({
              id: `contains-${cleanName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              text: cleanName,
              suggestedType: 'location' as EntityType,
              context: `Sub-location within ${forge.output?.name}`,
              status: 'pending',
            })
            // Add to set to prevent duplicates within the same contains array
            existingDiscoveryTexts.add(nameLower)
          }
        })

        if (newContainsDiscoveries.length > 0) {
          return [...prev, ...newContainsDiscoveries]
        }
        return prev
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forge.output?.brain?.contains, forge.output?.name])

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
      setLoading(false)
    }

    fetchData()
  }, [campaignId, supabase, router])

  // Fetch all entities for linking
  useEffect(() => {
    async function fetchEntities(): Promise<void> {
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
      if (data) {
        setAllEntities(
          data.map((e) => ({ id: e.id, name: e.name, type: e.entity_type, sub_type: e.sub_type }))
        )
      }
    }
    fetchEntities()
  }, [campaignId, supabase])

  // Capture referenced entities when generation completes
  useEffect(() => {
    if (forge.output && forge.status === 'review') {
      const inputData = forge.input as Record<string, unknown> | null
      const referencedEntityIds = (inputData?.referencedEntityIds as string[]) || []

      if (referencedEntityIds.length > 0) {
        const enrichedEntities = referencedEntityIds.map((id) => {
          const fullEntity = allEntities.find((e) => e.id === id)
          return {
            id,
            name: fullEntity?.name || 'Unknown',
            type: fullEntity?.type,
            sub_type: fullEntity?.sub_type,
          }
        })
        setGenerationReferencedEntities(enrichedEntities)
      }
    }
  }, [forge.output, forge.status, forge.input, allEntities])

  // Helper function to infer sub-location type based on parent type
  const inferSubLocationType = (parentType: string): string => {
    const hierarchy: Record<string, string> = {
      region: 'settlement',
      settlement: 'district',
      district: 'building',
      building: 'room',
      dungeon: 'room',
      landmark: 'room',
      room: 'room',
    }
    return hierarchy[parentType] || 'landmark'
  }

  // Helper function to infer relationship type for locations
  const inferLocationRelationshipType = (
    locationSubType: string,
    theirType: string,
    theirSubType?: string
  ): string => {
    if (theirType === 'npc') {
      return 'inhabited_by'
    }
    if (theirType === 'location') {
      return 'connected_to'
    }
    if (theirType === 'faction') {
      return 'controlled_by'
    }
    if (theirType === 'item') {
      return 'contains'
    }
    return 'connected_to'
  }

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

  // Handle commit
  const handleCommit = async (): Promise<void> => {
    if (!forge.output) return

    // If fleshing out a stub, update the existing entity instead of creating new
    if (stubId) {
      try {
        const { data: existingStub } = await supabase
          .from('entities')
          .select('attributes')
          .eq('id', stubId)
          .single()

        const existingHistory =
          (existingStub?.attributes as Record<string, unknown>)?.history || []

        const locationSubType = forge.output.sub_type || 'building'

        // Build the update object for logging
        const updateData = {
          name: forge.output.name,
          sub_type: locationSubType,
          brain: forge.output.brain || {},
          soul: forge.output.soul || {},
          mechanics: forge.output.mechanics || {},
          read_aloud: forge.output.read_aloud,
          dm_slug: forge.output.dm_slug,
          summary: forge.output.dm_slug || forge.output.read_aloud?.substring(0, 200),
          attributes: {
            is_stub: false,
            needs_review: false,
            history: [
              ...(existingHistory as Array<Record<string, unknown>>),
              {
                event: 'fleshed_out',
                timestamp: new Date().toISOString(),
                note: 'Completed via Location Forge',
              },
            ],
          },
        }

        const { error } = await supabase
          .from('entities')
          .update(updateData)
          .eq('id', stubId)

        if (error) {
          toast.error('Failed to update entity')
          return
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

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: stubId,
              target_id: refEntity.id,
              relationship_type: inferLocationRelationshipType(
                locationSubType,
                refEntity.type || 'npc',
                refEntity.sub_type
              ),
              surface_description: 'Referenced during creation',
              is_active: true,
            })
          )

          await Promise.allSettled(relationshipPromises)
        }
        setGenerationReferencedEntities([])

        // Create stubs from approved discoveries (for stub flesh-out path)
        // Filter for discoveries that should become stubs
        const stubDiscoveries = reviewDiscoveries.filter(
          (d) => d.status === 'create_stub' || d.status === 'pending'
        )

        let createdStubCount = 0
        if (stubDiscoveries.length > 0) {
          // Check for existing entities with these names
          const discoveryNames = stubDiscoveries.map((d) => d.text)
          const { data: existingEntities } = await supabase
            .from('entities')
            .select('name')
            .eq('campaign_id', campaignId)
            .in('name', discoveryNames)
            .is('deleted_at', null)

          const existingNames = new Set(
            existingEntities?.map((e) => e.name.toLowerCase()) || []
          )

          // Filter out discoveries that already exist as entities
          const newDiscoveries = stubDiscoveries.filter(
            (d) => !existingNames.has(d.text.toLowerCase())
          )

          if (newDiscoveries.length > 0) {
            const stubEntities = newDiscoveries.map((d) => ({
              campaign_id: campaignId,
              entity_type: d.suggestedType || 'location',
              sub_type: d.suggestedType === 'location' ? 'building' : undefined,
              name: d.text,
              summary: d.context || `Referenced in ${forge.output?.name}`,
              status: 'active',
              importance_tier: 'minor',
              visibility: 'dm_only',
              attributes: {
                is_stub: true,
                needs_review: true,
                source_entity_id: stubId,
                source_entity_name: forge.output?.name,
              },
            }))

            const { data: createdStubs } = await supabase
              .from('entities')
              .insert(stubEntities)
              .select()

            if (createdStubs && createdStubs.length > 0) {
              createdStubCount = createdStubs.length

              // Create relationships for each stub
              const relationshipPromises = createdStubs.map((stub) => {
                // Check if this discovery came from "contains"
                const discovery = newDiscoveries.find(
                  (d) => d.text.toLowerCase() === stub.name.toLowerCase()
                )
                const isContains = discovery?.id?.startsWith('contains-')

                return supabase.from('relationships').insert({
                  campaign_id: campaignId,
                  source_id: stubId,
                  target_id: stub.id,
                  relationship_type: isContains ? 'contains' : 'related_to',
                  description: isContains ? 'Sub-location' : 'Discovered via Location Forge',
                  is_active: true,
                })
              })

              await Promise.allSettled(relationshipPromises)
            }
          }
        }

        if (createdStubCount > 0) {
          toast.success(`Location fleshed out! ${createdStubCount} stub${createdStubCount > 1 ? 's' : ''} created.`)
        } else {
          toast.success('Location fleshed out and saved!')
        }

        forge.reset()
        router.push(`/dashboard/campaigns/${campaignId}/memory/${stubId}`)
        router.refresh()
      } catch {
        toast.error('Failed to update stub')
      }
    } else {
      // Normal create flow - uses useForge.handleCommit → entity-minter.ts
      const result = await forge.handleCommit({
        discoveries: reviewDiscoveries,
        conflicts: reviewConflicts,
      })

      if (result.success && result.entity) {
        const entity = result.entity as { id: string }
        const locationSubType = forge.output?.sub_type || 'building'

        // Handle parent location relationship
        const inputData = forge.input as Record<string, unknown> | null
        const parentLocationId = inputData?.parentLocationId as string | undefined
        if (parentLocationId && parentLocationId !== 'standalone') {
          await supabase.from('relationships').insert({
            campaign_id: campaignId,
            source_id: entity.id,
            target_id: parentLocationId,
            relationship_type: 'located_within',
            surface_description: 'Contained within parent location',
            intensity: 'high',
            visibility: 'public',
            is_active: true,
          })
        }

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: entity.id,
              target_id: refEntity.id,
              relationship_type: inferLocationRelationshipType(
                locationSubType,
                refEntity.type || 'npc',
                refEntity.sub_type
              ),
              surface_description: 'Referenced during creation',
              is_active: true,
            })
          )

          await Promise.allSettled(relationshipPromises)
        }

        setGenerationReferencedEntities([])

        // Stubs and their relationships are now created by entity-minter.ts
        // Contains stubs get 'contains' relationship, others get 'related_to'
        if (result.stubs && result.stubs.length > 0) {
          const stubCount = result.stubs.length
          toast.success(`Location saved! ${stubCount} stub${stubCount > 1 ? 's' : ''} created.`)
        } else {
          toast.success('Location saved to Memory!')
        }

        forge.reset()
        router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`)
        router.refresh()
      } else if (result.error) {
        toast.error(result.error)
      }
    }
  }

  // Handle generation with toast
  const handleGenerate = async (input: LocationInputData): Promise<void> => {
    try {
      const result = await forge.handleGenerate(input)
      if (result.success) {
        toast.success('Location generated successfully!')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate Location'
      )
    }
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

  const forgeTitle = stubContext ? `Flesh Out: ${stubName}` : 'Location Forge'
  const forgeDescription = stubContext
    ? 'Complete this stub entity with full details'
    : 'Create immersive locations with atmosphere, secrets, and game mechanics'

  return (
    <ForgeShell
      title={forgeTitle}
      description={forgeDescription}
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
                  <span className="text-teal-400">{stubContext.sourceEntityName}</span>
                </p>
              )}
              {stubContext.snippet && (
                <p className="text-sm text-slate-400 mt-1 italic">
                  &quot;{stubContext.snippet.substring(0, 150)}
                  {stubContext.snippet.length > 150 ? '...' : ''}&quot;
                </p>
              )}
              {stubContext.suggestedTraits && stubContext.suggestedTraits.length > 0 && (
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

          <LocationInputForm
            onSubmit={handleGenerate}
            isLocked={forge.status !== 'idle' && forge.status !== 'error'}
            preValidation={forge.preValidation}
            onProceedAnyway={forge.proceedAnyway}
            campaignId={campaignId}
            initialValues={
              stubContext
                ? {
                    name: stubName || '',
                    concept: `Flesh out ${stubName}. ${stubContext.snippet || ''}`,
                  }
                : undefined
            }
          />
        </>
      }
      outputSection={
        forge.output ? (
          <LocationOutputCard
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
            forgeType="Location"
            description='Enter the location&apos;s concept on the left and click "Forge" to create it.'
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
            onDiscard={forge.reset}
            isCommitting={forge.status === 'saving'}
          />
        ) : undefined
      }
    />
  )
}
