'use client'

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { AtlasMarker } from './AtlasMarker'
import { cn } from '@/lib/utils'
import type { LivingEntity } from '@/types/living-entity'

export interface MapMarker {
  id: string
  location_id: string
  linked_entity_id: string | null
  linked_entity?: LivingEntity
  x_percent: number
  y_percent: number
  is_revealed: boolean
  has_active_quest?: boolean
  label?: string
}

interface AtlasMapProps {
  imageUrl: string | null
  locationName: string
  markers: MapMarker[]
  childLocations: LivingEntity[]
  isEditMode: boolean
  activeLens: 'all' | 'active' | 'threat' | 'social' | 'places'
  focusedEntityId: string | null
  onMarkerClick: (marker: MapMarker | LivingEntity) => void
  onFlyToComplete: () => void
  onAddMarker: (x: number, y: number) => void
  onDrillDown: (location: LivingEntity) => void
  onGenerateMap: () => void
}

export interface AtlasMapRef {
  flyTo: (xPercent: number, yPercent: number, targetScale?: number) => void
}

// Zoom thresholds for semantic zoom
const ZOOM_THRESHOLD_DETAIL = 1.5 // Show all markers above this
const ZOOM_THRESHOLD_OVERVIEW = 0.8 // Show only major locations below this

