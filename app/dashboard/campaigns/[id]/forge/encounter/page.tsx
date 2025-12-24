'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useForge } from '@/hooks/useForge'
import { ForgeShell } from '@/components/forge/ForgeShell'
import { CommitPanel } from '@/components/forge/CommitPanel'
import { EncounterOutputCard, GeneratedEncounter } from '@/components/forge/encounter'
import { QuickReference } from '@/components/forge/QuickReference'
import { SrdLookupPopover } from '@/components/srd'
import type { SrdCreature } from '@/types/srd'
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
  Swords,
  Crown,
  EyeOff,
  Shield,
  Footprints,
  Ghost,
  Puzzle,
  MessageCircle,
  Compass,
  AlertTriangle,
  Cog,
  Dices,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react'
import type { Discovery, Conflict, EntityType } from '@/types/forge'
import type { EncounterSubType, EncounterCreature, EncounterRewardItem } from '@/types/living-entity'

// Input data type for encounter forge
interface EncounterInputData {
  name?: string
  concept?: string
  encounterType?: EncounterSubType
  locationId?: string
  difficulty?: string
  partySize?: number
  partyLevel?: string
  referencedEntityIds?: string[]
  [key: string]: unknown
}

interface PageProps {
  params: { id: string }
}

const ENCOUNTER_CONFIG: Record<
  EncounterSubType,
  { label: string; description: string; icon: typeof Swords }
> = {
  combat: { label: 'Combat', description: 'Standard fight', icon: Swords },
  boss: { label: 'Boss', description: 'Major enemy', icon: Crown },
  ambush: { label: 'Ambush', description: 'Surprise attack', icon: EyeOff },
  defense: { label: 'Defense', description: 'Protect target', icon: Shield },
  chase: { label: 'Chase', description: 'Pursuit/escape', icon: Footprints },
  stealth: { label: 'Stealth', description: 'Infiltration', icon: Ghost },
  puzzle: { label: 'Puzzle', description: 'Mental challenge', icon: Puzzle },
  social: { label: 'Social', description: 'Negotiation', icon: MessageCircle },
  exploration: { label: 'Exploration', description: 'Discovery', icon: Compass },
  trap: { label: 'Trap', description: 'Simple hazard', icon: AlertTriangle },
  complex_trap: { label: 'Complex Trap', description: 'Multi-phase', icon: Cog },
  skill_challenge: { label: 'Skill Challenge', description: 'Extended check', icon: Dices },
}

