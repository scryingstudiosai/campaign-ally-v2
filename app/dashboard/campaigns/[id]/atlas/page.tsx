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
  'dungeon', 'cave', 'crypt', 'tomb', 'mine', 'room', 'chamber',
  'district', 'vale', 'valley', 'grove', 'sanctuary', 'academy', 'street', 'quarter'
]

// Priority types for world map selection
const WORLD_TYPES = ['world', 'continent', 'realm', 'plane']
const REGION_TYPES = ['region', 'kingdom', 'nation', 'empire', 'province', 'territory', 'land', 'dominion']

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
    const { data: locations, error: locError } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'location')
      .order('created_at', { ascending: true })

    if (locError) {
      console.error('[Atlas Page] Error fetching locations:', locError)
    }

    const allLocs = (locations || []) as unknown as LivingEntity[]
    setAllLocations(allLocs)

    // Get locations with maps
    const locationsWithMaps = allLocs.filter((l) => l.attributes?.map_image_url)
    setAllLocationsWithMaps(locationsWithMaps)

    if (allLocs.length === 0) {
      setLoading(false)
      return
    }

    // 3. Build a map for quick lookup
    const locationMap = new Map<string, LivingEntity>(allLocs.map(l => [l.id, l]))

    // 4. Get location relationships to find parent-child connections
    const { data: locationRelationships } = await supabase
      .from('relationships')
      .select('source_id, target_id, relationship_type')
      .eq('campaign_id', campaignId)
      .in('relationship_type', ['located_in', 'contains', 'part_of'])

    // Build a parent lookup map from relationships
    const parentFromRelationship = new Map<string, string>()
    locationRelationships?.forEach(rel => {
      if (rel.relationship_type === 'located_in' || rel.relationship_type === 'part_of') {
        // source is located_in/part_of target, so target is parent
        parentFromRelationship.set(rel.source_id, rel.target_id)
      } else if (rel.relationship_type === 'contains') {
        // source contains target, so source is parent of target
        parentFromRelationship.set(rel.target_id, rel.source_id)
      }
    })

    // 5. Function to find the ultimate root of any location by traversing up
    const findUltimateRoot = (locationId: string, visited = new Set<string>()): LivingEntity | null => {
      if (visited.has(locationId)) return null // Prevent cycles
      visited.add(locationId)

      const location = locationMap.get(locationId)
      if (!location) return null

      // Priority 1: Check parent_id (database column)
      const dbParentId = (location as Record<string, unknown>).parent_id as string | undefined
      if (dbParentId && locationMap.has(dbParentId)) {
        const parent = findUltimateRoot(dbParentId, visited)
        return parent || location
      }

      // Priority 2: Check attributes.parent_entity_id (legacy JSON field)
      const attrParentId = location.attributes?.parent_entity_id as string | undefined
      if (attrParentId && locationMap.has(attrParentId)) {
        const parent = findUltimateRoot(attrParentId, visited)
        return parent || location
      }

      // Priority 3: Check relationship-based parent (located_in, part_of, contains)
      const relParentId = parentFromRelationship.get(locationId)
      if (relParentId && locationMap.has(relParentId)) {
        const parent = findUltimateRoot(relParentId, visited)
        return parent || location
      }

      // No parent found - this is a root
      return location
    }

    // 6. Find all unique ultimate roots
    const ultimateRootsSet = new Set<string>()
    const ultimateRoots: LivingEntity[] = []
    allLocs.forEach(loc => {
      const root = findUltimateRoot(loc.id)
      if (root && !ultimateRootsSet.has(root.id)) {
        ultimateRootsSet.add(root.id)
        ultimateRoots.push(root)
      }
    })

    // Helper functions
    const subTypeLower = (l: LivingEntity) => l.sub_type?.toLowerCase() || ''
    const isExcluded = (l: LivingEntity) => EXCLUDE_FROM_WORLD_ROOT.some(t => subTypeLower(l).includes(t))
    const isWorldType = (l: LivingEntity) => WORLD_TYPES.some(t => subTypeLower(l).includes(t))
    const isRegionType = (l: LivingEntity) => REGION_TYPES.some(t => subTypeLower(l).includes(t))

    // 7. If campaign has an explicit world root, use it
    const worldRootId = campaign?.attributes?.world_root_location_id as string | undefined
    if (worldRootId) {
      const explicitRoot = allLocs.find((l) => l.id === worldRootId)
      if (explicitRoot) {
        setWorldMap(explicitRoot)
        setLoading(false)
        return
      }
    }

    // 8. Priority selection among ultimate roots
    let worldCandidate: LivingEntity | null = null

    // Priority 1: Location explicitly marked as world root (via attributes)
    worldCandidate = ultimateRoots.find((l) => l.attributes?.is_world_root === true) || null

    // Priority 2: World/continent type with map
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => isWorldType(l) && l.attributes?.map_image_url) || null
    }

    // Priority 3: World/continent type without map
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => isWorldType(l)) || null
    }

    // Priority 4: Kingdom/region type with map
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => isRegionType(l) && l.attributes?.map_image_url) || null
    }

    // Priority 5: Kingdom/region type without map
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => isRegionType(l)) || null
    }

    // Priority 6: Root with the most descendants (likely the main container)
    if (!worldCandidate) {
      const countDescendants = (rootId: string): number => {
        return allLocs.filter(l => {
          const ultimateRoot = findUltimateRoot(l.id)
          return ultimateRoot?.id === rootId && l.id !== rootId
        }).length
      }

      const rootsWithCounts = ultimateRoots
        .filter(r => !isExcluded(r))
        .map(r => ({ root: r, count: countDescendants(r.id) }))
        .sort((a, b) => b.count - a.count)

      if (rootsWithCounts.length > 0 && rootsWithCounts[0].count > 0) {
        worldCandidate = rootsWithCounts[0].root
      }
    }

    // Priority 7: Any root with a map that's not excluded
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => l.attributes?.map_image_url && !isExcluded(l)) || null
    }

    // Priority 8: Any root that's not excluded
    if (!worldCandidate) {
      worldCandidate = ultimateRoots.find(l => !isExcluded(l)) || null
    }

    // Fallback: first root
    if (!worldCandidate && ultimateRoots.length > 0) {
      worldCandidate = ultimateRoots[0]
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
