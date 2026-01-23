'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EmptyForgeState } from '@/components/forge/EmptyForgeState'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import { LoreInputForm, LoreInputData } from '@/components/forge/lore'
import { LoreOutputCard } from '@/components/forge/lore'
import { toast } from 'sonner'
import type { Discovery, Conflict, EntityType } from '@/types/forge'
import type { GeneratedLore, LoreDiscovery } from '@/types/event'
import { TIMEFRAMES } from '@/lib/forge/prompts/lore-prompts'
import { useSettingsContextOptional } from '@/components/settings'

export default function LoreForgePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const campaignId = params?.id as string
  const stubId = searchParams.get('stub')
  const supabase = createClient()
  const settingsContext = useSettingsContextOptional()

  // Review state (synced from forge.scanResult)
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // Track entities referenced at generation time for relationship creation
  const [generationInvolvedEntities, setGenerationInvolvedEntities] = useState<string[]>([])

  // useForge hook for state management
  const forge = useForge<LoreInputData, GeneratedLore>({
    campaignId,
    forgeType: 'event',
    stubId: stubId || undefined,
    onCommitSuccess: async () => {
      if (settingsContext) {
        await settingsContext.markOnboardingComplete('create_event')
        await settingsContext.markOnboardingComplete('use_ai_generation')
      }
    },
    generateFn: async (input) => {
      // Get timeframe data
      const timeframeData = TIMEFRAMES.find(t => t.value === input.timeframe)

      const response = await fetch('/api/generate/lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          subType: input.subType,
          concept: input.description || null,
          dateDisplay: timeframeData?.label || 'Unknown time',
          eventSort: timeframeData?.sort ?? 0,
          era: timeframeData?.era ?? null,
          timeframe: input.timeframe,
          involvedEntityIds: input.involvedEntityIds,
          surpriseMe: input.surpriseMe,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      return result.data
    },
    getTextContent: (output) => extractTextForScanning({
      name: output.name,
      common_knowledge: output.soul?.common_knowledge,
      scholarly_account: output.soul?.scholarly_account,
      folklore: output.soul?.folklore,
      propaganda: output.soul?.propaganda,
      true_history: output.brain?.true_history,
      hidden_causes: output.brain?.hidden_causes,
      consequences: output.brain?.consequences,
      secrets: output.brain?.secrets,
      current_evidence: output.mechanics?.current_evidence,
    }),
    getEntityName: (output) => output.name,
  })

  // Sync scan results to review state + merge with AI discoveries
  useEffect(() => {
    if (forge.scanResult) {
      // Start with scanner discoveries
      const scannerDiscoveries: Discovery[] = forge.scanResult.discoveries || []

      // Add discoveries from the generated lore (AI-suggested entities)
      const aiDiscoveries: Discovery[] = (forge.output?.discoveries || []).map((d: LoreDiscovery, idx: number) => ({
        id: `ai-discovery-${idx}-${Date.now()}`,
        text: d.name,
        suggestedType: d.entity_type as EntityType,
        context: d.brief || d.connection,
        status: 'pending' as const,
      }))

      // Combine, avoiding duplicates by name
      const existingNames = new Set(scannerDiscoveries.map(d => d.text.toLowerCase()))
      const uniqueAiDiscoveries = aiDiscoveries.filter(
        d => !existingNames.has(d.text.toLowerCase())
      )

      setReviewDiscoveries([...scannerDiscoveries, ...uniqueAiDiscoveries])
      setReviewConflicts(forge.scanResult.conflicts || [])
    }
  }, [forge.scanResult, forge.output])

  // Handle generation
  const handleGenerate = async (input: LoreInputData) => {
    // Preserve involved entities for relationship creation
    setGenerationInvolvedEntities(input.involvedEntityIds || [])
    const result = await forge.handleGenerate(input)
    if (result.success) {
      toast.success('Lore generated!')
    }
  }

  // Handle discovery action (create stub, link, ignore)
  const handleDiscoveryAction = (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ) => {
    setReviewDiscoveries((prev: Discovery[]) =>
      prev.map((d: Discovery) =>
        d.id === discoveryId
          ? { ...d, status: action, linkedEntityId }
          : d
      )
    )
  }

  // Handle discovery type change
  const handleDiscoveryTypeChange = (discoveryId: string, newType: EntityType) => {
    setReviewDiscoveries((prev: Discovery[]) =>
      prev.map((d: Discovery) =>
        d.id === discoveryId
          ? { ...d, suggestedType: newType }
          : d
      )
    )
  }

  // Handle conflict resolution
  const handleConflictResolution = (
    conflictId: string,
    resolution: Conflict['resolution']
  ) => {
    setReviewConflicts((prev: Conflict[]) =>
      prev.map((c: Conflict) =>
        c.id === conflictId
          ? { ...c, resolution }
          : c
      )
    )
  }

  // Handle commit (save to memory)
  const handleCommit = async () => {
    if (!forge.output) return

    const result = await forge.handleCommit({
      discoveries: reviewDiscoveries,
      conflicts: reviewConflicts,
    })

    if (result.success && result.entity) {
      const savedEntityId = (result.entity as { id: string }).id

      // Create relationships to involved entities
      if (savedEntityId && generationInvolvedEntities.length > 0) {
        const relationships = generationInvolvedEntities.map((targetId: string) => ({
          campaign_id: campaignId,
          source_entity_id: savedEntityId,
          target_entity_id: targetId,
          relationship_type: 'involved_in',
          category: 'other',
          descriptor: 'involved in',
          description: 'Connected via Lore Forge generation',
          visibility: 'public' as const,
        }))

        const { error: relError } = await supabase.from('relationships').insert(relationships)
        if (relError) {
          console.error('Failed to create relationships:', relError)
        }
      }

      toast.success('Event saved to Memory!')

      // Redirect after brief delay
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${campaignId}/memory`)
      }, 1500)
    } else {
      toast.error(result.error || 'Failed to save')
    }
  }

  // Handle discard (reset)
  const handleDiscard = () => {
    forge.reset()
    setReviewDiscoveries([])
    setReviewConflicts([])
    setGenerationInvolvedEntities([])
  }

  // Determine if input is locked (during generation/review)
  const isInputLocked = forge.status !== 'idle' && forge.status !== 'error'

  return (
    <ForgeShell
      title="Lore Forge"
      description="Create historical events, rumors, and prophecies"
      status={forge.status}
      backHref={`/dashboard/campaigns/${campaignId}/forge`}
      backLabel="Back to Forge"
      inputSection={
        <LoreInputForm
          onSubmit={handleGenerate}
          isLocked={isInputLocked}
          preValidation={forge.preValidation}
          onProceedAnyway={forge.proceedAnyway}
          onDismissValidation={() => forge.reset()}
          campaignId={campaignId}
        />
      }
      outputSection={
        forge.output ? (
          <LoreOutputCard
            data={forge.output}
            scanResult={forge.scanResult}
            campaignId={campaignId}
            onDiscoveryAction={handleDiscoveryAction}
          />
        ) : (
          <EmptyForgeState
            forgeType="Lore"
            description="Configure your event type and timeframe, then click 'Forge Lore' to weave a new piece of history."
          />
        )
      }
      commitPanel={
        forge.status === 'review' && forge.scanResult ? (
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
