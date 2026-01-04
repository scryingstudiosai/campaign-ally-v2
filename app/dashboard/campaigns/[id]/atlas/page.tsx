'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  MapPin,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Search,
  Layers,
  Grid3X3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageTransition, StaggerContainer, StaggerItem, HoverLift, FadeIn } from '@/components/ui/motion'
import { MapCard } from '@/components/atlas/MapCard'
import { AddMapDialog } from '@/components/atlas/AddMapDialog'
import type { AtlasMap } from '@/app/api/campaigns/[id]/atlas/route'

type MapType = 'world' | 'region' | 'city' | 'dungeon' | 'building' | 'encounter' | 'other'

const mapTypeLabels: Record<MapType, string> = {
  world: 'World',
  region: 'Region',
  city: 'City',
  dungeon: 'Dungeon',
  building: 'Building',
  encounter: 'Encounter',
  other: 'Other',
}

const mapTypeIcons: Record<MapType, typeof Globe> = {
  world: Globe,
  region: Layers,
  city: Grid3X3,
  dungeon: MapPin,
  building: Grid3X3,
  encounter: MapPin,
  other: MapPin,
}

export default function AtlasPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [maps, setMaps] = useState<AtlasMap[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MapType | 'all'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addDialogMode, setAddDialogMode] = useState<'upload' | 'url'>('upload')

  useEffect(() => {
    fetchMaps()
  }, [campaignId])

  async function fetchMaps() {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/atlas`)
      if (res.ok) {
        const data = await res.json()
        setMaps(data)
      }
    } catch (error) {
      console.error('Failed to fetch maps:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteMap(mapId: string) {
    if (!confirm('Are you sure you want to delete this map?')) return

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/atlas/${mapId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMaps(maps.filter((m) => m.id !== mapId))
      }
    } catch (error) {
      console.error('Failed to delete map:', error)
    }
  }

  async function handleTogglePublic(map: AtlasMap) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/atlas/${map.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !map.is_public }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMaps(maps.map((m) => (m.id === map.id ? updated : m)))
      }
    } catch (error) {
      console.error('Failed to update map:', error)
    }
  }

  function handleMapAdded(newMap: AtlasMap) {
    setMaps([newMap, ...maps])
    setShowAddDialog(false)
  }

  // Filter maps
  const filteredMaps = maps.filter((map) => {
    const matchesSearch = map.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || map.map_type === typeFilter
    return matchesSearch && matchesType
  })

  // Group by type for display
  const mapsByType = filteredMaps.reduce(
    (acc, map) => {
      const type = map.map_type as MapType
      if (!acc[type]) acc[type] = []
      acc[type].push(map)
      return acc
    },
    {} as Record<MapType, AtlasMap[]>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                  <Globe className="w-6 h-6 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold">Campaign Atlas</h1>
              </div>
              <p className="text-slate-400">
                Manage and explore your campaign&apos;s maps
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Map
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/campaigns/${campaignId}/forge/map`)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                  Generate with AI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setAddDialogMode('upload')
                    setShowAddDialog(true)
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setAddDialogMode('url')
                    setShowAddDialog(true)
                  }}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link External URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </FadeIn>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search maps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-white/10"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                All
              </Button>
              {(Object.keys(mapTypeLabels) as MapType[]).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  {mapTypeLabels[type]}
                </Button>
              ))}
            </div>
          </div>

          {/* Maps Grid */}
          {filteredMaps.length > 0 ? (
            typeFilter === 'all' ? (
              // Show grouped by type when no filter
              <div className="space-y-8">
                {(Object.keys(mapsByType) as MapType[]).map((type) => (
                  <div key={type}>
                    <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      {(() => {
                        const Icon = mapTypeIcons[type]
                        return <Icon className="w-5 h-5 text-teal-400" />
                      })()}
                      {mapTypeLabels[type]} Maps ({mapsByType[type].length})
                    </h2>
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mapsByType[type].map((map) => (
                        <StaggerItem key={map.id}>
                          <HoverLift>
                            <MapCard
                              map={map}
                              campaignId={campaignId}
                              onDelete={() => handleDeleteMap(map.id)}
                              onTogglePublic={() => handleTogglePublic(map)}
                            />
                          </HoverLift>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                ))}
              </div>
            ) : (
              // Show flat grid when filtered
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaps.map((map) => (
                  <StaggerItem key={map.id}>
                    <HoverLift>
                      <MapCard
                        map={map}
                        campaignId={campaignId}
                        onDelete={() => handleDeleteMap(map.id)}
                        onTogglePublic={() => handleTogglePublic(map)}
                      />
                    </HoverLift>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )
          ) : (
            // Empty State
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Globe className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-300 mb-2">
                {searchQuery || typeFilter !== 'all' ? 'No Maps Found' : 'No Maps Yet'}
              </h2>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first map to start building your campaign\'s visual world.'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => router.push(`/dashboard/campaigns/${campaignId}/forge/map`)}
                    className="bg-gradient-to-r from-purple-600 to-teal-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddDialogMode('upload')
                      setShowAddDialog(true)
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Map
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Map Dialog */}
      <AddMapDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        campaignId={campaignId}
        mode={addDialogMode}
        onMapAdded={handleMapAdded}
      />
    </PageTransition>
  )
}
