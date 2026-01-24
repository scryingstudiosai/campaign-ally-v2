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
import { Search, Edit, ZoomIn, ZoomOut, Maximize2, Layers, Eye, Swords, Users, MapPin } from 'lucide-react'
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

      // Filter children based on parent_entity_id in attributes
      const children = (allLocations || []).filter(
        (loc) => loc.attributes?.parent_entity_id === currentLocation.id
      ) as unknown as LivingEntity[]

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

  // Build breadcrumb path
  useEffect(() => {
    const buildPath = async () => {
      const path: LivingEntity[] = [currentLocation]
      let current = currentLocation

      while (current.attributes?.parent_entity_id) {
        const parentId = current.attributes.parent_entity_id as string
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
      {/* Top Bar - Breadcrumb */}
      <div className="absolute top-4 left-4 z-30">
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
          onClick={() => setIsEditMode(!isEditMode)}
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
              <div className="relative inline-block">
                {/* Map Image */}
                {mapImageUrl && (
                  <img
                    src={mapImageUrl}
                    alt={`Map of ${currentLocation.name}`}
                    className="max-w-none select-none"
                    draggable={false}
                    style={{
                      maxHeight: 'calc(100vh - 2rem)',
                      width: 'auto',
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
    </div>
  )
}
