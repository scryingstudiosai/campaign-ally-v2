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

interface Profile {
  generations_used: number
  subscription_tier: string
}

const GENERATION_LIMITS: Record<string, number> = {
  free: 50,
  pro: 500,
  legendary: 9999,
}

export default function ItemForgePage(): JSX.Element {
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
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [generationsLimit, setGenerationsLimit] = useState(50)

  // Local state for managing discoveries/conflicts during review
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // All entities for linking
  const [allEntities, setAllEntities] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])

  // The forge hook
  const forge = useForge<ItemInputData, GeneratedItem>({
    campaignId,
    forgeType: 'item',
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

      // Update generation count from response
      if (data.generationsUsed !== undefined) {
        setGenerationsUsed(data.generationsUsed)
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

      // Fetch profile for generation counts
      const { data: profileData } = await supabase
        .from('profiles')
        .select('generations_used, subscription_tier')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setGenerationsUsed((profileData as Profile).generations_used || 0)
        const tier = (profileData as Profile).subscription_tier || 'free'
        setGenerationsLimit(GENERATION_LIMITS[tier] || 50)
      }

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

        // Update the stub with the generated content
        const { error } = await supabase
          .from('entities')
          .update({
            name: forge.output.name,
            subtype: forge.output.item_type,
            summary: forge.output.public_description.substring(0, 200),
            description: `**Public Description:** ${forge.output.public_description}\n\n**Secret Description:** ${forge.output.secret_description}`,
            attributes: {
              item_type: forge.output.item_type,
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
        toast.success('Item saved to Memory!')
        // Navigate to the new entity
        const entity = result.entity as { id: string }
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
      await forge.handleGenerate(input)
      toast.success('Item generated successfully!')
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

  const generationsRemaining = generationsLimit - generationsUsed

  return (
    <ForgeShell
      title={stubContext ? `Flesh Out: ${stubName}` : 'Item Forge'}
      description={
        stubContext
          ? 'Complete this stub entity with full details'
          : 'Generate unique items with dual player/DM descriptions'
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
          <ItemInputForm
            onSubmit={handleGenerate}
            isLocked={forge.status !== 'idle' && forge.status !== 'error'}
            preValidation={forge.preValidation}
            onProceedAnyway={forge.proceedAnyway}
            campaignId={campaignId}
            generationsRemaining={generationsRemaining}
            generationsLimit={generationsLimit}
            initialValues={
              stubContext
                ? {
                    name: stubName || '',
                    dmSlug: `Flesh out ${stubName}. ${stubContext.snippet || ''}`,
                  }
                : undefined
            }
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
