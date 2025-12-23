'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { FactionOutputCard, GeneratedFaction } from '@/components/forge/faction'
import { QuickReference } from '@/components/forge/QuickReference'
import { extractTextForScanning } from '@/lib/forge/validation/post-gen'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Briefcase,
  Shield,
  Sun,
  Skull,
  Crown,
  Coins,
  Eye,
  Castle,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Discovery, Conflict, EntityType } from '@/types/forge'

// Input data type for faction forge
interface FactionInputData {
  name?: string
  concept?: string
  factionType?: string
  influence?: string
  wealth?: string
  referencedEntityIds?: string[]
  [key: string]: unknown
}

interface PageProps {
  params: { id: string }
}

type FactionType =
  | 'guild'
  | 'military'
  | 'religious'
  | 'criminal'
  | 'political'
  | 'merchant'
  | 'cult'
  | 'noble_house'
  | 'secret_society'

const FACTION_CONFIG: Record<
  FactionType,
  { label: string; description: string; icon: typeof Briefcase }
> = {
  guild: { label: 'Guild', description: 'Trade or craft', icon: Briefcase },
  military: { label: 'Military', description: 'Armed forces', icon: Shield },
  religious: { label: 'Religious', description: 'Faith-based', icon: Sun },
  criminal: { label: 'Criminal', description: 'Underworld', icon: Skull },
  political: { label: 'Political', description: 'Government', icon: Crown },
  merchant: { label: 'Merchant', description: 'Trade network', icon: Coins },
  cult: { label: 'Cult', description: 'Secret worship', icon: Eye },
  noble_house: { label: 'Noble House', description: 'Aristocracy', icon: Castle },
  secret_society: { label: 'Secret Society', description: 'Hidden agenda', icon: KeyRound },
}

