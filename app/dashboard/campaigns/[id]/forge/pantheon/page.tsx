'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Crown,
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Loader2,
  Users,
  Flag,
  Scroll,
  Shield,
  Flame,
  Zap,
  Sun,
  Moon,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PageTransition, StaggerContainer, StaggerItem, Expandable } from '@/components/ui/motion'
import {
  DeityRank,
  DEITY_RANKS,
  DEITY_DOMAINS,
  DEITY_ALIGNMENTS,
  DeityGeneration,
  DeityDiscovery,
} from '@/types/deity'
import { EntityTypeBadge } from '@/components/memory/entity-type-badge'

export default function PantheonForgePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  const supabase = createClient()

  // Form state
  const [rank, setRank] = useState<DeityRank>('intermediate_deity')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [alignment, setAlignment] = useState<string>('')
  const [concept, setConcept] = useState('')
  const [pantheon, setPantheon] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedData, setGeneratedData] = useState<DeityGeneration | null>(null)

  // UI state
  const [showDmContent, setShowDmContent] = useState(true)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [savingDiscoveryId, setSavingDiscoveryId] = useState<string | null>(null)
  const [savedDiscoveries, setSavedDiscoveries] = useState<Set<string>>(new Set())
  const [showBoons, setShowBoons] = useState(true)
  const [showCurses, setShowCurses] = useState(true)

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain))
    } else if (selectedDomains.length < 3) {
      setSelectedDomains([...selectedDomains, domain])
    } else {
      toast.error('Maximum 3 domains allowed')
    }
  }

  const handleGenerate = async () => {
    if (selectedDomains.length === 0) {
      toast.error('Please select at least one domain')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate/deity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          rank,
          domains: selectedDomains,
          alignment: alignment || undefined,
          concept: concept || undefined,
          pantheon: pantheon || undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      setGeneratedData(result.data)
      toast.success('Deity generated!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate deity')
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
        entity_type: 'deity',
        sub_type: generatedData.rank,
        name: generatedData.name,
        status: 'active',
        soul: generatedData.soul,
        brain: generatedData.brain,
        mechanics: generatedData.mechanics,
      })

      if (error) throw error

      toast.success('Deity saved to Memory!')
      router.push(`/dashboard/campaigns/${campaignId}/memory`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save deity')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
    toast.success(`${label} copied!`)
  }

  const handleQuickSaveDiscovery = async (discovery: DeityDiscovery) => {
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

  const handleExpandInForge = (discovery: DeityDiscovery) => {
    const forgeRoutes: Record<string, string> = {
      npc: 'npc',
      location: 'location',
      faction: 'faction',
      item: 'item',
      event: 'lore',
      deity: 'pantheon',
    }
    const route = forgeRoutes[discovery.entity_type] || 'npc'

    sessionStorage.setItem('forge_prefill', JSON.stringify({
      name: discovery.name,
      brief: discovery.brief,
      connection: discovery.connection,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/${route}`)
  }

  const handleEstablishChurch = () => {
    if (!generatedData) return

    sessionStorage.setItem('forge_prefill', JSON.stringify({
      name: `Church of ${generatedData.name}`,
      sub_type: 'religious_order',
      concept: `Religious organization dedicated to ${generatedData.name}, ${generatedData.soul.titles[0] || 'a divine power'}. Tenets: ${generatedData.soul.tenets.join('; ')}`,
      deity_connection: generatedData.name,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/faction`)
  }

  const handleGeneratePriest = () => {
    if (!generatedData) return

    sessionStorage.setItem('forge_prefill', JSON.stringify({
      concept: `A ${generatedData.soul.worship.clergy_title} of ${generatedData.name}`,
      role: 'clergy',
      deity: generatedData.name,
      domains: generatedData.soul.portfolio.domains,
    }))

    router.push(`/dashboard/campaigns/${campaignId}/forge/npc`)
  }

  const selectedRankInfo = DEITY_RANKS.find(r => r.value === rank)

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
        {/* Header */}
        <header className="border-b px-6 py-4" style={{ borderColor: 'var(--ca-stroke)', backgroundColor: 'var(--ca-bg-raised)' }}>
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Pantheon Forge</h1>
              <p className="text-sm text-slate-400">Create gods, demigods, and divine patrons</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Input Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-6">
            {/* Divine Rank */}
            <div className="space-y-2">
              <Label>Divine Rank</Label>
              <Select value={rank} onValueChange={(v) => setRank(v as DeityRank)}>
                <SelectTrigger className="bg-slate-800/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEITY_RANKS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span>{r.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRankInfo && (
                <p className="text-xs text-slate-500">{selectedRankInfo.description}</p>
              )}
            </div>

            {/* Domains */}
            <div className="space-y-2">
              <Label>Domains (Select up to 3)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DEITY_DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedDomains.includes(domain)
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 border'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Selected: {selectedDomains.length > 0 ? selectedDomains.join(', ') : 'None'}
              </p>
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Alignment (Optional)</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger className="bg-slate-800/50">
                  <SelectValue placeholder="Let AI decide..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Let AI decide</SelectItem>
                  {DEITY_ALIGNMENTS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pantheon */}
            <div className="space-y-2">
              <Label>Pantheon (Optional)</Label>
              <Input
                placeholder="The Old Gods, Elven Pantheon, etc."
                value={pantheon}
                onChange={(e) => setPantheon(e.target.value)}
                className="bg-slate-800/50"
              />
              <p className="text-xs text-slate-500">Group this deity with others</p>
            </div>

            {/* Concept */}
            <div className="space-y-2">
              <Label>Concept (Optional)</Label>
              <Textarea
                placeholder="Describe themes, origins, or specific aspects you want for this deity..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="bg-slate-800/50 min-h-[100px]"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || selectedDomains.length === 0}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Summoning Divine Power...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Deity
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
                    <div className="flex items-start gap-4">
                      {/* Symbol Display */}
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <Crown className="w-8 h-8 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-100">
                          {generatedData.name}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {generatedData.soul.titles.map((title, i) => (
                            <span key={i} className="text-sm text-purple-300 italic">
                              {title}{i < generatedData.soul.titles.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                            {DEITY_RANKS.find(r => r.value === generatedData.rank)?.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                            {generatedData.soul.portfolio.alignment}
                          </span>
                          {generatedData.soul.portfolio.domains.map((domain, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                              {domain}
                            </span>
                          ))}
                        </div>
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

              {/* Tabbed Content */}
              <StaggerItem>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg">
                  <Tabs defaultValue="portfolio" className="w-full">
                    <TabsList className="w-full justify-start border-b border-slate-800 rounded-none bg-transparent px-2 pt-2">
                      <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-800">
                        Portfolio
                      </TabsTrigger>
                      <TabsTrigger value="tenets" className="data-[state=active]:bg-slate-800">
                        Tenets & Prayers
                      </TabsTrigger>
                      <TabsTrigger value="signals" className="data-[state=active]:bg-slate-800">
                        Divine Signals
                      </TabsTrigger>
                      <TabsTrigger value="worship" className="data-[state=active]:bg-slate-800">
                        Worship
                      </TabsTrigger>
                      {showDmContent && (
                        <TabsTrigger value="secrets" className="data-[state=active]:bg-slate-800 text-red-400">
                          DM Secrets
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="mechanics" className="data-[state=active]:bg-slate-800">
                        Mechanics
                      </TabsTrigger>
                    </TabsList>

                    {/* Portfolio Tab */}
                    <TabsContent value="portfolio" className="p-6 space-y-6">
                      {/* Symbol */}
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/30">
                        <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                          <Sun className="w-4 h-4" /> Holy Symbol
                        </h4>
                        <p className="text-slate-200 text-lg">{generatedData.soul.portfolio.symbol}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Favored Weapon</h4>
                          <p className="text-slate-300">{generatedData.soul.portfolio.favored_weapon || 'None specified'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Holy Day</h4>
                          <p className="text-slate-300">{generatedData.soul.portfolio.holy_day || 'None specified'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Colors</h4>
                          <div className="flex gap-2">
                            {generatedData.soul.portfolio.sacred_colors.map((color, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-sm">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Animal</h4>
                          <p className="text-slate-300">{generatedData.soul.portfolio.sacred_animal || 'None specified'}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Manifestation</h4>
                        <p className="text-slate-300 leading-relaxed">{generatedData.soul.manifestation}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Personality</h4>
                        <p className="text-slate-300 leading-relaxed">{generatedData.soul.personality}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Divine Voice</h4>
                        <p className="text-slate-300 leading-relaxed italic">{generatedData.soul.voice}</p>
                      </div>
                    </TabsContent>

                    {/* Tenets & Prayers Tab */}
                    <TabsContent value="tenets" className="p-6 space-y-6">
                      {/* Tenets */}
                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                          <Scroll className="w-4 h-4" /> Sacred Tenets
                        </h4>
                        <div className="space-y-3">
                          {generatedData.soul.tenets.map((tenet, i) => (
                            <div
                              key={i}
                              className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-purple-500/50"
                            >
                              <span className="text-purple-400 font-bold mr-2">{i + 1}.</span>
                              <span className="text-slate-200">{tenet}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prayers */}
                      <div>
                        <h4 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4" /> Prayers
                          <span className="text-xs font-normal text-slate-500">(for players to speak)</span>
                        </h4>
                        <div className="space-y-3">
                          <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-amber-400 uppercase">Invocation</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(generatedData.soul.prayers.invocation, 'Invocation')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'Invocation' ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-slate-200 italic">&ldquo;{generatedData.soul.prayers.invocation}&rdquo;</p>
                          </div>

                          <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-amber-400 uppercase">Blessing</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(generatedData.soul.prayers.blessing, 'Blessing')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'Blessing' ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-slate-200 italic">&ldquo;{generatedData.soul.prayers.blessing}&rdquo;</p>
                          </div>

                          <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-amber-400 uppercase">Oath</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(generatedData.soul.prayers.oath, 'Oath')}
                                className="h-6 w-6 p-0"
                              >
                                {copiedText === 'Oath' ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-slate-200 italic">&ldquo;{generatedData.soul.prayers.oath}&rdquo;</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Divine Signals Tab */}
                    <TabsContent value="signals" className="p-6 space-y-6">
                      {/* Distance Indicator */}
                      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                        <span className="text-sm text-slate-400">Divine Involvement:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          generatedData.brain.divine_signals.distance === 'interventionist'
                            ? 'bg-green-500/20 text-green-400'
                            : generatedData.brain.divine_signals.distance === 'symbolic'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {generatedData.brain.divine_signals.distance.charAt(0).toUpperCase() +
                           generatedData.brain.divine_signals.distance.slice(1)}
                        </span>
                      </div>

                      {/* Omens */}
                      <div>
                        <h4 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Omens
                          <span className="text-xs font-normal text-slate-500">(Read Aloud)</span>
                        </h4>

                        <div className="space-y-4">
                          {/* Watching */}
                          <div className="p-4 bg-teal-500/5 border border-teal-500/30 rounded-lg">
                            <h5 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                              When {generatedData.name} is Watching...
                            </h5>
                            <ul className="space-y-2">
                              {generatedData.brain.divine_signals.omens.watching.map((omen, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                  <span className="text-teal-400">•</span>
                                  <span className="italic">{omen}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Pleased */}
                          <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                            <h5 className="text-xs font-semibold text-green-400 uppercase mb-2">
                              Signs of Divine Favor...
                            </h5>
                            <ul className="space-y-2">
                              {generatedData.brain.divine_signals.omens.pleased.map((omen, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                  <span className="text-green-400">✓</span>
                                  <span className="italic">{omen}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Angry */}
                          <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                            <h5 className="text-xs font-semibold text-red-400 uppercase mb-2">
                              Signs of Divine Displeasure...
                            </h5>
                            <ul className="space-y-2">
                              {generatedData.brain.divine_signals.omens.angry.map((omen, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                  <span className="text-red-400">⚠</span>
                                  <span className="italic">{omen}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Boons */}
                      {generatedData.brain.divine_signals.boons.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowBoons(!showBoons)}
                            className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2 hover:text-green-300"
                          >
                            <Flame className="w-4 h-4" /> Divine Boons
                            <span className="text-xs text-slate-500">({showBoons ? 'Hide' : 'Show'})</span>
                          </button>

                          {showBoons && (
                            <div className="grid gap-3">
                              {generatedData.brain.divine_signals.boons.map((boon, i) => (
                                <div key={i} className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                                  <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Trigger:</div>
                                  <p className="text-slate-300 mb-2">{boon.trigger}</p>
                                  <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Effect:</div>
                                  <p className="text-green-200 font-medium">{boon.effect}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Curses */}
                      {generatedData.brain.divine_signals.curses.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowCurses(!showCurses)}
                            className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2 hover:text-red-300"
                          >
                            <Zap className="w-4 h-4" /> Divine Curses
                            <span className="text-xs text-slate-500">({showCurses ? 'Hide' : 'Show'})</span>
                          </button>

                          {showCurses && (
                            <div className="grid gap-3">
                              {generatedData.brain.divine_signals.curses.map((curse, i) => (
                                <div key={i} className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                                  <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Trigger:</div>
                                  <p className="text-slate-300 mb-2">{curse.trigger}</p>
                                  <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Punishment:</div>
                                  <p className="text-red-200 font-medium">{curse.effect}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Worship Tab */}
                    <TabsContent value="worship" className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Followers</h4>
                          <p className="text-slate-300">{generatedData.soul.worship.followers}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Clergy Title</h4>
                          <p className="text-slate-300 font-medium text-lg">{generatedData.soul.worship.clergy_title}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Temple Style</h4>
                        <p className="text-slate-300 leading-relaxed">{generatedData.soul.worship.temple_style}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Rituals</h4>
                          <ul className="space-y-1">
                            {generatedData.soul.worship.rituals.map((ritual, i) => (
                              <li key={i} className="text-slate-300 flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                {ritual}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Offerings</h4>
                          <ul className="space-y-1">
                            {generatedData.soul.worship.offerings.map((offering, i) => (
                              <li key={i} className="text-slate-300 flex items-start gap-2">
                                <span className="text-amber-400">•</span>
                                {offering}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Taboos</h4>
                        <ul className="space-y-1">
                          {generatedData.soul.worship.taboos.map((taboo, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                              <span className="text-red-400">✕</span>
                              {taboo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>

                    {/* DM Secrets Tab */}
                    {showDmContent && (
                      <TabsContent value="secrets" className="p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <EyeOff className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400 font-medium">DM ONLY - Hidden from Players</span>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">True Nature</h4>
                          <p className="text-slate-300 leading-relaxed">{generatedData.brain.true_nature}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Divine Agenda</h4>
                          <p className="text-slate-300 leading-relaxed">{generatedData.brain.divine_agenda}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Secrets</h4>
                          <p className="text-slate-300 leading-relaxed">{generatedData.brain.secrets}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Conflicts</h4>
                          <p className="text-slate-300 leading-relaxed">{generatedData.brain.conflicts}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Weaknesses</h4>
                          <p className="text-slate-300 leading-relaxed">{generatedData.brain.weaknesses}</p>
                        </div>

                        {generatedData.brain.hooks?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Adventure Hooks</h4>
                            <ul className="space-y-2">
                              {generatedData.brain.hooks.map((hook, i) => (
                                <li key={i} className="text-slate-300 p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                                  <span className="text-purple-400 font-bold">{i + 1}.</span>
                                  {hook}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>
                    )}

                    {/* Mechanics Tab */}
                    <TabsContent value="mechanics" className="p-6 space-y-6">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Cleric Domains</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedData.mechanics.cleric_domains.map((domain, i) => (
                            <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md text-sm">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>

                      {generatedData.mechanics.channel_divinity && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Channel Divinity</h4>
                          <p className="text-slate-300 leading-relaxed p-3 bg-slate-800/50 rounded-lg">
                            {generatedData.mechanics.channel_divinity}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Sacred Spells</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedData.mechanics.sacred_spells.map((spell, i) => (
                            <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-md text-sm">
                              {spell}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Suggested Classes</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedData.mechanics.suggested_classes.map((cls, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-sm">
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </StaggerItem>

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
                      {generatedData.discoveries.map((discovery) => {
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
                                  <EntityTypeBadge
                                    type={discovery.entity_type as 'npc' | 'location' | 'faction' | 'item' | 'event' | 'deity'}
                                    size="sm"
                                  />
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

              {/* Action Buttons */}
              <StaggerItem>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 min-w-[200px] bg-teal-500 hover:bg-teal-600 text-black font-semibold"
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
