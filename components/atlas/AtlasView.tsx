'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtlasMap, type AtlasMapRef, type MapMarker } from './AtlasMap'
import { AtlasSidebar } from './AtlasSidebar'
import { AtlasLensControl, type Lens } from './AtlasLensControl'
import { AtlasBreadcrumb } from './AtlasBreadcrumb'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Edit, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { LivingEntity } from '@/types/living-entity'

interface AtlasViewProps {
  campaignId: string
  location: LivingEntity
  isWorldLevel?: boolean
}

export function AtlasView({ campaignId, location, isWorldLevel = false }: AtlasViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const mapRef = useRef<AtlasMapRef>(null)

  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [allLocations, setAllLocations] = useState<LivingEntity[]>([])
  const [childLocations, setChildLocations] = useState<LivingEntity[]>([])
  const [breadcrumbPath, setBreadcrumbPath] = useState<LivingEntity[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeLens, setActiveLens] = useState<Lens>('all')
  const [focusedEntityId, setFocusedEntityId] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Get ALL locations for tree
      const { data: locations } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .neq('status', 'archived')
        .is('deleted_at', null)

      const typedLocations = (locations || []) as unknown as LivingEntity[]
      setAllLocations(typedLocations)

      // Get immediate children
      const children = typedLocations.filter((l) => {
        const parentId = l.attributes?.parent_entity_id as string | undefined
        return parentId === location.id
      })
      setChildLocations(children)

      // Get markers for this location
      const { data: markerData } = await supabase
        .from('map_markers')
        .select(`*, linked_entity:entities!linked_entity_id(*)`)
        .eq('location_id', location.id)

      const typedMarkers = (markerData || []).map((m) => ({
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

      // Build breadcrumb
      await buildBreadcrumb(location, typedLocations)
    }

    fetchData()
  }, [location.id, campaignId, supabase])

  const buildBreadcrumb = async (loc: LivingEntity, allLocs: LivingEntity[]) => {
    const path: LivingEntity[] = [loc]
    let current = loc

    while (current.attributes?.parent_entity_id) {
      const parentId = current.attributes.parent_entity_id as string
      const parent = allLocs.find((l) => l.id === parentId)
      if (parent) {
        path.unshift(parent)
        current = parent
      } else {
        break
      }
    }

    setBreadcrumbPath(path)
  }

  const handleFlyTo = (x: number, y: number) => {
    if (mapRef.current?.flyTo) {
      mapRef.current.flyTo(x, y, 2.5)
    }
  }

  const handleDrillDown = (childLocation: LivingEntity) => {
    router.push(`/dashboard/campaigns/${campaignId}/atlas/${childLocation.id}`)
  }

  const handleGoUp = () => {
    const parentId = location.attributes?.parent_entity_id as string | undefined
    if (parentId) {
      router.push(`/dashboard/campaigns/${campaignId}/atlas/${parentId}`)
    } else {
      router.push(`/dashboard/campaigns/${campaignId}/atlas`)
    }
  }

  const handleReparent = async (locationId: string, newParentId: string | null) => {
    const { error } = await supabase
      .from('entities')
      .update({
        attributes: {
          ...allLocations.find((l) => l.id === locationId)?.attributes,
          parent_entity_id: newParentId,
        },
      })
      .eq('id', locationId)

    if (error) {
      toast.error('Failed to move location')
    } else {
      const movedLoc = allLocations.find((l) => l.id === locationId)
      const newParent = newParentId ? allLocations.find((l) => l.id === newParentId) : null
      toast.success(`Moved "${movedLoc?.name}" to ${newParent?.name || 'top level'}`)

      // Refresh locations
      setAllLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? { ...l, attributes: { ...l.attributes, parent_entity_id: newParentId } }
            : l
        )
      )
    }
  }

  const handleToggleVisibility = async (locationId: string, isRevealed: boolean) => {
    const newStatus = isRevealed ? 'active' : 'stub'
    const { error } = await supabase.from('entities').update({ status: newStatus }).eq('id', locationId)

    if (!error) {
      setAllLocations((prev) =>
        prev.map((l) => (l.id === locationId ? { ...l, status: newStatus as LivingEntity['status'] } : l))
      )
      setChildLocations((prev) =>
        prev.map((l) => (l.id === locationId ? { ...l, status: newStatus as LivingEntity['status'] } : l))
      )
    }
  }

  const handleAddMarker = async (x: number, y: number) => {
    // For now, just log - you could open a modal here
    console.log('Add marker at', x, y)
    toast.info(`Marker position: ${x.toFixed(1)}%, ${y.toFixed(1)}%`)
  }

  // Get map image URL from location attributes
  const mapImageUrl = (location.attributes?.map_image_url as string) || null

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-4">
          {!isWorldLevel && (
            <Button variant="ghost" size="sm" onClick={handleGoUp}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <AtlasBreadcrumb path={breadcrumbPath} campaignId={campaignId} />
        </div>

        <Button
          variant={isEditMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Done
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <AtlasLensControl activeLens={activeLens} onLensChange={setActiveLens} />

          <AtlasMap
            ref={mapRef}
            imageUrl={mapImageUrl}
            locationName={location.name}
            markers={markers}
            childLocations={childLocations}
            isEditMode={isEditMode}
            activeLens={activeLens}
            focusedEntityId={focusedEntityId}
            onMarkerClick={(marker) => {
              const entityId = 'linked_entity' in marker ? marker.linked_entity?.id : marker.id
              setFocusedEntityId(entityId || null)
            }}
            onFlyToComplete={() => setFocusedEntityId(null)}
            onAddMarker={handleAddMarker}
            onDrillDown={handleDrillDown}
            onGenerateMap={() => {
              router.push(
                `/dashboard/campaigns/${campaignId}/memory/${location.id}/generate-map`
              )
            }}
          />
        </div>

        {/* Sidebar */}
        <AtlasSidebar
          currentLocation={location}
          allLocations={allLocations}
          markers={markers}
          isEditMode={isEditMode}
          onFlyTo={handleFlyTo}
          onSelectLocation={(loc) => {
            if (loc.id !== location.id) {
              handleDrillDown(loc)
            }
          }}
          onToggleVisibility={handleToggleVisibility}
          onReparent={handleReparent}
        />
      </div>
    </div>
  )
}
