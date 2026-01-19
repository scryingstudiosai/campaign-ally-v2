'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Scroll,
  Sparkles,
  Save,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Loader2,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { EVENT_SUB_TYPES, EventSubType, LoreDrop, GeneratedLore, LoreDiscovery, DiscoveryEntityType } from '@/types/event'
import { EntityTypeBadge } from '@/components/memory/entity-type-badge'
import { EntityMultiSelect } from '@/components/entities/EntityMultiSelect'
import { TIMEFRAMES } from '@/lib/forge/prompts/lore-prompts'

export default function LoreForgePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  const supabase = createClient()

  // Form state - simplified with timeframe instead of sort/era
  const [subType, setSubType] = useState<EventSubType>('historical_event')
  const [timeframe, setTimeframe] = useState<string>('ancient')
  const [involvedEntities, setInvolvedEntities] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [surpriseMe, setSurpriseMe] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedData, setGeneratedData] = useState<GeneratedLore | null>(null)

  // UI state
  const [showDmContent, setShowDmContent] = useState(true)
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null)
  const [savingDiscoveryId, setSavingDiscoveryId] = useState<string | null>(null)
  const [savedDiscoveries, setSavedDiscoveries] = useState<Set<string>>(new Set())

  const selectedTypeInfo = EVENT_SUB_TYPES.find(t => t.value === subType)
  const selectedTimeframe = TIMEFRAMES.find(t => t.value === timeframe)

  // Check if we can generate (either description, surpriseMe, or entities selected)
  const canGenerate = description.trim() || surpriseMe || involvedEntities.length > 0

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Please describe the event, select entities, or use Surprise Me')
      return
    }

    // Get timeframe data
    const timeframeData = TIMEFRAMES.find(t => t.value === timeframe)

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate/lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          subType,
          concept: description || null,
          dateDisplay: timeframeData?.label || 'Unknown time',
          eventSort: timeframeData?.sort ?? 0,
          era: timeframeData?.era ?? null,
          timeframe,
          involvedEntityIds: involvedEntities,
          surpriseMe,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      setGeneratedData(result.data)
      toast.success('Lore generated!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate lore')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedData) return

    setIsSaving(true)
    try {
      // Save the event entity
      const { data: savedEntity, error } = await supabase.from('entities').insert({
        campaign_id: campaignId,
        entity_type: 'event',
        sub_type: generatedData.sub_type,
        name: generatedData.name,
        status: 'active',
        event_sort: generatedData.event_sort,
        event_era: generatedData.event_era,
        event_ongoing: generatedData.event_ongoing,
        soul: generatedData.soul,
        brain: generatedData.brain,
        mechanics: generatedData.mechanics,
      }).select('id').single()

      if (error) throw error

      // Create relationships to involved entities
      if (savedEntity?.id && generatedData.involvedEntityIds?.length) {
        const relationships = generatedData.involvedEntityIds.map(targetId => ({
          campaign_id: campaignId,
          source_entity_id: savedEntity.id,
          target_entity_id: targetId,
          relationship_type: 'involved_in',
          category: 'other',
          descriptor: 'involved in',
          description: `Connected via Lore Forge generation`,
          visibility: 'public' as const,
        }))

        const { error: relError } = await supabase.from('relationships').insert(relationships)
        if (relError) {
          console.error('Failed to create relationships:', relError)
          // Don't fail the whole save if relationships fail
        }
      }

      toast.success('Event saved to Memory!')
      router.push(`/dashboard/campaigns/${campaignId}/memory`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save event')
    } finally {
      setIsSaving(false)
    }
  }

  const copyLoreDrop = (drop: LoreDrop) => {
    const text = `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`
    navigator.clipboard.writeText(text)
    setCopiedDropId(drop.id)
    setTimeout(() => setCopiedDropId(null), 2000)
    toast.success('Lore drop copied!')
  }

  const handleQuickSaveDiscovery = async (discovery: LoreDiscovery) => {
    setSavingDiscoveryId(discovery.id)
    try {
      const { error } = await supabase.from('entities').insert({
        campaign_id: campaignId,
        entity_type: discovery.entity_type,
        name: discovery.name,
        status: 'stub',
        soul: { brief: discovery.brief },
        brain: { connection_notes: discovery.connection },
        mechanics: {},
      })

      if (error) throw error

      setSavedDiscoveries(prev => new Set([...prev, discovery.id]))
      toast.success(`${discovery.name} saved as stub!`)
    } catch (error) {
      console.error('Quick save error:', error)
      toast.error('Failed to save discovery')
    } finally {
      setSavingDiscoveryId(null)
    }
  }

  const handleExpandInForge = (discovery: LoreDiscovery) => {
    // Map entity types to forge routes
    const forgeRoutes: Record<DiscoveryEntityType, string> = {
      npc: 'npc',
      location: 'location',
      faction: 'faction',
      item: 'item',
      event: 'lore',
      creature: 'creature',
      quest: 'quest',
    }
    const route = forgeRoutes[discovery.entity_type] || 'npc'

    // Store discovery info in sessionStorage for the target forge to pick up
    sessionStorage.setItem('forge_prefill', JSON.stringify({
      name: discovery.name,
      brief: discovery.brief,
      connection: discovery.connection,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/${route}`)
  }

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
        {/* Header */}
        <header className="border-b px-6 py-4" style={{ borderColor: 'var(--ca-stroke)', backgroundColor: 'var(--ca-bg-raised)' }}>
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Scroll className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Lore Forge</h1>
              <p className="text-sm text-slate-400">Create historical events, rumors, and prophecies</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Input Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-6">
            {/* Event Type & Timeframe Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Type */}
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={subType} onValueChange={(v) => setSubType(v as EventSubType)}>
                  <SelectTrigger className="bg-slate-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_SUB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTypeInfo && (
                  <p className="text-xs text-slate-500">{selectedTypeInfo.description}</p>
                )}
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <Label>When in History?</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-slate-800/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        <span className="flex items-center gap-2">
                          <span>{tf.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTimeframe && (
                  <p className="text-xs text-slate-500">{selectedTimeframe.hint}</p>
                )}
              </div>
            </div>

            {/* Involved Entities */}
            <div className="space-y-2">
              <Label>Who&apos;s Involved? (Optional)</Label>
              <EntityMultiSelect
                campaignId={campaignId}
                entityTypes={['npc', 'faction', 'location', 'deity']}
                selected={involvedEntities}
                onChange={setInvolvedEntities}
                placeholder="Search NPCs, factions, locations, deities..."
              />
              <p className="text-xs text-slate-500">
                Select existing entities to connect this lore to your world
              </p>
            </div>

            {/* Description with Surprise Me */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>What Happened? (Optional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDescription('')
                    setSurpriseMe(true)
                  }}
                  className={`text-xs gap-1.5 ${surpriseMe ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                >
                  <Wand2 className="w-3 h-3" />
                  Surprise Me
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (e.target.value) setSurpriseMe(false)
                }}
                placeholder={surpriseMe
                  ? "AI will generate based on your campaign's tone and themes..."
                  : "Describe the event, or leave blank for AI to create one..."
                }
                className={`bg-slate-800/50 min-h-[100px] ${surpriseMe ? 'bg-amber-500/5 border-amber-500/20' : ''}`}
              />
              {surpriseMe && (
                <p className="text-xs text-amber-400/80">
                  AI will create an unexpected event that fits your campaign
                </p>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Weaving History...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Lore
                </>
              )}
            </Button>

            {!canGenerate && (
              <p className="text-xs text-center text-slate-500">
                Describe the event, select involved entities, or click &quot;Surprise Me&quot;
              </p>
            )}
          </div>

          {/* Generated Output */}
          {generatedData && (
            <StaggerContainer className="space-y-4">
              {/* Header */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">
                        {selectedTypeInfo?.icon} {generatedData.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                          {selectedTypeInfo?.label}
                        </Badge>
                        {generatedData.event_era && (
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {generatedData.event_era}
                          </Badge>
                        )}
                        {generatedData.event_ongoing && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Ongoing
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDmContent(!showDmContent)}
                    >
                      {showDmContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="ml-2">{showDmContent ? 'Hide' : 'Show'} DM Content</span>
                    </Button>
                  </div>
                </div>
              </StaggerItem>

              {/* Common Knowledge */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2">
                    <span className="text-base">📖</span> Common Knowledge
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {generatedData.soul?.common_knowledge}
                  </p>
                </div>
              </StaggerItem>

              {/* Scholarly Account */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <span className="text-base">📚</span> Scholarly Account
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {generatedData.soul?.scholarly_account}
                  </p>
                </div>
              </StaggerItem>

              {/* Folklore */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                    <span className="text-base">🎭</span> Folklore
                  </h3>
                  <p className="text-slate-300 leading-relaxed italic">
                    {generatedData.soul?.folklore}
                  </p>
                </div>
              </StaggerItem>

              {/* Propaganda (if exists) */}
              {generatedData.soul?.propaganda && (
                <StaggerItem>
                  <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <span className="text-base">📢</span> Official Narrative
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {generatedData.soul.propaganda}
                    </p>
                  </div>
                </StaggerItem>
              )}

              {/* DM Truth */}
              {showDmContent && (
                <StaggerItem>
                  <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <EyeOff className="w-4 h-4 text-red-400" />
                      <h3 className="text-sm font-semibold text-red-400">DM TRUTH</h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">
                        Hidden from Players
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">True History</h4>
                        <p className="text-slate-300">{generatedData.brain?.true_history}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Hidden Causes</h4>
                        <p className="text-slate-300">{generatedData.brain?.hidden_causes}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Consequences</h4>
                        <p className="text-slate-300">{generatedData.brain?.consequences}</p>
                      </div>

                      {generatedData.brain?.secrets && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Deep Secrets</h4>
                          <p className="text-slate-300">{generatedData.brain.secrets}</p>
                        </div>
                      )}

                      {generatedData.brain?.reveal_triggers?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Reveal Triggers</h4>
                          <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {generatedData.brain.reveal_triggers.map((trigger: string, i: number) => (
                              <li key={i}>{trigger}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {generatedData.brain?.hooks?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Quest Hooks</h4>
                          <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {generatedData.brain.hooks.map((hook: string, i: number) => (
                              <li key={i}>{hook}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {/* Lore Drops */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-teal-500/30 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
                    <span className="text-base">🎯</span> Lore Drops
                    <span className="text-xs font-normal text-slate-500">
                      (Use these in play)
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {generatedData.mechanics?.lore_drops?.map((drop: LoreDrop) => (
                      <div
                        key={drop.id}
                        className={`p-4 rounded-lg border ${
                          drop.reveal_level === 'dm_truth'
                            ? 'bg-red-500/5 border-red-500/30'
                            : drop.reveal_level === 'partial'
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-medium text-slate-400">
                              <span className="text-base mr-1">📍</span> {drop.trigger}
                            </span>
                            <span className="mx-2 text-slate-600">•</span>
                            <span className="text-xs text-slate-500">
                              {drop.delivery}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {drop.reveal_level === 'dm_truth' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">
                                DM Truth
                              </span>
                            )}
                            {drop.reveal_level === 'partial' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                                Partial
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLoreDrop(drop)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedDropId === drop.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">&ldquo;{drop.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </StaggerItem>

              {/* Current Evidence */}
              {generatedData.mechanics?.current_evidence && (
                <StaggerItem>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <span className="text-base">🔍</span> Current Evidence
                    </h3>
                    <p className="text-slate-300">
                      {generatedData.mechanics.current_evidence}
                    </p>
                  </div>
                </StaggerItem>
              )}

              {/* Duration and Regions */}
              {(generatedData.mechanics?.duration || generatedData.mechanics?.affected_regions?.length > 0) && (
                <StaggerItem>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="flex flex-wrap gap-6">
                      {generatedData.mechanics?.duration && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">
                            <Calendar className="w-3 h-3 inline mr-1" /> Duration
                          </h4>
                          <p className="text-slate-300 text-sm">{generatedData.mechanics.duration}</p>
                        </div>
                      )}
                      {generatedData.mechanics?.affected_regions?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Affected Regions</h4>
                          <div className="flex flex-wrap gap-1">
                            {generatedData.mechanics.affected_regions.map((region: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                                {region}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {/* Discoveries */}
              {generatedData.discoveries && generatedData.discoveries.length > 0 && (
                <StaggerItem>
                  <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Discoveries
                      <span className="text-xs font-normal text-slate-500">
                        (Related entities to expand your world)
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {generatedData.discoveries.map((discovery: LoreDiscovery) => {
                        const isSaved = savedDiscoveries.has(discovery.id)
                        const isSaving = savingDiscoveryId === discovery.id

                        return (
                          <div
                            key={discovery.id}
                            className={`p-4 rounded-lg border transition-all ${
                              isSaved
                                ? 'bg-green-500/5 border-green-500/30'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <EntityTypeBadge type={discovery.entity_type as 'npc' | 'location' | 'faction' | 'item' | 'event' | 'creature' | 'quest' | 'other'} size="sm" />
                                  <span className="font-medium text-slate-100">{discovery.name}</span>
                                  {isSaved && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                      Saved
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-300 mb-1">{discovery.brief}</p>
                                <p className="text-xs text-slate-500 italic">Connection: {discovery.connection}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!isSaved && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuickSaveDiscovery(discovery)}
                                      disabled={isSaving}
                                      className="h-8 text-xs"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3 mr-1" />
                                          Quick Save
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleExpandInForge(discovery)}
                                      className="h-8 text-xs text-purple-400 hover:text-purple-300"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Expand
                                    </Button>
                                  </>
                                )}
                                {isSaved && (
                                  <Check className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </StaggerItem>
              )}

              {/* Save Button */}
              <StaggerItem>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-black font-semibold"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to Memory
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