export default function FactionForgePage({ params }: PageProps) {
  const searchParams = useSearchParams()
  const campaignId = params.id
  const supabase = createClient()

  // Check for stub editing mode
  const editingStubId = searchParams.get('stub')
  const [stubContext, setStubContext] = useState<{
    name: string
    sourceEntityId?: string
    sourceEntityName?: string
  } | null>(null)

  // Form state
  const [factionType, setFactionType] = useState<FactionType>('guild')
  const [name, setName] = useState('')
  const [concept, setConcept] = useState('')
  const [influence, setInfluence] = useState<string>('')
  const [wealth, setWealth] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Forge hook
  const forge = useForge<FactionInputData, GeneratedFaction>({
    campaignId,
    forgeType: 'faction',
    stubId: editingStubId || undefined,
    generateFn: async (input) => {
      const response = await fetch('/api/generate/faction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.faction
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      return extractTextForScanning({
        read_aloud: output.read_aloud,
        dm_slug: output.dm_slug,
        purpose: output.brain?.purpose,
        goals: output.brain?.goals,
        current_agenda: output.brain?.current_agenda,
        methods: output.brain?.methods,
        secret: output.brain?.secret,
        weakness: output.brain?.weakness,
        hierarchy: output.brain?.hierarchy,
        culture: output.soul?.culture,
      })
    },
    getEntityName: (output) => output.name,
  })

  // Discoveries and conflicts state
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // Sync scan results to local review state
  // IMPORTANT: This must MERGE with member/territory discoveries, not replace them
  useEffect(() => {
    if (forge.scanResult) {
      setReviewDiscoveries((prev) => {
        // Keep any member/territory discoveries that were already added
        const memberTerritoryDiscoveries = prev.filter(
          (d) => d.id.startsWith('member-') || d.id.startsWith('territory-')
        )
        // Merge scan discoveries with member/territory discoveries, avoiding duplicates
        const scanDiscoveries = forge.scanResult!.discoveries.filter(
          (scanD) =>
            !memberTerritoryDiscoveries.some(
              (mtd) => mtd.text.toLowerCase() === scanD.text.toLowerCase()
            )
        )
        return [...scanDiscoveries, ...memberTerritoryDiscoveries]
      })
      setReviewConflicts(forge.scanResult.conflicts)
    }
  }, [forge.scanResult])

  // Referenced entities from Quick Reference
  const [referencedEntityIds, setReferencedEntityIds] = useState<string[]>([])
  const [referencedEntityNames, setReferencedEntityNames] = useState<string[]>([])

  // Existing entities for linking
  const [existingEntities, setExistingEntities] = useState<
    Array<{ id: string; name: string; type: string; sub_type?: string }>
  >([])

  // Fetch existing entities for linking
  useEffect(() => {
    async function fetchEntities() {
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('name')
        .limit(100)

      if (data) {
        setExistingEntities(
          data.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.entity_type,
            sub_type: e.sub_type,
          }))
        )
      }
    }
    fetchEntities()
  }, [campaignId, supabase])

  // Load stub context if editing
  useEffect(() => {
    async function loadStub() {
      if (!editingStubId) return

      const { data: stub } = await supabase
        .from('entities')
        .select('name, attributes')
        .eq('id', editingStubId)
        .single()

      if (stub) {
        const attrs = stub.attributes as Record<string, unknown> | null
        setStubContext({
          name: stub.name,
          sourceEntityId: attrs?.source_entity_id as string | undefined,
          sourceEntityName: attrs?.source_entity_name as string | undefined,
        })
        setName(stub.name)
        // Pre-fill concept from stub context if available
        if (attrs?.stub_context) {
          setConcept(attrs.stub_context as string)
        }
      }
    }
    loadStub()
  }, [editingStubId, supabase])

  // Sync key_members and territory to discoveries
  useEffect(() => {
    if (!forge.output) return

    const output = forge.output
    const newDiscoveries: Discovery[] = []

    // Key members become NPC stubs
    output.brain?.key_members?.forEach((memberName: string, idx: number) => {
      // Clean name (remove titles/descriptions if AI added them)
      const cleanName = memberName.split(/[:(-]/)[0].trim()
      if (!cleanName) return

      // Check for duplicates in existing discoveries
      const isDuplicate = reviewDiscoveries.some(
        (d) => d.text.toLowerCase() === cleanName.toLowerCase()
      )
      // Check if entity already exists in campaign
      const isExisting = existingEntities.some(
        (e) => e.name.toLowerCase() === cleanName.toLowerCase()
      )

      if (!isDuplicate && !isExisting) {
        newDiscoveries.push({
          id: `member-${idx}-${Date.now()}`,
          text: cleanName,
          suggestedType: 'npc',
          context: `Key member of ${output.name || 'faction'}`,
          status: 'create_stub' as const, // Default to visible/active, user can ignore
        })
      }
    })

    // Territory becomes Location stubs
    output.mechanics?.territory?.forEach((locName: string, idx: number) => {
      // Clean name (remove descriptions if AI added them)
      const cleanName = locName.split(/[:(-]/)[0].trim()
      if (!cleanName) return

      // Check for duplicates
      const isDuplicate = reviewDiscoveries.some(
        (d) => d.text.toLowerCase() === cleanName.toLowerCase()
      )
      const isExisting = existingEntities.some(
        (e) => e.name.toLowerCase() === cleanName.toLowerCase()
      )

      if (!isDuplicate && !isExisting) {
        newDiscoveries.push({
          id: `territory-${idx}-${Date.now()}`,
          text: cleanName,
          suggestedType: 'location',
          context: `Territory controlled by ${output.name || 'faction'}`,
          status: 'create_stub' as const, // Default to visible/active, user can ignore
        })
      }
    })

    if (newDiscoveries.length > 0) {
      console.log('Syncing Faction Assets to Discoveries:', newDiscoveries)
      setReviewDiscoveries((prev) => [...prev, ...newDiscoveries])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forge.output?.brain?.key_members, forge.output?.mechanics?.territory, existingEntities])

  // Handle quick reference entity selection
  const handleQuickRefSelect = (entityName: string, entityId: string) => {
    if (!referencedEntityIds.includes(entityId)) {
      setReferencedEntityIds((prev) => [...prev, entityId])
      setReferencedEntityNames((prev) => [...prev, entityName])
      // Add to concept
      setConcept((prev) => (prev ? `${prev} [${entityName}]` : `[${entityName}]`))
    }
  }

  // Remove referenced entity
  const handleRemoveRef = (entityId: string, entityName: string) => {
    setReferencedEntityIds((prev) => prev.filter((id) => id !== entityId))
    setReferencedEntityNames((prev) => prev.filter((n) => n !== entityName))
    setConcept((prev) => prev.replace(`[${entityName}]`, '').trim())
  }

  // Handle generation
  const handleGenerate = async () => {
    if (!concept.trim() && !name.trim()) {
      toast.error('Please provide a concept or name for the faction')
      return
    }

    const input: FactionInputData = {
      name: name.trim() || undefined,
      concept: concept.trim() || `A ${factionType} faction`,
      factionType,
      influence: influence || undefined,
      wealth: wealth || undefined,
      referencedEntityIds,
    }

    const result = await forge.handleGenerate(input)
    if (!result.success && result.reason === 'error') {
      toast.error('Failed to generate faction')
    }
  }

  // Handle commit
  const handleCommit = async () => {
    // Filter discoveries to create stubs for
    const stubDiscoveries = reviewDiscoveries.filter((d) => d.status === 'create_stub')

    if (editingStubId) {
      // Update existing stub entity
      const stubId = editingStubId

      const updateData: Record<string, unknown> = {
        name: forge.output?.name || name,
        sub_type: forge.output?.sub_type || factionType,
        brain: forge.output?.brain || {},
        soul: forge.output?.soul || {},
        mechanics: forge.output?.mechanics || {},
        read_aloud: forge.output?.read_aloud,
        dm_slug: forge.output?.dm_slug,
        summary: forge.output?.dm_slug,
        status: 'active',
        attributes: {
          is_stub: false,
          needs_review: false,
          fleshed_out_at: new Date().toISOString(),
        },
      }

      const { error } = await supabase.from('entities').update(updateData).eq('id', stubId)

      if (error) {
        toast.error('Failed to update entity')
        return
      }

      // Save facts for the fleshed-out stub
      const factionData = forge.output
      if (factionData?.facts && factionData.facts.length > 0) {
        const factsToInsert = factionData.facts.map(
          (fact: { content: string; category?: string; visibility?: string }) => ({
            campaign_id: campaignId,
            entity_id: stubId,
            content: fact.content,
            category: fact.category || 'lore',
            visibility: fact.visibility || 'public',
            source_type: 'generated',
          })
        )

        const { error: factsError } = await supabase.from('facts').insert(factsToInsert)

        if (factsError) {
          console.error('Error saving facts:', factsError)
        }
      }

      // Create stubs for key_members and territory
      for (const discovery of stubDiscoveries) {
        const { data: newStub } = await supabase
          .from('entities')
          .insert({
            campaign_id: campaignId,
            name: discovery.text,
            entity_type: discovery.suggestedType,
            status: 'active',
            attributes: {
              is_stub: true,
              needs_review: true,
              stub_context: discovery.context,
              source_entity_id: stubId,
              source_entity_name: forge.output?.name,
            },
          })
          .select()
          .single()

        if (newStub) {
          // Create relationship
          const relType = discovery.id.startsWith('member-') ? 'member_of' : 'controlled_by'
          await supabase.from('relationships').insert({
            campaign_id: campaignId,
            source_id: newStub.id,
            target_id: stubId,
            relationship_type: relType,
            description:
              discovery.id.startsWith('member-')
                ? 'Key member of faction'
                : 'Territory controlled by faction',
          })
        }
      }

      toast.success('Faction updated!')
      window.location.href = `/dashboard/campaigns/${campaignId}/memory/${stubId}`
    } else {
      // Use standard forge commit for new entities
      const result = await forge.handleCommit({
        discoveries: reviewDiscoveries,
        conflicts: [],
      })

      if (result.success && result.entity) {
        const entity = result.entity as { id: string }
        toast.success('Faction created!')
        window.location.href = `/dashboard/campaigns/${campaignId}/memory/${entity.id}`
      } else {
        toast.error(result.error || 'Failed to create faction')
      }
    }
  }

  // Handle discovery action
  const handleDiscoveryAction = (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ) => {
    setReviewDiscoveries((prev) =>
      prev.map((d) =>
        d.id === discoveryId ? { ...d, status: action, linkedEntityId } : d
      )
    )
  }

  // Handle manual discovery
  const handleManualDiscovery = (text: string, type: string) => {
    const newDiscovery: Discovery = {
      id: `manual-${Date.now()}`,
      text,
      suggestedType: type as Discovery['suggestedType'],
      context: 'Manually selected',
      status: 'create_stub',
    }
    setReviewDiscoveries((prev) => [...prev, newDiscovery])
  }

  // Handle discovery type change
  const handleDiscoveryTypeChange = (discoveryId: string, newType: EntityType) => {
    setReviewDiscoveries((prev) =>
      prev.map((d) =>
        d.id === discoveryId ? { ...d, suggestedType: newType } : d
      )
    )
  }

  // Handle conflict resolution
  const handleConflictResolution = (
    conflictId: string,
    resolution: Conflict['resolution']
  ) => {
    setReviewConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId ? { ...c, resolution } : c
      )
    )
  }

  const currentConfig = FACTION_CONFIG[factionType]
  const CurrentIcon = currentConfig.icon
  const isLocked = forge.status === 'generating' || forge.status === 'saving'

  return (
    <ForgeShell
      title={editingStubId ? `Flesh Out: ${stubContext?.name || 'Faction'}` : 'Faction Forge'}
      status={forge.status}
      inputSection={
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate() }} className="space-y-4">
          {/* Faction Type Grid */}
          <div className="space-y-2">
            <Label>Faction Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FACTION_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const isSelected = factionType === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFactionType(key as FactionType)}
                    disabled={isLocked}
                    className={`
                      p-2 rounded-lg border text-left transition-all min-w-0 overflow-hidden
                      ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                      }
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                    <div className="font-medium text-xs truncate">{config.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank to generate"
              disabled={isLocked}
              className="bg-slate-900/50 border-slate-700"
            />
          </div>

          {/* Concept */}
          <div className="space-y-2">
            <Label htmlFor="concept">Concept</Label>
            <Textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Describe this faction... e.g., 'A secret network of spies serving the crown'"
              disabled={isLocked}
              className="bg-slate-900/50 border-slate-700 min-h-[80px]"
            />
          </div>

          {/* Referenced Entities */}
          {referencedEntityNames.length > 0 && (
            <div className="space-y-2">
              <Label>Referenced Entities</Label>
              <div className="flex flex-wrap gap-1.5">
                {referencedEntityNames.map((entityName, idx) => (
                  <button
                    key={referencedEntityIds[idx]}
                    type="button"
                    onClick={() => handleRemoveRef(referencedEntityIds[idx], entityName)}
                    className="px-2 py-1 text-xs bg-teal-500/10 border border-teal-500/30 rounded text-teal-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors"
                    disabled={isLocked}
                  >
                    {entityName} ×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reference */}
          <QuickReference
            campaignId={campaignId}
            onSelect={handleQuickRefSelect}
            excludeIds={referencedEntityIds}
          />

          {/* Advanced Options */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Options
            </button>
            {showAdvanced && (
              <div className="space-y-3 pl-4 border-l-2 border-slate-700">
                <div className="space-y-2">
                  <Label>Influence Level</Label>
                  <Select value={influence} onValueChange={setInfluence} disabled={isLocked}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negligible">Negligible</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="dominant">Dominant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wealth Level</Label>
                  <Select value={wealth} onValueChange={setWealth} disabled={isLocked}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="destitute">Destitute</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="wealthy">Wealthy</SelectItem>
                      <SelectItem value="vast">Vast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={isLocked || (!concept.trim() && !name.trim())}
            className="w-full ca-btn ca-btn-primary"
          >
            {forge.status === 'generating' ? (
              'Forging...'
            ) : (
              <>
                <CurrentIcon className="w-4 h-4 mr-2" />
                Forge {currentConfig.label}
              </>
            )}
          </Button>
        </form>
      }
      outputSection={
        forge.output ? (
          <FactionOutputCard
            data={forge.output}
            scanResult={forge.scanResult}
            campaignId={campaignId}
            onDiscoveryAction={handleDiscoveryAction}
            onManualDiscovery={handleManualDiscovery}
            onLinkExisting={(entityId) => {
              // Find the selected discovery and link it
            }}
            existingEntities={existingEntities}
          />
        ) : null
      }
      commitPanel={
        forge.output && forge.scanResult ? (
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
