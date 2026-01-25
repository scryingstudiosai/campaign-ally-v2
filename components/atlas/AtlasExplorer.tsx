'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { AtlasBreadcrumb } from './AtlasBreadcrumb'
import { AtlasMarker } from './AtlasMarker'
import { AtlasSidePanel } from './AtlasSidePanel'
import { EntityQuickView } from './EntityQuickView'
import { cn } from '@/lib/utils'
import { Search, Edit, ZoomIn, ZoomOut, Maximize2, Layers, Eye, Swords, Users, MapPin, ArrowLeft, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { LivingEntity } from '@/types/living-entity'
import type { MapMarker } from './AtlasMap'

type Lens = 'all' | 'active' | 'threat' | 'social' | 'places'

interface AtlasExplorerProps {
  campaignId: string
  rootLocation: LivingEntity
  allLocationsWithMaps: LivingEntity[]
}

export function AtlasExplorer({
  campaignId,
  rootLocation,
  allLocationsWithMaps,
}: AtlasExplorerProps) {
  const router = useRouter()
  const supabase = createClient()
  const transformRef = useRef<any>(null)

  // Current location being viewed
  const [currentLocation, setCurrentLocation] = useState<LivingEntity>(rootLocation)
  const [childLocations, setChildLocations] = useState<LivingEntity[]>([])
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [breadcrumbPath, setBreadcrumbPath] = useState<LivingEntity[]>([rootLocation])

  // UI State
  const [activeLens, setActiveLens] = useState<Lens>('all')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<LivingEntity | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  const [currentScale, setCurrentScale] = useState(1)

  // Edit mode state for adding markers
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [showEntitySelector, setShowEntitySelector] = useState(false)
  const [entitySearchQuery, setEntitySearchQuery] = useState('')
  const [availableEntities, setAvailableEntities] = useState<LivingEntity[]>([])
  const mapImageRef = useRef<HTMLImageElement>(null)

  // Debug: Log edit mode changes
  useEffect(() => {
    console.log('[Atlas Debug] Edit mode changed:', isEditMode)
  }, [isEditMode])

  // Fetch location data when current location changes
  useEffect(() => {
    const fetchLocationData = async () => {
      // Re-fetch the current location to ensure we have all fields
      const { data: freshLocation } = await supabase
        .from('entities')
        .select('*')
        .eq('id', currentLocation.id)
        .single()

      if (freshLocation) {
        const typedLocation = freshLocation as unknown as LivingEntity
        if (typedLocation.attributes?.map_image_url !== currentLocation.attributes?.map_image_url) {
          setCurrentLocation(typedLocation)
        }
      }

      // Get child locations
      const { data: allLocations } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .is('deleted_at', null)

      // Filter children based on parent_id (DB column) or attributes.parent_entity_id (legacy)
      const children = (allLocations || []).filter((loc) => {
        const dbParentId = (loc as Record<string, unknown>).parent_id as string | undefined
        const attrParentId = loc.attributes?.parent_entity_id as string | undefined
        return dbParentId === currentLocation.id || attrParentId === currentLocation.id
      }) as unknown as LivingEntity[]

      setChildLocations(children)

      // Get markers for this location (if map_markers table exists)
      try {
        const { data: markerData } = await supabase
          .from('map_markers')
          .select(`*, linked_entity:entities!linked_entity_id(*)`)
          .eq('location_id', currentLocation.id)

        if (markerData) {
          const typedMarkers = markerData.map((m) => ({
            id: m.id,
            location_id: m.location_id,
            linked_entity_id: m.linked_entity_id,
            linked_entity: m.linked_entity as unknown as LivingEntity | undefined,
            x_percent: m.x_percent,
            y_percent: m.y_percent,
            is_revealed: m.is_revealed,
            has_active_quest: m.has_active_quest,
            label: m.label,
          }))
          setMarkers(typedMarkers)
        }
      } catch {
        // map_markers table might not exist yet
        setMarkers([])
      }
    }

    fetchLocationData()
  }, [currentLocation.id, campaignId, supabase])

  // Fetch available entities for linking markers
  useEffect(() => {
    const fetchEntities = async () => {
      const { data } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .neq('status', 'archived')
        .order('name')

      if (data) {
        setAvailableEntities(data as unknown as LivingEntity[])
      }
    }

    fetchEntities()
  }, [campaignId, supabase])

  // Build breadcrumb path
  useEffect(() => {
    const buildPath = async () => {
      const path: LivingEntity[] = [currentLocation]
      let current = currentLocation

      // Check both parent_id (DB column) and attributes.parent_entity_id (legacy)
      const getParentId = (loc: LivingEntity): string | undefined => {
        const dbParentId = (loc as Record<string, unknown>).parent_id as string | undefined
        const attrParentId = loc.attributes?.parent_entity_id as string | undefined
        return dbParentId || attrParentId
      }

      while (getParentId(current)) {
        const parentId = getParentId(current) as string
        const { data: parent } = await supabase
          .from('entities')
          .select('*')
          .eq('id', parentId)
          .single()

        if (parent) {
          const typedParent = parent as unknown as LivingEntity
          path.unshift(typedParent)
          current = typedParent
        } else {
          break
        }
      }

      setBreadcrumbPath(path)
    }

    buildPath()
  }, [currentLocation.id, supabase])

  // Navigate to a child location (drill down)
  const handleDrillDown = useCallback((location: LivingEntity) => {
    if (location.attributes?.map_image_url) {
      setCurrentLocation(location)
      transformRef.current?.resetTransform()
    } else {
      setSelectedEntity(location)
      setShowQuickView(true)
    }
  }, [])

  // Handle marker/location click
  const handleMarkerClick = useCallback(
    (entity: LivingEntity) => {
      if (entity.entity_type === 'location') {
        if (entity.attributes?.map_image_url) {
          handleDrillDown(entity)
        } else {
          setSelectedEntity(entity)
          setShowQuickView(true)
        }
      } else {
        setSelectedEntity(entity)
        setShowQuickView(true)
      }
    },
    [handleDrillDown]
  )

  // Handle click on map in edit mode
  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      console.log('[Atlas Debug] === MAP CLICK ===')
      console.log('[Atlas Debug] isEditMode:', isEditMode)
      console.log('[Atlas Debug] mapImageRef.current:', !!mapImageRef.current)
      console.log('[Atlas Debug] Click target:', (e.target as HTMLElement).tagName)
      console.log('[Atlas Debug] Event type:', e.type)

      if (!isEditMode) {
        console.log('[Atlas Debug] Early return - not in edit mode')
        return
      }
      if (!mapImageRef.current) {
        console.log('[Atlas Debug] Early return - no mapImageRef')
        return
      }

      // Get the click position relative to the image
      const rect = mapImageRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      console.log('[Atlas Debug] Calculated position:', { x, y })

      // Set pending position and show entity selector
      setPendingMarkerPosition({ x, y })
      setShowEntitySelector(true)
      setEntitySearchQuery('')
    },
    [isEditMode]
  )

  // Save a new marker to the database
  const handleSaveMarker = useCallback(
    async (linkedEntity: LivingEntity | null, customLabel?: string) => {
      if (!pendingMarkerPosition) return

      try {
        if (linkedEntity?.entity_type === 'location') {
          // For location entities, save the position on the entity itself
          const { error } = await supabase
            .from('entities')
            .update({
              attributes: {
                ...linkedEntity.attributes,
                map_x: pendingMarkerPosition.x,
                map_y: pendingMarkerPosition.y,
                parent_entity_id: currentLocation.id,
              },
            })
            .eq('id', linkedEntity.id)

          if (error) throw error

          toast.success(`Placed "${linkedEntity.name}" on the map`)

          // Update local state
          setChildLocations((prev) => {
            const existing = prev.find((c) => c.id === linkedEntity.id)
            if (existing) {
              return prev.map((c) =>
                c.id === linkedEntity.id
                  ? {
                      ...c,
                      attributes: {
                        ...c.attributes,
                        map_x: pendingMarkerPosition.x,
                        map_y: pendingMarkerPosition.y,
                      },
                    }
                  : c
              )
            } else {
              return [
                ...prev,
                {
                  ...linkedEntity,
                  attributes: {
                    ...linkedEntity.attributes,
                    map_x: pendingMarkerPosition.x,
                    map_y: pendingMarkerPosition.y,
                  },
                },
              ]
            }
          })
        } else {
          // For non-location entities, create a marker in map_markers table
          const { error } = await supabase.from('map_markers').insert({
            location_id: currentLocation.id,
            linked_entity_id: linkedEntity?.id || null,
            x_percent: pendingMarkerPosition.x,
            y_percent: pendingMarkerPosition.y,
            is_revealed: true,
            label: customLabel || null,
          })

          if (error) throw error

          toast.success(
            linkedEntity
              ? `Placed "${linkedEntity.name}" on the map`
              : `Added marker "${customLabel}" to the map`
          )

          // Refresh markers
          const { data: markerData } = await supabase
            .from('map_markers')
            .select(`*, linked_entity:entities!linked_entity_id(*)`)
            .eq('location_id', currentLocation.id)

          if (markerData) {
            const typedMarkers = markerData.map((m) => ({
              id: m.id,
              location_id: m.location_id,
              linked_entity_id: m.linked_entity_id,
              linked_entity: m.linked_entity as unknown as LivingEntity | undefined,
              x_percent: m.x_percent,
              y_percent: m.y_percent,
              is_revealed: m.is_revealed,
              has_active_quest: m.has_active_quest,
              label: m.label,
            }))
            setMarkers(typedMarkers)
          }
        }
      } catch (error) {
        console.error('Failed to save marker:', error)
        toast.error('Failed to place marker')
      }

      // Close the selector
      setPendingMarkerPosition(null)
      setShowEntitySelector(false)
    },
    [pendingMarkerPosition, currentLocation, supabase]
  )

  // Filter entities for the selector
  const filteredEntities = availableEntities.filter(
    (e) =>
      e.name.toLowerCase().includes(entitySearchQuery.toLowerCase()) &&
      e.id !== currentLocation.id // Don't allow linking to self
  )

  // Filter markers by lens
  const getMarkerVisibility = (entity: LivingEntity, hasActiveQuest: boolean): boolean => {
    if (activeLens === 'all') return true

    switch (activeLens) {
      case 'active':
        return hasActiveQuest
      case 'threat':
        return ['creature', 'encounter'].includes(entity.entity_type)
      case 'social':
        return ['npc', 'faction', 'player'].includes(entity.entity_type)
      case 'places':
        return entity.entity_type === 'location'
      default:
        return true
    }
  }

  const LENS_OPTIONS: { id: Lens; label: string; icon: typeof Layers }[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'active', label: 'Active', icon: Eye },
    { id: 'threat', label: 'Threats', icon: Swords },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'places', label: 'Places', icon: MapPin },
  ]

  const mapImageUrl = currentLocation.attributes?.map_image_url as string | undefined

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Top Bar - Back Button + Breadcrumb */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-lg bg-slate-800/90 text-slate-300 hover:bg-slate-700 backdrop-blur-sm shadow-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <AtlasBreadcrumb
          path={breadcrumbPath}
          campaignId={campaignId}
          onNavigate={(location) => {
            setCurrentLocation(location)
            transformRef.current?.resetTransform()
          }}
        />
      </div>

      {/* Top Bar - Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowSidePanel(!showSidePanel)}
          className={cn(
            'p-2.5 rounded-lg transition-colors shadow-lg',
            showSidePanel
              ? 'bg-teal-600 text-white'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 backdrop-blur-sm'
          )}
          title="Search locations"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            console.log('[Atlas Debug] Edit button clicked, toggling from', isEditMode, 'to', !isEditMode)
            setIsEditMode(!isEditMode)
          }}
          className={cn(
            'p-2.5 rounded-lg transition-colors shadow-lg',
            isEditMode
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 backdrop-blur-sm'
          )}
          title="Edit mode"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>

      {/* Lens Control (Center Top) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-slate-700">
          {LENS_OPTIONS.map((lens) => {
            const Icon = lens.icon
            const isActive = activeLens === lens.id

            return (
              <button
                key={lens.id}
                onClick={() => setActiveLens(lens.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{lens.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Map Area */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.2}
        maxScale={6}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: isEditMode }}
        onTransformed={(_, state) => setCurrentScale(state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls (Bottom Left) */}
            <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors"
                title="Reset view"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Scale Indicator */}
            <div className="absolute bottom-6 left-20 z-30 px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs text-slate-400 backdrop-blur-sm">
              {Math.round(currentScale * 100)}%
            </div>

            {/* The Map */}
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <div
                className="relative inline-block"
                onClick={(e) => {
                  console.log('[Atlas Debug] Wrapper div onClick fired')
                  handleMapClick(e)
                }}
                onPointerUp={(e) => {
                  console.log('[Atlas Debug] Wrapper div onPointerUp fired, button:', e.button)
                  if (isEditMode && e.button === 0) {
                    handleMapClick(e as unknown as React.MouseEvent<HTMLDivElement>)
                  }
                }}
                style={{ cursor: isEditMode ? 'crosshair' : 'grab' }}
              >
                {/* Map Image */}
                {mapImageUrl && (
                  <img
                    ref={mapImageRef}
                    src={mapImageUrl}
                    alt={`Map of ${currentLocation.name}`}
                    className={cn(
                      'max-w-none select-none',
                      isEditMode && 'cursor-crosshair'
                    )}
                    draggable={false}
                    style={{
                      maxHeight: 'calc(100vh - 2rem)',
                      width: 'auto',
                    }}
                  />
                )}

                {/* Pending marker indicator */}
                {pendingMarkerPosition && mapImageRef.current && (
                  <div
                    className="absolute w-6 h-6 rounded-full border-2 border-dashed border-teal-400 bg-teal-500/30 animate-pulse pointer-events-none"
                    style={{
                      left: `${pendingMarkerPosition.x}%`,
                      top: `${pendingMarkerPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}

                {/* Child Location Markers (Drill-Down Points) */}
                {childLocations
                  .filter((loc) => loc.attributes?.map_x != null && loc.attributes?.map_y != null)
                  .filter((loc) => getMarkerVisibility(loc, false))
                  .map((location) => (
                    <AtlasMarker
                      key={location.id}
                      entity={location}
                      x={location.attributes?.map_x as number}
                      y={location.attributes?.map_y as number}
                      isRevealed={location.status !== 'stub'}
                      hasActiveQuest={false}
                      isFocused={false}
                      emphasis="full"
                      isDrillDown={!!location.attributes?.map_image_url}
                      onClick={() => handleMarkerClick(location)}
                    />
                  ))}

                {/* Regular Markers (NPCs, Items, Encounters, etc.) */}
                {markers
                  .filter((m) => m.linked_entity)
                  .filter((m) => getMarkerVisibility(m.linked_entity!, m.has_active_quest || false))
                  .map((marker) => (
                    <AtlasMarker
                      key={marker.id}
                      entity={marker.linked_entity!}
                      x={marker.x_percent}
                      y={marker.y_percent}
                      isRevealed={marker.is_revealed}
                      hasActiveQuest={marker.has_active_quest}
                      isFocused={false}
                      emphasis="full"
                      isDrillDown={false}
                      onClick={() => handleMarkerClick(marker.linked_entity!)}
                    />
                  ))}

                {/* Edit Mode Indicator */}
                {isEditMode && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                    Edit Mode - Click map to add marker
                  </div>
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Location Info (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-slate-900/95 backdrop-blur-sm px-6 py-3 rounded-xl border border-slate-700 shadow-xl text-center">
          <h2 className="font-bold text-white text-lg">{currentLocation.name}</h2>
          <p className="text-sm text-slate-400 capitalize">{currentLocation.sub_type}</p>
          {childLocations.length > 0 && (
            <p className="text-xs text-teal-400 mt-1">
              {childLocations.filter((c) => c.attributes?.map_image_url).length} explorable •{' '}
              {childLocations.length} total locations
            </p>
          )}
        </div>
      </div>

      {/* Side Panel (Search / Browse) */}
      {showSidePanel && (
        <AtlasSidePanel
          campaignId={campaignId}
          currentLocation={currentLocation}
          allLocations={allLocationsWithMaps}
          onSelectLocation={(loc) => {
            handleDrillDown(loc)
            setShowSidePanel(false)
          }}
          onClose={() => setShowSidePanel(false)}
        />
      )}

      {/* Quick View Modal */}
      {showQuickView && selectedEntity && (
        <EntityQuickView
          entity={selectedEntity}
          campaignId={campaignId}
          isOpen={showQuickView}
          onClose={() => {
            setShowQuickView(false)
            setSelectedEntity(null)
          }}
          onOpenFull={() => {
            router.push(`/dashboard/campaigns/${campaignId}/memory/${selectedEntity.id}`)
          }}
          onAddMap={
            selectedEntity.entity_type === 'location' && !selectedEntity.attributes?.map_image_url
              ? () => {
                  router.push(`/dashboard/campaigns/${campaignId}/atlas/${selectedEntity.id}?addMap=true`)
                }
              : undefined
          }
        />
      )}

      {/* Entity Selector Modal for Adding Markers */}
      {showEntitySelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Place Marker</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEntitySelector(false)
                    setPendingMarkerPosition(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search entities to link..."
                  value={entitySearchQuery}
                  onChange={(e) => setEntitySearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700"
                  autoFocus
                />
              </div>
            </div>

            {/* Entity List */}
            <div className="max-h-80 overflow-auto p-2">
              {/* Custom label option */}
              <button
                onClick={() => {
                  const label = prompt('Enter marker label:')
                  if (label) {
                    handleSaveMarker(null, label)
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">Custom Label</p>
                  <p className="text-xs text-slate-500">Add marker without linking to entity</p>
                </div>
              </button>

              {/* Location entities (for drill-down points) */}
              {filteredEntities.filter((e) => e.entity_type === 'location').length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider mt-2">
                    Locations (Drill-Down Points)
                  </div>
                  {filteredEntities
                    .filter((e) => e.entity_type === 'location')
                    .slice(0, 15)
                    .map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleSaveMarker(entity)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{entity.name}</p>
                          <p className="text-xs text-slate-500 capitalize">
                            {entity.sub_type || 'location'}
                            {entity.attributes?.map_image_url && ' • Has map'}
                          </p>
                        </div>
                      </button>
                    ))}
                </>
              )}

              {/* Other entities */}
              {filteredEntities.filter((e) => e.entity_type !== 'location').length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider mt-2">
                    Other Entities
                  </div>
                  {filteredEntities
                    .filter((e) => e.entity_type !== 'location')
                    .slice(0, 15)
                    .map((entity) => {
                      const iconColors: Record<string, string> = {
                        npc: 'bg-blue-500/20 text-blue-400',
                        creature: 'bg-orange-500/20 text-orange-400',
                        item: 'bg-amber-500/20 text-amber-400',
                        faction: 'bg-red-500/20 text-red-400',
                        quest: 'bg-purple-500/20 text-purple-400',
                      }
                      const colorClass = iconColors[entity.entity_type] || 'bg-slate-700 text-slate-400'

                      return (
                        <button
                          key={entity.id}
                          onClick={() => handleSaveMarker(entity)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left"
                        >
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', colorClass.split(' ')[0])}>
                            {entity.entity_type === 'npc' && <Users className={cn('w-5 h-5', colorClass.split(' ')[1])} />}
                            {entity.entity_type === 'creature' && <Swords className={cn('w-5 h-5', colorClass.split(' ')[1])} />}
                            {entity.entity_type === 'item' && <Eye className={cn('w-5 h-5', colorClass.split(' ')[1])} />}
                            {entity.entity_type === 'faction' && <Layers className={cn('w-5 h-5', colorClass.split(' ')[1])} />}
                            {entity.entity_type === 'quest' && <MapPin className={cn('w-5 h-5', colorClass.split(' ')[1])} />}
                            {!['npc', 'creature', 'item', 'faction', 'quest'].includes(entity.entity_type) && (
                              <MapPin className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{entity.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{entity.entity_type}</p>
                          </div>
                        </button>
                      )
                    })}
                </>
              )}

              {filteredEntities.length === 0 && entitySearchQuery && (
                <p className="text-center text-slate-500 py-6 text-sm">No entities found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
