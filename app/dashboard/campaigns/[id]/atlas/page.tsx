'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  MapPin,
  ChevronRight,
  Loader2,
  Image,
  ArrowLeft,
  Search,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PageTransition, StaggerContainer, StaggerItem, HoverLift, FadeIn } from '@/components/ui/motion'

interface Location {
  id: string
  name: string
  entity_type: string
  sub_type: string | null
  summary: string | null
  soul: {
    map_url?: string
    location_type?: string
    settlement_size?: string
  } | null
  parent_location_id?: string
  attributes: Record<string, unknown> | null
}

interface LocationWithChildren extends Location {
  children: LocationWithChildren[]
  markerCount: number
}

export default function AtlasPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [locations, setLocations] = useState<Location[]>([])
  const [markerCounts, setMarkerCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [locationsRes, markersRes] = await Promise.all([
          fetch(`/api/campaigns/${campaignId}/entities?type=location`),
          fetch(`/api/campaigns/${campaignId}/markers/counts`),
        ])

        if (locationsRes.ok) {
          const data = await locationsRes.json()
          setLocations(data.filter((l: Location) => l.entity_type === 'location'))
        }

        if (markersRes.ok) {
          const counts = await markersRes.json()
          setMarkerCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch atlas data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [campaignId])

  // Filter locations that have maps
  const locationsWithMaps = locations.filter((l) => l.soul?.map_url)
  const locationsWithoutMaps = locations.filter((l) => !l.soul?.map_url)

  // Search filter
  const filteredLocations = searchQuery
    ? locations.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null

  // Build tree structure for hierarchy view
  const buildTree = (locations: Location[]): LocationWithChildren[] => {
    const map = new Map<string, LocationWithChildren>()
    const roots: LocationWithChildren[] = []

    // Create nodes
    locations.forEach((loc) => {
      map.set(loc.id, {
        ...loc,
        children: [],
        markerCount: markerCounts[loc.id] || 0,
      })
    })

    // Build tree
    locations.forEach((loc) => {
      const node = map.get(loc.id)!
      const parentId = loc.attributes?.parent_location_id as string | undefined
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const renderLocationCard = (location: Location) => {
    const hasMap = !!location.soul?.map_url
    const markerCount = markerCounts[location.id] || 0
    const locationType = location.sub_type || location.soul?.location_type || 'Location'

    return (
      <button
        key={location.id}
        onClick={() => router.push(`/dashboard/campaigns/${campaignId}/memory/${location.id}`)}
        className={cn(
          'group relative rounded-xl border overflow-hidden text-left transition-all',
          hasMap
            ? 'border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-slate-900/50 hover:border-teal-500/50'
            : 'border-white/10 bg-slate-900/50 hover:border-white/20'
        )}
      >
        {/* Map Preview */}
        <div className="aspect-video relative overflow-hidden bg-slate-800">
          {hasMap ? (
            <>
              <img
                src={location.soul!.map_url}
                alt={location.name}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              {markerCount > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-teal-500/90 text-white text-xs font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {markerCount}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-12 h-12 text-slate-700" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-white group-hover:text-teal-400 transition-colors">
                {location.name}
              </h3>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{locationType}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors flex-shrink-0" />
          </div>
          {location.summary && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{location.summary}</p>
          )}
        </div>
      </button>
    )
  }

  const renderTreeNode = (node: LocationWithChildren, depth = 0) => {
    const hasMap = !!node.soul?.map_url
    const locationType = node.sub_type || node.soul?.location_type || 'Location'

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }}>
        <button
          onClick={() => router.push(`/dashboard/campaigns/${campaignId}/memory/${node.id}`)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
            hasMap
              ? 'bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40'
              : 'hover:bg-slate-800/50'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              hasMap ? 'bg-teal-500/20' : 'bg-slate-800'
            )}
          >
            {hasMap ? (
              <Globe className={cn('w-5 h-5', hasMap ? 'text-teal-400' : 'text-slate-500')} />
            ) : (
              <MapPin className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white truncate">{node.name}</span>
              {hasMap && (
                <Badge variant="outline" className="text-teal-400 border-teal-500/30 text-xs">
                  Has Map
                </Badge>
              )}
              {node.markerCount > 0 && (
                <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
                  {node.markerCount} pins
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 capitalize">{locationType}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
        {node.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

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
              Explore your world&apos;s geography with interactive maps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
            >
              <Layers className="w-4 h-4 mr-1" />
              Hierarchy
            </Button>
          </div>
        </FadeIn>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50 border-white/10"
          />
        </div>

        {/* Search Results */}
        {filteredLocations && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">
              Search Results ({filteredLocations.length})
            </h2>
            {filteredLocations.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No locations found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocations.map(renderLocationCard)}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        {!filteredLocations && (
          <>
            {viewMode === 'grid' ? (
              <>
                {/* Locations with Maps */}
                {locationsWithMaps.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-teal-400 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Mapped Locations ({locationsWithMaps.length})
                    </h2>
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05}>
                      {locationsWithMaps.map((location) => (
                        <StaggerItem key={location.id}>
                          <HoverLift>{renderLocationCard(location)}</HoverLift>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                )}

                {/* Locations without Maps */}
                {locationsWithoutMaps.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-400 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Unmapped Locations ({locationsWithoutMaps.length})
                    </h2>
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" delay={0.2} staggerDelay={0.05}>
                      {locationsWithoutMaps.map((location) => (
                        <StaggerItem key={location.id}>
                          <HoverLift>{renderLocationCard(location)}</HoverLift>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                )}
              </>
            ) : (
              /* Tree View */
              <div className="space-y-2">
                {buildTree(locations).map((node) => renderTreeNode(node))}
              </div>
            )}

            {/* Empty State */}
            {locations.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <Globe className="w-10 h-10 text-slate-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-300 mb-2">No Locations Yet</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Create locations in the Location Forge to start building your world&apos;s atlas.
                </p>
                <Button asChild>
                  <Link href={`/dashboard/campaigns/${campaignId}/forge/location`}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Create Location
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PageTransition>
  )
}