export const AtlasMap = forwardRef<AtlasMapRef, AtlasMapProps>(function AtlasMap(
  {
    imageUrl,
    locationName,
    markers,
    childLocations,
    isEditMode,
    activeLens,
    focusedEntityId,
    onMarkerClick,
    onFlyToComplete,
    onAddMarker,
    onDrillDown,
    onGenerateMap,
  },
  ref
) {
  const transformRef = useRef<any>(null)
  const [currentScale, setCurrentScale] = useState(1)
  const [isPanning, setIsPanning] = useState(false)

  // Handle ESC to clear focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedEntityId) {
        onFlyToComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedEntityId, onFlyToComplete])

  // Fly-To function with smooth easing
  const flyTo = useCallback((xPercent: number, yPercent: number, targetScale: number = 2) => {
    if (!transformRef.current) return

    const { setTransform } = transformRef.current
    const container = transformRef.current.instance.wrapperComponent

    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // Calculate target position (center the point)
    const targetX = -(xPercent / 100) * containerWidth * targetScale + containerWidth / 2
    const targetY = -(yPercent / 100) * containerHeight * targetScale + containerHeight / 2

    // Animate to position
    setTransform(targetX, targetY, targetScale, 500, 'easeInOutCubic')
  }, [])

  // Expose flyTo to parent via ref
  useImperativeHandle(ref, () => ({
    flyTo,
  }), [flyTo])

  // Determine marker visibility based on zoom level
  const getMarkerVisibility = (entityType: string): boolean => {
    if (currentScale < ZOOM_THRESHOLD_OVERVIEW) {
      // Very zoomed out - only show locations
      return ['location', 'settlement', 'city', 'region'].includes(entityType)
    }
    if (currentScale < ZOOM_THRESHOLD_DETAIL) {
      // Medium zoom - show locations and major entities
      return ['location', 'npc', 'faction', 'quest'].includes(entityType)
    }
    // Zoomed in - show everything
    return true
  }

  // Determine marker emphasis based on active lens
  const getMarkerEmphasis = (entity: LivingEntity, hasActiveQuest: boolean): 'full' | 'faded' | 'hidden' => {
    if (activeLens === 'all') return 'full'

    switch (activeLens) {
      case 'active':
        return hasActiveQuest ? 'full' : 'faded'
      case 'threat':
        return ['creature', 'encounter'].includes(entity.entity_type) ? 'full' : 'faded'
      case 'social':
        return ['npc', 'faction'].includes(entity.entity_type) ? 'full' : 'faded'
      case 'places':
        return entity.entity_type === 'location' ? 'full' : 'faded'
      default:
        return 'full'
    }
  }

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isEditMode) return
    e.preventDefault()

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    onAddMarker(x, y)
  }

  // No map image - show placeholder
  if (!imageUrl) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Blueprint/Parchment Background */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-[url(/textures/blueprint-grid.svg)] bg-repeat',
            'opacity-20'
          )}
          style={{
            backgroundSize: '50px 50px',
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90" />

        {/* Content */}
        <div className="relative text-center z-10">
          <h2 className="text-3xl font-bold text-slate-300 mb-2 font-serif">{locationName}</h2>
          <p className="text-slate-500 mb-8">This location has no map yet</p>

          <button
            onClick={onGenerateMap}
            className={cn(
              'group relative px-8 py-4 rounded-lg',
              'bg-gradient-to-br from-teal-600 to-emerald-700',
              'hover:from-teal-500 hover:to-emerald-600',
              'text-white font-semibold text-lg',
              'shadow-lg shadow-teal-900/50',
              'transition-all duration-300',
              'hover:scale-105 hover:shadow-xl hover:shadow-teal-900/60'
            )}
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              Generate Map
            </span>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-teal-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <TransformWrapper
      ref={transformRef}
      initialScale={1}
      minScale={0.3}
      maxScale={5}
      centerOnInit
      limitToBounds={false}
      onTransformed={(_, state) => {
        setCurrentScale(state.scale)
      }}
      onPanningStart={() => setIsPanning(true)}
      onPanningStop={() => setIsPanning(false)}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="relative w-full h-full">
          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => zoomIn()}
              className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors"
            >
              +
            </button>
            <button
              onClick={() => zoomOut()}
              className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors"
            >
              −
            </button>
            <button
              onClick={() => resetTransform()}
              className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg backdrop-blur-sm transition-colors text-xs"
            >
              ⟲
            </button>
          </div>

          {/* Scale Indicator */}
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1 bg-slate-800/80 rounded text-xs text-slate-400 backdrop-blur-sm">
            {Math.round(currentScale * 100)}%
          </div>

          {/* The Map Canvas */}
          <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
            <div className="relative w-full h-full" onContextMenu={handleContextMenu}>
              {/* Map Image */}
              <img
                src={imageUrl}
                alt={`Map of ${locationName}`}
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />

              {/* Markers Layer */}
              {markers.map((marker) => {
                const entity = marker.linked_entity
                if (!entity) return null

                const isVisible = getMarkerVisibility(entity.entity_type)
                if (!isVisible) return null

                const emphasis = getMarkerEmphasis(entity, marker.has_active_quest || false)

                return (
                  <AtlasMarker
                    key={marker.id}
                    entity={entity}
                    x={marker.x_percent}
                    y={marker.y_percent}
                    isRevealed={marker.is_revealed}
                    hasActiveQuest={marker.has_active_quest}
                    isFocused={focusedEntityId === entity.id}
                    emphasis={emphasis}
                    onClick={() => {
                      if (!isPanning) {
                        flyTo(marker.x_percent, marker.y_percent, 2.5)
                        onMarkerClick(marker)
                      }
                    }}
                  />
                )
              })}

              {/* Child Location Markers (Drill-Down Points) */}
              {childLocations
                .filter((loc) => loc.attributes?.map_x && loc.attributes?.map_y)
                .map((location) => {
                  const isVisible = getMarkerVisibility('location')
                  if (!isVisible) return null

                  const emphasis = getMarkerEmphasis(location, false)
                  const mapX = location.attributes?.map_x as number
                  const mapY = location.attributes?.map_y as number

                  return (
                    <AtlasMarker
                      key={`child-${location.id}`}
                      entity={location}
                      x={mapX}
                      y={mapY}
                      isRevealed={location.status !== 'stub'}
                      hasActiveQuest={false}
                      isFocused={focusedEntityId === location.id}
                      emphasis={emphasis}
                      isDrillDown
                      onClick={() => {
                        if (!isPanning) {
                          flyTo(mapX, mapY, 2.5)
                          setTimeout(() => onDrillDown(location), 600)
                        }
                      }}
                    />
                  )
                })}

              {/* Edit Mode Indicator */}
              {isEditMode && (
                <div className="absolute top-4 right-4 bg-amber-500 text-black px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                  ✏️ Edit Mode — Right-click to add marker
                </div>
              )}
            </div>
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  )
})
