'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtlasExplorer } from '@/components/atlas/AtlasExplorer'
import { AtlasEmptyWorld } from '@/components/atlas/AtlasEmptyWorld'
import { Loader2 } from 'lucide-react'
import type { LivingEntity } from '@/types/living-entity'

// Location types that should NOT be selected as world maps
const EXCLUDE_FROM_WORLD_ROOT = [
  'building', 'tavern', 'inn', 'shop', 'house', 'castle', 'tower', 'temple',
  'dungeon', 'cave', 'crypt', 'tomb', 'mine', 'room', 'chamber'
]

// Priority types for world map selection
const WORLD_TYPES = ['world', 'continent', 'realm', 'plane']
const REGION_TYPES = ['region', 'kingdom', 'nation', 'empire', 'province', 'territory', 'land']

export default function AtlasPage() {
  const params = useParams()
  const campaignId = params.id as string
  const supabase = createClient()

  const [worldMap, setWorldMap] = useState<LivingEntity | null>(null)
  const [allLocationsWithMaps, setAllLocationsWithMaps] = useState<LivingEntity[]>([])
  const [allLocations, setAllLocations] = useState<LivingEntity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAtlasData = useCallback(async () => {
    // 1. Check if campaign has an explicit world root set
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('attributes')
      .eq('id', campaignId)
      .single()

    // 2. Get ALL locations for this campaign
    const { data: locations } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'location')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    const allLocs = (locations || []) as unknown as LivingEntity[]
    setAllLocations(allLocs)

    // Get locations with maps
    const locationsWithMaps = allLocs.filter((l) => l.attributes?.map_image_url)
    setAllLocationsWithMaps(locationsWithMaps)

    if (allLocs.length === 0) {
      setLoading(false)
      return
    }

    // 3. If campaign has an explicit world root, use it
    const worldRootId = campaign?.attributes?.world_root_location_id
    if (worldRootId) {
      const explicitRoot = allLocs.find((l) => l.id === worldRootId)
      if (explicitRoot) {
        setWorldMap(explicitRoot)
        setLoading(false)
        return
      }
    }

    // 4. Use priority system to find the best world map candidate
    let worldCandidate: LivingEntity | null = null
    const subTypeLower = (l: LivingEntity) => l.sub_type?.toLowerCase() || ''
    const isExcluded = (l: LivingEntity) => EXCLUDE_FROM_WORLD_ROOT.some(t => subTypeLower(l).includes(t))

    // Priority 1: Location explicitly marked as world root (via attributes)
    worldCandidate = allLocs.find((l) => l.attributes?.is_world_root === true) || null

    // Priority 2: World/continent type WITH a map image
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => WORLD_TYPES.some(t => subTypeLower(l).includes(t)) && l.attributes?.map_image_url
      ) || null
    }

    // Priority 3: World/continent type WITHOUT map (for creation flow)
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => WORLD_TYPES.some(t => subTypeLower(l).includes(t))
      ) || null
    }

    // Priority 4: Region/kingdom type WITH map and no parent
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => REGION_TYPES.some(t => subTypeLower(l).includes(t)) &&
               l.attributes?.map_image_url &&
               !l.attributes?.parent_entity_id
      ) || null
    }

    // Priority 5: Region/kingdom type WITHOUT map and no parent
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => REGION_TYPES.some(t => subTypeLower(l).includes(t)) &&
               !l.attributes?.parent_entity_id
      ) || null
    }

    // Priority 6: Any location WITH map, no parent, NOT building/dungeon
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => l.attributes?.map_image_url &&
               !l.attributes?.parent_entity_id &&
               !isExcluded(l)
      ) || null
    }

    // Priority 7: Any location no parent, NOT building/dungeon
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => !l.attributes?.parent_entity_id && !isExcluded(l)
      ) || null
    }

    // Priority 8: Last resort - any location WITH map that's NOT building/dungeon
    // (Don't auto-select buildings/dungeons as world root)
    if (!worldCandidate) {
      worldCandidate = allLocs.find(
        (l) => l.attributes?.map_image_url && !isExcluded(l)
      ) || null
    }

    setWorldMap(worldCandidate)
    setLoading(false)
  }, [campaignId, supabase])

  useEffect(() => {
    fetchAtlasData()
  }, [fetchAtlasData])

  // Handler to set a location as world root
  const handleSetWorldRoot = async (locationId: string) => {
    await supabase
      .from('campaigns')
      .update({
        attributes: {
          world_root_location_id: locationId
        }
      })
      .eq('id', campaignId)

    // Refresh the data
    await fetchAtlasData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  // If we have a world map WITH an image, show the immersive explorer
  if (worldMap?.attributes?.map_image_url) {
    return (
      <AtlasExplorer
        campaignId={campaignId}
        rootLocation={worldMap}
        allLocationsWithMaps={allLocationsWithMaps}
      />
    )
  }

  // No world map yet (or no image) - show creation prompt + existing maps
  return (
    <AtlasEmptyWorld
      campaignId={campaignId}
      worldLocation={worldMap}
      existingMaps={allLocationsWithMaps}
      allLocations={allLocations}
      onSetWorldRoot={handleSetWorldRoot}
    />
  )
}
