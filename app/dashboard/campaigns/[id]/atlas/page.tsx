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
    const { data: locations } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'location')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    const allLocs = (locations || []) as unknown as LivingEntity[]
    setAllLocations(allLocs)

    // ============ TEMPORARY DEBUG - Remove after diagnosis ============
    console.log('=== DEBUG: DATA STRUCTURE DIAGNOSIS ===')

    // Check for Glimmering Vale and Arcane Dominion
    const glimmeringVale = allLocs.find(l => l.name?.toLowerCase().includes('glimmering vale'))
    const arcaneDominion = allLocs.find(l => l.name?.toLowerCase().includes('arcane dominion'))

    if (glimmeringVale) {
      console.log('=== Glimmering Vale ===')
      console.log('ID:', glimmeringVale.id)
      console.log('sub_type:', glimmeringVale.sub_type)
      console.log('parent_id (DB column):', (glimmeringVale as Record<string, unknown>).parent_id)
      console.log('attributes.parent_entity_id:', glimmeringVale.attributes?.parent_entity_id)
      console.log('Full attributes:', JSON.stringify(glimmeringVale.attributes, null, 2))
    }

    if (arcaneDominion) {
      console.log('=== Arcane Dominion ===')
      console.log('ID:', arcaneDominion.id)
      console.log('sub_type:', arcaneDominion.sub_type)
      console.log('parent_id (DB column):', (arcaneDominion as Record<string, unknown>).parent_id)
      console.log('attributes.parent_entity_id:', arcaneDominion.attributes?.parent_entity_id)
    }

    // Check how many entities have parent_id (DB column) vs attributes.parent_entity_id
    const withDbParent = allLocs.filter(l => (l as Record<string, unknown>).parent_id)
    const withAttrParent = allLocs.filter(l => l.attributes?.parent_entity_id)
    console.log('=== Parent ID Usage ===')
    console.log('Locations with parent_id (DB column):', withDbParent.length)
    withDbParent.slice(0, 5).forEach(l => console.log(`  - ${l.name} -> ${(l as Record<string, unknown>).parent_id}`))
    console.log('Locations with attributes.parent_entity_id:', withAttrParent.length)
    withAttrParent.slice(0, 5).forEach(l => console.log(`  - ${l.name} -> ${l.attributes?.parent_entity_id}`))

    // Check ALL relationships for this campaign
    const { data: allRels } = await supabase
      .from('relationships')
      .select('*')
      .eq('campaign_id', campaignId)

    console.log('=== ALL Relationships ===')
    console.log('Total relationships:', allRels?.length || 0)

    // Group by relationship_type
    const relsByType: Record<string, number> = {}
    allRels?.forEach(r => {
      relsByType[r.relationship_type] = (relsByType[r.relationship_type] || 0) + 1
    })
    console.log('Relationship types:', relsByType)

    // Show location-related relationships
    const locationRels = allRels?.filter(r =>
      r.relationship_type === 'located_in' ||
      r.relationship_type === 'contains' ||
      r.relationship_type === 'part_of'
    )
    console.log('Location relationships (located_in/contains/part_of):', locationRels?.length || 0)
    locationRels?.slice(0, 10).forEach(r => {
      const source = allLocs.find(l => l.id === r.source_entity_id)
      const target = allLocs.find(l => l.id === r.target_entity_id)
      console.log(`  ${source?.name || r.source_entity_id} --[${r.relationship_type}]--> ${target?.name || r.target_entity_id}`)
    })

    // Check if Glimmering Vale has any relationships
    if (glimmeringVale) {
      const gvRels = allRels?.filter(r =>
        r.source_entity_id === glimmeringVale.id ||
        r.target_entity_id === glimmeringVale.id
      )
      console.log('=== Glimmering Vale Relationships ===')
      console.log('Total:', gvRels?.length || 0)
      gvRels?.forEach(r => {
        const source = allLocs.find(l => l.id === r.source_entity_id)
        const target = allLocs.find(l => l.id === r.target_entity_id)
        console.log(`  ${source?.name || 'unknown'} --[${r.relationship_type}]--> ${target?.name || 'unknown'}`)
      })
    }

    console.log('=== END DEBUG ===')
    // ============ END TEMPORARY DEBUG ============

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
      .select('*')
      .eq('campaign_id', campaignId)
      .in('relationship_type', ['located_in', 'contains', 'part_of'])

    // Build a parent lookup map from relationships
    const parentFromRelationship = new Map<string, string>()
    locationRelationships?.forEach(rel => {
      if (rel.relationship_type === 'located_in' || rel.relationship_type === 'part_of') {
        // source is located_in/part_of target, so target is parent
        parentFromRelationship.set(rel.source_entity_id, rel.target_entity_id)
      } else if (rel.relationship_type === 'contains') {
        // source contains target, so source is parent of target
        parentFromRelationship.set(rel.target_entity_id, rel.source_entity_id)
      }
    })

    // 5. Function to find the ultimate root of any location by traversing up
    const findUltimateRoot = (locationId: string, visited = new Set<string>()): LivingEntity | null => {
      if (visited.has(locationId)) return null // Prevent cycles
      visited.add(locationId)

      const location = locationMap.get(locationId)
      if (!location) return null

      // Priority 1: Check parent_id (database column) - this is the canonical source
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

    console.log('=== ATLAS ROOT DETECTION ===')
    console.log('All locations:', allLocs.length)
    console.log('Relationships found:', locationRelationships?.length || 0)
    console.log('Ultimate roots:', ultimateRoots.map(r => `${r.name} (${r.sub_type})`))

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
        console.log('Using explicit world root:', explicitRoot.name)
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
        console.log('Selected by descendant count:', worldCandidate.name, 'with', rootsWithCounts[0].count, 'descendants')
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

    console.log('Selected world map:', worldCandidate?.name, `(${worldCandidate?.sub_type})`)

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