export default function EncounterForgePage({ params }: PageProps) {
  const campaignId = params.id
  const supabase = createClient()

  // Form state
  const [encounterType, setEncounterType] = useState<EncounterSubType>('combat')
  const [name, setName] = useState('')
  const [concept, setConcept] = useState('')
  const [locationId, setLocationId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<string>('')
  const [partySize, setPartySize] = useState<number>(4)
  const [partyLevel, setPartyLevel] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Forge hook
  const forge = useForge<EncounterInputData, GeneratedEncounter>({
    campaignId,
    forgeType: 'encounter',
    generateFn: async (input) => {
      const response = await fetch('/api/generate/encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs: input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      return data.encounter
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      return extractTextForScanning({
        read_aloud: output.read_aloud,
        dm_slug: output.dm_slug,
        purpose: output.brain?.purpose,
        objective: output.brain?.objective,
        tactics: output.brain?.tactics,
        secret: output.brain?.secret,
        resolution: output.brain?.resolution,
        tension: output.soul?.tension,
      })
    },
    getEntityName: (output) => output.name,
  })

  // Discoveries and conflicts state
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([])
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([])

  // Sync scan results to local review state
  // IMPORTANT: This must MERGE with creature/item discoveries, not replace them
  useEffect(() => {
    if (forge.scanResult) {
      setReviewDiscoveries((prev) => {
        // Keep any creature/item discoveries that were already added
        const creatureItemDiscoveries = prev.filter(
          (d) => d.id.startsWith('creature-') || d.id.startsWith('reward-item-')
        )
        // Merge scan discoveries with creature/item discoveries, avoiding duplicates
        const scanDiscoveries = forge.scanResult!.discoveries.filter(
          (scanD) =>
            !creatureItemDiscoveries.some(
              (cid) => cid.text.toLowerCase() === scanD.text.toLowerCase()
            )
        )
        return [...scanDiscoveries, ...creatureItemDiscoveries]
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

  // Locations for the location selector
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string; sub_type?: string }>
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
        // Filter locations
        setLocations(
          data
            .filter((e) => e.entity_type === 'location')
            .map((e) => ({ id: e.id, name: e.name, sub_type: e.sub_type }))
        )
      }
    }
    fetchEntities()
  }, [campaignId, supabase])

  // Sync creatures and reward items to discoveries
  useEffect(() => {
    if (!forge.output) return

    const output = forge.output
    const newDiscoveries: Discovery[] = []

    // Creatures become Creature stubs
    output.mechanics?.creatures?.forEach((creature: EncounterCreature, idx: number) => {
      const cleanName = creature.name.split(/[:(-]/)[0].trim()
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
          id: `creature-${idx}-${Date.now()}`,
          text: cleanName,
          suggestedType: 'creature' as EntityType,
          context: `Creature in ${output.name || 'encounter'}${creature.role ? ` (${creature.role})` : ''}`,
          status: 'pending' as const,
        })
      }
    })

    // Reward items become Item stubs
    output.rewards?.items?.forEach((item: EncounterRewardItem, idx: number) => {
      const cleanName = item.name.split(/[:(-]/)[0].trim()
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
          id: `reward-item-${idx}-${Date.now()}`,
          text: cleanName,
          suggestedType: 'item' as EntityType,
          context: `Reward from ${output.name || 'encounter'}${item.type ? ` (${item.type})` : ''}`,
          status: 'pending' as const,
        })
      }
    })

    if (newDiscoveries.length > 0) {
      console.log('Syncing Encounter Assets to Discoveries:', newDiscoveries)
      setReviewDiscoveries((prev) => [...prev, ...newDiscoveries])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forge.output?.mechanics?.creatures, forge.output?.rewards?.items, existingEntities])

  // Handle quick reference entity selection
  const handleQuickRefSelect = (entityName: string, entityId: string) => {
    if (!referencedEntityIds.includes(entityId)) {
      setReferencedEntityIds((prev) => [...prev, entityId])
      setReferencedEntityNames((prev) => [...prev, entityName])
      // Add to concept
      setConcept((prev) => (prev ? `${prev} [${entityName}]` : `[${entityName}]`))
    }
  }

  // Handle SRD creature selection
  const handleSrdCreatureSelect = (creature: SrdCreature) => {
    const creatureInfo = `${creature.name} (CR ${creature.cr || '?'}, ${creature.creature_type || 'creature'})`
    setConcept((prev) => (prev ? `${prev}\n\nInclude: ${creatureInfo}` : `Include: ${creatureInfo}`))
    toast.success(`Added ${creature.name} to encounter concept`)
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
      toast.error('Please provide a concept or name for the encounter')
      return
    }

    // Clear previous discoveries before generating new content
    setReviewDiscoveries([])
    setReviewConflicts([])

    const input: EncounterInputData = {
      name: name.trim() || undefined,
      concept: concept.trim() || `A ${encounterType} encounter`,
      encounterType,
      locationId: locationId || undefined,
      difficulty: difficulty || undefined,
      partySize: partySize || undefined,
      partyLevel: partyLevel || undefined,
      referencedEntityIds,
    }

    const result = await forge.handleGenerate(input)
    if (!result.success && result.reason === 'error') {
      toast.error('Failed to generate encounter')
    }
  }

  // Handle discard - clear discoveries and reset forge
  const handleDiscard = () => {
    setReviewDiscoveries([])
    setReviewConflicts([])
    forge.reset()
  }

  // Handle commit
  const handleCommit = async () => {
    const result = await forge.handleCommit({
      discoveries: reviewDiscoveries,
      conflicts: [],
    })

    if (result.success && result.entity) {
      const entity = result.entity as { id: string }
      toast.success('Encounter created!')
      window.location.href = `/dashboard/campaigns/${campaignId}/memory/${entity.id}`
    } else {
      toast.error(result.error || 'Failed to create encounter')
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

  const currentConfig = ENCOUNTER_CONFIG[encounterType]
  const CurrentIcon = currentConfig.icon
  const isLocked = forge.status === 'generating' || forge.status === 'saving'

  return (
    <ForgeShell
      title="Encounter Forge"
      status={forge.status}
      inputSection={
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate() }} className="space-y-4">
          {/* Encounter Type Grid */}
          <div className="space-y-2">
            <Label>Encounter Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ENCOUNTER_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const isSelected = encounterType === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEncounterType(key as EncounterSubType)}
                    disabled={isLocked}
                    className={`
                      p-2 rounded-lg border text-left transition-all min-w-0 overflow-hidden
                      ${
                        isSelected
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                      }
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
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
              placeholder="Describe this encounter... e.g., 'Bandits ambush the party on a narrow bridge'"
              disabled={isLocked}
              className="bg-slate-900/50 border-slate-700 min-h-[80px]"
            />
          </div>

          {/* SRD Creature Lookup */}
          <div className="space-y-2">
            <Label>Add SRD Creature</Label>
            <SrdLookupPopover
              types={['creatures']}
              onSelectCreature={handleSrdCreatureSelect}
              triggerLabel="Search Creatures"
              placeholder="Search for creatures by name..."
            />
            <p className="text-xs text-slate-500">
              Search official D&D 5e SRD creatures to add to your encounter
            </p>
          </div>

          {/* Location Selector */}
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Select value={locationId || 'none'} onValueChange={(val) => setLocationId(val === 'none' ? '' : val)} disabled={isLocked}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue placeholder="Select location for context...">
                  {locationId && locationId !== 'none' && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      {locations.find((l) => l.id === locationId)?.name || 'Unknown'}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      {loc.name}
                      {loc.sub_type && (
                        <span className="text-xs text-slate-500">({loc.sub_type})</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Selecting a location will adapt terrain and atmosphere
            </p>
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
                    className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-300 hover:bg-red-500/20 transition-colors"
                    disabled={isLocked}
                  >
                    {entityName} x
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
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty} disabled={isLocked}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trivial">Trivial</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="deadly">Deadly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Party Size</Label>
                    <Input
                      type="number"
                      value={partySize}
                      onChange={(e) => setPartySize(parseInt(e.target.value) || 4)}
                      min={1}
                      max={10}
                      disabled={isLocked}
                      className="bg-slate-900/50 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Party Level</Label>
                    <Input
                      value={partyLevel}
                      onChange={(e) => setPartyLevel(e.target.value)}
                      placeholder="e.g., 3-5"
                      disabled={isLocked}
                      className="bg-slate-900/50 border-slate-700"
                    />
                  </div>
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
          <EncounterOutputCard
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
            onDiscard={handleDiscard}
            isCommitting={forge.status === 'saving'}
          />
        ) : undefined
      }
    />
  )
}
