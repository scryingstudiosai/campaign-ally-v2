'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Backpack } from 'lucide-react'

// Forge foundation imports
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EmptyForgeState } from '@/components/forge/EmptyForgeState'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import type { Discovery, Conflict, EntityType } from '@/types/forge'

// Item-specific components
import {
  ItemInputForm,
  ItemOutputCard,
  type ItemInputData,
  type GeneratedItem,
} from '@/components/forge/item'

interface StubContext {
  stubId: string
  name: string
  entityType: string
  sourceEntityId?: string
  sourceEntityName?: string
  snippet?: string
  suggestedTraits?: string[]
}

interface LootContext {
  fromLoot: boolean
  sourceEntityId: string
  sourceEntityName: string
  sourceEntityType: string
  originalLootText: string
  snippet?: string
}


export default function ItemForgePage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = params.id as string
  const supabase = createClient()

  // Parse URL params
  const stubId = searchParams.get('stubId')
  const stubName = searchParams.get('name')
  const lootName = searchParams.get('lootName')
  const lootOwnerId = searchParams.get('ownerId')
  const contextRaw = searchParams.get('context')

  // Parse context and determine type based on URL params
  // stubId indicates stub context, lootName indicates loot context
  const parsedContext = contextRaw ? JSON.parse(contextRaw) : null

  const stubContext: StubContext | null =
    stubId && parsedContext ? parsedContext : null

  const lootContext: LootContext | null =
    lootName && !stubId && parsedContext ? parsedContext : null

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
  const forge = useForge<ItemInputData, GeneratedItem>({
    campaignId,
    forgeType: 'item',
    stubId: stubId || undefined, // Skip duplicate check when fleshing out a stub
    generateFn: async (input) => {
      // Call existing API endpoint with existing format
      const response = await fetch('/api/generate/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.item
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      return extractTextForScanning({
        public_description: output.public_description,
        secret_description: output.secret_description,
        origin_history: output.origin_history,
        secret: output.secret,
      })
    },
    getEntityName: (output) => output.name, // Exclude item name from discoveries
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
      // Get referencedEntityIds from the input
      const inputData = forge.input as Record<string, unknown> | null
      const referencedEntityIds = (inputData?.referencedEntityIds as string[]) || []

      if (referencedEntityIds.length > 0) {
        // Enrich with type/sub_type from allEntities
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

  // Helper function to infer relationship type for items
  const inferItemRelationshipType = (
    itemSubType: string,
    theirType: string,
    theirSubType?: string
  ): string => {
    // Item-specific relationship types
    if (theirType === 'npc') {
      if (theirSubType === 'villain') return 'wielded_by'
      return 'owned_by'
    }
    if (theirType === 'location') {
      return 'found_at'
    }
    if (theirType === 'faction') {
      return 'relic_of'
    }
    if (theirType === 'item') {
      if (itemSubType === 'artifact' || theirSubType === 'artifact') return 'paired_with'
      return 'connected_to'
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
        // Fetch existing stub to get its history
        const { data: existingStub } = await supabase
          .from('entities')
          .select('attributes')
          .eq('id', stubId)
          .single()

        const existingHistory =
          (existingStub?.attributes as Record<string, unknown>)?.history || []

        // Update the stub with the generated content (including brain/voice/mechanics)
        const itemSubType = forge.output.sub_type || 'standard'
        const { error } = await supabase
          .from('entities')
          .update({
            name: forge.output.name,
            sub_type: itemSubType,
            brain: forge.output.brain || {},
            voice: forge.output.voice || null,
            mechanics: forge.output.mechanics || {},  // Item mechanics
            read_aloud: forge.output.read_aloud,
            dm_slug: forge.output.dm_slug || forge.output.dmSlug,
            subtype: forge.output.item_type || forge.output.category,
            summary: forge.output.public_description?.substring(0, 200),
            description: `**Public Description:** ${forge.output.public_description}\n\n**Secret Description:** ${forge.output.secret_description}`,
            attributes: {
              item_type: forge.output.item_type || forge.output.category,
              category: forge.output.category,
              rarity: forge.output.rarity,
              magical_aura: forge.output.magical_aura,
              public_description: forge.output.public_description,
              secret_description: forge.output.secret_description,
              origin_history: forge.output.origin_history,
              secret: forge.output.secret,
              mechanical_properties: forge.output.mechanical_properties,
              value_gp: forge.output.value_gp,
              weight: forge.output.weight,
              is_stub: false,
              needs_review: false,
              history: [
                ...(existingHistory as Array<Record<string, unknown>>),
                {
                  event: 'fleshed_out',
                  timestamp: new Date().toISOString(),
                  note: 'Completed via Item forge',
                },
              ],
            },
          })
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

        // Auto-create relationships with referenced entities for stubs too
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: stubId,
              target_id: refEntity.id,
              relationship_type: inferItemRelationshipType(
                itemSubType,
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

        toast.success('Item fleshed out and saved!')
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
        const itemSubType = forge.output?.sub_type || 'standard'

        // If forging from loot, create owned_by relationship
        if (lootContext && lootOwnerId) {
          await supabase.from('relationships').insert({
            campaign_id: campaignId,
            source_id: entity.id,
            target_id: lootOwnerId,
            relationship_type: 'owned_by',
            description: `Carried by ${lootContext.sourceEntityName}`,
          })
        }

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: entity.id,
              target_id: refEntity.id,
              relationship_type: inferItemRelationshipType(
                itemSubType,
                refEntity.type || 'npc',
                refEntity.sub_type
              ),
              surface_description: 'Referenced during creation',
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

        toast.success('Item saved to Memory!')
        // Navigate to the new entity
        router.push(
          `/dashboard/campaigns/${campaignId}/memory/${entity.id}`
        )
      } else if (result.error) {
        toast.error(result.error)
      }
    }
  }

  // Handle generation with toast
  const handleGenerate = async (input: ItemInputData): Promise<void> => {
    try {
      const result = await forge.handleGenerate(input)
      // Only show success toast if generation actually completed
      if (result.success) {
        toast.success('Item generated successfully!')
      }
      // Don't show error toast for validation_failed - the UI shows the warnings
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate Item'
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

  // Determine title and description based on context
  const forgeTitle = stubContext
    ? `Flesh Out: ${stubName}`
    : lootContext
      ? `Forge from Loot`
      : 'Item Forge'

  const forgeDescription = stubContext
    ? 'Complete this stub entity with full details'
    : lootContext
      ? `Create a detailed item from ${lootContext.sourceEntityName}'s loot`
      : 'Generate unique items with dual player/DM descriptions'

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

          {/* Loot Context Banner */}
          {lootContext && (
            <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-teal-400 font-medium mb-2">
                <Backpack className="w-4 h-4" />
                Forging from loot: {lootName}
              </div>
              <p className="text-sm text-slate-300">
                Owner:{' '}
                <span className="text-amber-400">
                  {lootContext.sourceEntityName}
                </span>
              </p>
              {lootContext.originalLootText && (
                <p className="text-sm text-slate-400 mt-1 italic">
                  Original: &quot;{lootContext.originalLootText}&quot;
                </p>
              )}
            </div>
          )}

          <ItemInputForm
            onSubmit={handleGenerate}
            isLocked={forge.status !== 'idle' && forge.status !== 'error'}
            preValidation={forge.preValidation}
            onProceedAnyway={forge.proceedAnyway}
            campaignId={campaignId}
            initialValues={
              stubContext
                ? {
                    name: stubName || '',
                    dmSlug: `Flesh out ${stubName}. ${stubContext.snippet || ''}`,
                  }
                : lootContext
                  ? {
                      name: lootName || '',
                      dmSlug: lootName
                        ? `${lootName} - carried by ${lootContext.sourceEntityName}`
                        : `Item carried by ${lootContext.sourceEntityName}`,
                      ownerId: lootOwnerId || undefined,
                      ownerName: lootContext.sourceEntityName,
                    }
                  : undefined
            }
            lockedOwnerId={lootOwnerId || undefined}
          />
        </>
      }
      outputSection={
        forge.output ? (
          <ItemOutputCard
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
            forgeType="Item"
            description='Enter the item&apos;s concept on the left and click "Generate Item" to forge it.'
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
