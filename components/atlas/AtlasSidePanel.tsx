'use client'

import { useState, useMemo } from 'react'
import { Search, X, MapPin, ChevronRight, Globe, Building, TreePine, Castle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LivingEntity } from '@/types/living-entity'

interface AtlasSidePanelProps {
  campaignId: string
  currentLocation: LivingEntity
  allLocations: LivingEntity[]
  onSelectLocation: (location: LivingEntity) => void
  onClose: () => void
}

type LocationCategory = 'world' | 'region' | 'settlement' | 'building' | 'wilderness' | 'other'

function getLocationCategory(subType: string): LocationCategory {
  const type = subType?.toLowerCase() || ''

  if (['world', 'continent', 'realm', 'plane'].some((t) => type.includes(t))) return 'world'
  if (['region', 'kingdom', 'province', 'territory'].some((t) => type.includes(t))) return 'region'
  if (['city', 'town', 'village', 'settlement', 'hamlet'].some((t) => type.includes(t)))
    return 'settlement'
  if (['building', 'tavern', 'inn', 'castle', 'temple', 'shop', 'house', 'tower'].some((t) => type.includes(t)))
    return 'building'
  if (['forest', 'mountain', 'desert', 'swamp', 'dungeon', 'cave', 'ruins'].some((t) => type.includes(t)))
    return 'wilderness'

  return 'other'
}

const CATEGORY_CONFIG: Record<LocationCategory, { label: string; icon: typeof Globe; color: string }> = {
  world: { label: 'World Maps', icon: Globe, color: 'text-purple-400' },
  region: { label: 'Regions', icon: MapPin, color: 'text-blue-400' },
  settlement: { label: 'Settlements', icon: Castle, color: 'text-amber-400' },
  building: { label: 'Buildings', icon: Building, color: 'text-orange-400' },
  wilderness: { label: 'Wilderness', icon: TreePine, color: 'text-green-400' },
  other: { label: 'Other', icon: MapPin, color: 'text-slate-400' },
}

export function AtlasSidePanel({
  campaignId,
  currentLocation,
  allLocations,
  onSelectLocation,
  onClose,
}: AtlasSidePanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and group locations
  const filteredLocations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return allLocations.filter((loc) => {
      if (!query) return true
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.sub_type?.toLowerCase().includes(query) ||
        loc.dm_slug?.toLowerCase().includes(query)
      )
    })
  }, [allLocations, searchQuery])

  // Group by category
  const locationsByCategory = useMemo(() => {
    const grouped: Record<LocationCategory, LivingEntity[]> = {
      world: [],
      region: [],
      settlement: [],
      building: [],
      wilderness: [],
      other: [],
    }

    filteredLocations.forEach((loc) => {
      const category = getLocationCategory(loc.sub_type || '')
      grouped[category].push(loc)
    })

    return grouped
  }, [filteredLocations])

  // Category order for display
  const categoryOrder: LocationCategory[] = ['world', 'region', 'settlement', 'building', 'wilderness', 'other']

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-800 z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="font-semibold text-white">Browse Maps</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Location List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLocations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No maps found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          categoryOrder.map((category) => {
            const locations = locationsByCategory[category]
            if (locations.length === 0) return null

            const config = CATEGORY_CONFIG[category]
            const Icon = config.icon

            return (
              <div key={category} className="border-b border-slate-800/50">
                {/* Category Header */}
                <div className="px-4 py-2 bg-slate-800/30 sticky top-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Icon className={cn('w-3.5 h-3.5', config.color)} />
                    {config.label} ({locations.length})
                  </div>
                </div>

                {/* Location Items */}
                <div className="py-1">
                  {locations.map((location) => {
                    const isCurrentLocation = location.id === currentLocation.id
                    const mapUrl = location.attributes?.map_image_url as string | undefined

                    return (
                      <button
                        key={location.id}
                        onClick={() => !isCurrentLocation && onSelectLocation(location)}
                        disabled={isCurrentLocation}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isCurrentLocation
                            ? 'bg-teal-500/10 cursor-default'
                            : 'hover:bg-slate-800/50'
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                          {mapUrl && (
                            <img
                              src={mapUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium text-sm truncate',
                              isCurrentLocation ? 'text-teal-400' : 'text-white'
                            )}
                          >
                            {location.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate capitalize">
                            {location.sub_type}
                          </p>
                        </div>

                        {/* Arrow or Current Indicator */}
                        {isCurrentLocation ? (
                          <span className="text-xs text-teal-500 font-medium">Current</span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer - Current Location */}
      <div className="border-t border-slate-800 p-4 bg-slate-800/30">
        <div className="text-xs text-slate-500 mb-1">Currently viewing</div>
        <div className="flex items-center gap-3">
          {currentLocation.attributes?.map_image_url && (
            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
              <img
                src={currentLocation.attributes.map_image_url as string}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{currentLocation.name}</p>
            <p className="text-xs text-slate-500 capitalize">{currentLocation.sub_type}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
