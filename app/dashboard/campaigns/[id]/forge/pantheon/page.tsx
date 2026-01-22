'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EmptyForgeState } from '@/components/forge/EmptyForgeState'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import { DeityInputForm, DeityInputData } from '@/components/forge/pantheon'
import { DeityOutputCard } from '@/components/forge/pantheon'
import { toast } from 'sonner'
import type { Discovery, Conflict, EntityType } from '@/types/forge'
import type { DeityGeneration, DeityDiscovery } from '@/types/deity'
import { Button } from '@/components/ui/button'
import { Flag, Users } from 'lucide-react'
import { useSettingsContextOptional } from '@/components/settings'

export default function PantheonForgePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  const settingsContext = useSettingsContextOptional()

  // Review state (synced from forge.scanResult)
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // useForge hook for state management
  const forge = useForge<DeityInputData, DeityGeneration>({
    campaignId,
    forgeType: 'deity',
    onCommitSuccess: () => {
      if (settingsContext) {
        settingsContext.markOnboardingComplete('create_deity')
        settingsContext.markOnboardingComplete('use_ai_generation')
      }
    },
    generateFn: async (input) => {
      const response = await fetch('/api/generate/deity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          rank: input.rank,
          domains: input.domains,
          alignment: input.alignment,
          concept: input.concept,
          pantheon: input.pantheon,
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
      titles: output.soul?.titles,
      manifestation: output.soul?.manifestation,
      personality: output.soul?.personality,
      tenets: output.soul?.tenets,
      followers: output.soul?.worship?.followers,
      true_nature: output.brain?.true_nature,
      divine_agenda: output.brain?.divine_agenda,
      conflicts: output.brain?.conflicts,
      hooks: output.brain?.hooks,
    }),
    getEntityName: (output) => output.name,
  })

  // Sync scan results to review state + merge with AI discoveries
  useEffect(() => {
    if (forge.scanResult) {
      // Start with scanner discoveries
      const scannerDiscoveries: Discovery[] = forge.scanResult.discoveries || []

      // Add discoveries from the generated deity (AI-suggested entities)
      const aiDiscoveries: Discovery[] = (forge.output?.discoveries || []).map((d: DeityDiscovery, idx: number) => ({
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
  const handleGenerate = async (input: DeityInputData) => {
    const result = await forge.handleGenerate(input)
    if (result.success) {
      toast.success('Deity generated!')
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

    if (result.success) {
      toast.success('Deity saved to Memory!')

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
  }

  // Unique feature: Establish Church - navigate to Faction Forge with context
  const handleEstablishChurch = () => {
    if (!forge.output) return
    const deity = forge.output

    sessionStorage.setItem('forge_prefill', JSON.stringify({
      name: `Church of ${deity.name}`,
      sub_type: 'religious_order',
      concept: `Religious organization dedicated to ${deity.name}, ${deity.soul.titles[0] || 'a divine power'}. Tenets: ${deity.soul.tenets.join('; ')}`,
      deity_connection: deity.name,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/faction`)
  }

  // Unique feature: Generate Priest - navigate to NPC Forge with context
  const handleGeneratePriest = () => {
    if (!forge.output) return
    const deity = forge.output

    sessionStorage.setItem('forge_prefill', JSON.stringify({
      concept: `A ${deity.soul.worship.clergy_title} of ${deity.name}`,
      role: 'clergy',
      deity: deity.name,
      domains: deity.soul.portfolio.domains,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/npc`)
  }

  // Determine if input is locked (during generation/review)
  const isInputLocked = forge.status !== 'idle' && forge.status !== 'error'

  return (
    <ForgeShell
      title="Pantheon Forge"
      description="Create gods, demigods, and divine patrons"
      status={forge.status}
      backHref={`/dashboard/campaigns/${campaignId}/forge`}
      backLabel="Back to Forge"
      inputSection={
        <DeityInputForm
          onSubmit={handleGenerate}
          isLocked={isInputLocked}
          preValidation={forge.preValidation}
          onProceedAnyway={forge.proceedAnyway}
          onDismissValidation={() => forge.reset()}
        />
      }
      outputSection={
        forge.output ? (
          <div className="space-y-4">
            <DeityOutputCard
              data={forge.output}
              campaignId={campaignId}
            />

            {/* Unique Actions - Establish Church & Generate Priest */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleEstablishChurch}
                className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
              >
                <Flag className="w-4 h-4 mr-2" />
                Establish Church
              </Button>
              <Button
                variant="outline"
                onClick={handleGeneratePriest}
                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Users className="w-4 h-4 mr-2" />
                Generate Priest
              </Button>
            </div>
          </div>
        ) : (
          <EmptyForgeState
            forgeType="Pantheon"
            description="Select a divine rank and domains, then click 'Forge Deity' to create a new god for your campaign."
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
