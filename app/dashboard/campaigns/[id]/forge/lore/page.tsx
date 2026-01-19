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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { EVENT_SUB_TYPES, EventSubType, LoreDrop, GeneratedLore } from '@/types/event'

export default function LoreForgePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  const supabase = createClient()

  // Form state
  const [subType, setSubType] = useState<EventSubType>('historical_event')
  const [concept, setConcept] = useState('')
  const [dateDisplay, setDateDisplay] = useState('')
  const [eventSort, setEventSort] = useState<number>(0)
  const [era, setEra] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedData, setGeneratedData] = useState<GeneratedLore | null>(null)

  // UI state
  const [showDmContent, setShowDmContent] = useState(true)
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!concept.trim()) {
      toast.error('Please describe the event')
      return
    }
    if (!dateDisplay.trim()) {
      toast.error('Please specify when this happened')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate/lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          subType,
          concept,
          dateDisplay,
          eventSort,
          era: era || null,
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
      toast.error('Failed to generate lore')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedData) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from('entities').insert({
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
      })

      if (error) throw error

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

  const selectedTypeInfo = EVENT_SUB_TYPES.find(t => t.value === subType)

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

            {/* When */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>When did this happen?</Label>
                <Input
                  placeholder="500 years ago, Year of the Serpent, etc."
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  className="bg-slate-800/50"
                />
                <p className="text-xs text-slate-500">How it appears on the timeline</p>
              </div>
              <div className="space-y-2">
                <Label>Sort Order (for timeline)</Label>
                <Input
                  type="number"
                  placeholder="-500 for past, 1492 for dated"
                  value={eventSort}
                  onChange={(e) => setEventSort(parseFloat(e.target.value) || 0)}
                  className="bg-slate-800/50"
                />
                <p className="text-xs text-slate-500">Negative = past, positive = recent/future</p>
              </div>
            </div>

            {/* Era */}
            <div className="space-y-2">
              <Label>Era (Optional)</Label>
              <Input
                placeholder="Age of Myth, Modern Era, etc."
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="bg-slate-800/50"
              />
              <p className="text-xs text-slate-500">Groups events on the timeline</p>
            </div>

            {/* Concept */}
            <div className="space-y-2">
              <Label>What happened?</Label>
              <Textarea
                placeholder="Describe the event, its causes, and aftermath. Include any key details you want the AI to incorporate..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="bg-slate-800/50 min-h-[120px]"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !concept.trim() || !dateDisplay.trim()}
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
                      <p className="text-slate-400">
                        {selectedTypeInfo?.label} • {generatedData.mechanics?.date_display}
                        {generatedData.event_era && ` • ${generatedData.event_era}`}
                      </p>
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
              {generatedData.discoveries && Object.values(generatedData.discoveries).some((arr) => arr && arr.length > 0) && (
                <StaggerItem>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                      <span className="text-base">🔗</span> Discovered References
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedData.discoveries.npcs?.map((npc: string, i: number) => (
                        <span key={`npc-${i}`} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                          👤 {npc}
                        </span>
                      ))}
                      {generatedData.discoveries.locations?.map((loc: string, i: number) => (
                        <span key={`loc-${i}`} className="px-2 py-1 bg-teal-500/10 text-teal-400 rounded text-xs">
                          📍 {loc}
                        </span>
                      ))}
                      {generatedData.discoveries.items?.map((item: string, i: number) => (
                        <span key={`item-${i}`} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                          ⚔️ {item}
                        </span>
                      ))}
                      {generatedData.discoveries.events?.map((evt: string, i: number) => (
                        <span key={`evt-${i}`} className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs">
                          📜 {evt}
                        </span>
                      ))}
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
