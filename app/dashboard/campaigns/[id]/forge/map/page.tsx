'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Globe,
  Sparkles,
  Loader2,
  MapPin,
  ArrowLeft,
  Image as ImageIcon,
  Download,
  Save,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PageTransition, FadeIn } from '@/components/ui/motion'
import Link from 'next/link'

type MapType = 'world' | 'region' | 'city' | 'dungeon' | 'building' | 'encounter' | 'other'
type MapStyle = 'parchment' | 'satellite' | 'artistic' | 'hand-drawn' | 'fantasy' | 'realistic'

const mapTypeLabels: Record<MapType, string> = {
  world: 'World Map',
  region: 'Region Map',
  city: 'City Map',
  dungeon: 'Dungeon Map',
  building: 'Building Floor Plan',
  encounter: 'Encounter/Battle Map',
  other: 'Other',
}

const mapStyleLabels: Record<MapStyle, string> = {
  parchment: 'Parchment / Antique',
  satellite: 'Satellite / Aerial',
  artistic: 'Artistic / Painted',
  'hand-drawn': 'Hand-drawn / Sketched',
  fantasy: 'Fantasy / Stylized',
  realistic: 'Realistic / Modern',
}

interface GeneratedMap {
  name: string
  description: string
  imageUrl: string
  style: string
  mapType: MapType
  suggestedPOIs: Array<{
    name: string
    description: string
    type: string
  }>
}

export default function MapForgePage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  // Form state
  const [name, setName] = useState('')
  const [concept, setConcept] = useState('')
  const [mapType, setMapType] = useState<MapType>('region')
  const [style, setStyle] = useState<MapStyle>('fantasy')
  const [linkedEntityId, setLinkedEntityId] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null)
  const [saving, setSaving] = useState(false)

  // Entities for linking
  const [entities, setEntities] = useState<Array<{ id: string; name: string; entity_type: string }>>([])

  useEffect(() => {
    fetchEntities()
  }, [campaignId])

  async function fetchEntities() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/entities?type=location`)
      if (res.ok) {
        const data = await res.json()
        setEntities(data)
      }
    } catch (error) {
      console.error('Failed to fetch entities:', error)
    }
  }

  async function handleGenerate() {
    if (!concept.trim()) {
      toast.error('Please describe your map concept')
      return
    }

    setGenerating(true)
    setGeneratedMap(null)

    try {
      const res = await fetch('/api/generate/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          name: name.trim() || undefined,
          concept: concept.trim(),
          mapType,
          style,
          linkedEntityId: linkedEntityId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()
      setGeneratedMap(data.map)
      if (data.map.name && !name) {
        setName(data.map.name)
      }
      toast.success('Map generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate map')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedMap) return

    setSaving(true)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/atlas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || generatedMap.name,
          description: generatedMap.description,
          imageUrl: generatedMap.imageUrl,
          sourceType: 'ai_generated',
          mapType: generatedMap.mapType,
          style: generatedMap.style,
          linkedEntityId: linkedEntityId || null,
          poiData: generatedMap.suggestedPOIs.map((poi, i) => ({
            id: `poi-${i}`,
            label: poi.name,
            description: poi.description,
            x_percent: 20 + Math.random() * 60,
            y_percent: 20 + Math.random() * 60,
            icon: poi.type,
          })),
          metadata: {
            generationConcept: concept,
            generatedAt: new Date().toISOString(),
          },
          isPublic: false,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save map')
      }

      toast.success('Map saved to your atlas!')
      router.push(`/dashboard/campaigns/${campaignId}/atlas`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save map')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <FadeIn className="mb-8">
            <Link
              href={`/dashboard/campaigns/${campaignId}/atlas`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Atlas
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Map Forge</h1>
                <p className="text-slate-400">Generate maps with AI</p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  Map Details
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Map Name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="Leave blank to auto-generate"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Concept */}
                  <div className="space-y-2">
                    <Label htmlFor="concept">Describe Your Map *</Label>
                    <Textarea
                      id="concept"
                      placeholder="e.g., A coastal trading city with a large harbor, surrounded by farmlands and forests. The city has a castle on a hill overlooking the bay..."
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-slate-500">
                      Be descriptive! Include terrain, landmarks, settlements, and any notable features.
                    </p>
                  </div>

                  {/* Map Type */}
                  <div className="space-y-2">
                    <Label>Map Type</Label>
                    <Select value={mapType} onValueChange={(v) => setMapType(v as MapType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(mapTypeLabels) as MapType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {mapTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Style */}
                  <div className="space-y-2">
                    <Label>Visual Style</Label>
                    <Select value={style} onValueChange={(v) => setStyle(v as MapStyle)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(mapStyleLabels) as MapStyle[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {mapStyleLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Link to Entity */}
                  <div className="space-y-2">
                    <Label>Link to Location (optional)</Label>
                    <Select value={linkedEntityId} onValueChange={setLinkedEntityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !concept.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Map...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Map
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-teal-400" />
                  Preview
                </h2>

                {generatedMap ? (
                  <div className="space-y-4">
                    {/* Map Image */}
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-800 border border-white/10">
                      <img
                        src={generatedMap.imageUrl}
                        alt={generatedMap.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Map Info */}
                    <div>
                      <h3 className="font-semibold text-white">{name || generatedMap.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{generatedMap.description}</p>
                    </div>

                    {/* Suggested POIs */}
                    {generatedMap.suggestedPOIs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Suggested Points of Interest
                        </h4>
                        <div className="space-y-2">
                          {generatedMap.suggestedPOIs.map((poi, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-slate-800/50 border border-white/5"
                            >
                              <span className="text-sm text-white">{poi.name}</span>
                              <p className="text-xs text-slate-500 mt-0.5">{poi.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save to Atlas
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-800/50 border border-dashed border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        Your generated map will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
