'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtlasExplorer } from '@/components/atlas/AtlasExplorer'
import { AtlasEmptyWorld } from '@/components/atlas/AtlasEmptyWorld'
import { Loader2 } from 'lucide-react'
import type { LivingEntity } from '@/types/living-entity'

export default function AtlasPage() {
  const params = useParams()
  const campaignId = params.id as string
  const supabase = createClient()

  const [worldMap, setWorldMap] = useState<LivingEntity | null>(null)
  const [allLocationsWithMaps, setAllLocationsWithMaps] = useState<LivingEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAtlasData = async () => {
      // 1. Find the WORLD map (top-level, no parent, prioritize world/continent types)
      const { data: topLevelLocations } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      // Filter for locations without parent (check attributes.parent_entity_id)
      const rootLocations = (topLevelLocations || []).filter(
        (loc) => !loc.attributes?.parent_entity_id
      ) as unknown as LivingEntity[]

      // Find the world map - prioritize by sub_type, then by having a map image
      const worldTypes = ['world', 'continent', 'realm', 'plane']
      let world = rootLocations.find(
        (l) => worldTypes.includes(l.sub_type?.toLowerCase() || '') && l.attributes?.map_image_url
      )

      // Fallback: any top-level with a map image
      if (!world) {
        world = rootLocations.find((l) => l.attributes?.map_image_url)
      }

      // Fallback: any top-level location (even without map, for creation flow)
      if (!world) {
        world = rootLocations.find((l) => worldTypes.includes(l.sub_type?.toLowerCase() || ''))
      }

      // Last fallback: any top-level location
      if (!world && rootLocations.length > 0) {
        world = rootLocations[0]
      }

      setWorldMap(world || null)

      // 2. Get all locations that have maps (for browse mode / orphans)
      const { data: allLocations } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .is('deleted_at', null)

      const locationsWithMaps = (allLocations || []).filter(
        (l) => l.attributes?.map_image_url
      ) as unknown as LivingEntity[]

      setAllLocationsWithMaps(locationsWithMaps)
      setLoading(false)
    }

    fetchAtlasData()
  }, [campaignId, supabase])

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
    />
  )
}
