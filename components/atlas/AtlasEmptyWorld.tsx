'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Upload, Sparkles, MapPin, ChevronRight, Check, Crown, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { LivingEntity } from '@/types/living-entity'

interface AtlasEmptyWorldProps {
  campaignId: string
  worldLocation: LivingEntity | null
  existingMaps: LivingEntity[]
  allLocations?: LivingEntity[]
  onSetWorldRoot?: (locationId: string) => Promise<void>
}

function getMapCategory(subType: string): string {
  const type = subType?.toLowerCase() || ''

  if (['world', 'continent', 'realm'].some((t) => type.includes(t))) return 'World Maps'
  if (['region', 'kingdom', 'province'].some((t) => type.includes(t))) return 'Region Maps'
  if (['city', 'town', 'village', 'settlement'].some((t) => type.includes(t))) return 'Settlement Maps'
  if (['building', 'tavern', 'inn', 'castle', 'temple', 'shop'].some((t) => type.includes(t)))
    return 'Building Maps'
  if (['dungeon', 'cave', 'crypt', 'tomb', 'mine'].some((t) => type.includes(t))) return 'Dungeon Maps'
  if (['forest', 'mountain', 'desert', 'swamp'].some((t) => type.includes(t))) return 'Wilderness Maps'

  return 'Other Maps'
}

// Location types that shouldn't be shown as world root candidates
const EXCLUDE_FROM_WORLD_ROOT = [
  'building', 'tavern', 'inn', 'shop', 'house', 'castle', 'tower', 'temple',
  'dungeon', 'cave', 'crypt', 'tomb', 'mine', 'room', 'chamber'
]

export function AtlasEmptyWorld({
  campaignId,
  worldLocation,
  existingMaps,
  allLocations = [],
  onSetWorldRoot
}: AtlasEmptyWorldProps) {
  const router = useRouter()
  const [settingRoot, setSettingRoot] = useState<string | null>(null)

  const handleCreateWorld = () => {
    if (worldLocation) {
      // World location exists but no map - go to that location to add map
      router.push(`/dashboard/campaigns/${campaignId}/atlas/${worldLocation.id}?addMap=true`)
    } else {
      // No world location - go to Location Forge to create one
      router.push(`/dashboard/campaigns/${campaignId}/forge/location?sub_type=world&isWorldMap=true`)
    }
  }

  const handleSetAsWorldRoot = async (location: LivingEntity) => {
    if (!onSetWorldRoot) return

    setSettingRoot(location.id)
    try {
      await onSetWorldRoot(location.id)
      toast.success(`Set "${location.name}" as your world map`)
    } catch {
      toast.error('Failed to set world root')
    } finally {
      setSettingRoot(null)
    }
  }

  // Get eligible locations for world root selection (exclude buildings/dungeons)
  const eligibleWorldRoots = existingMaps.filter(loc => {
    const subType = loc.sub_type?.toLowerCase() || ''
    return !EXCLUDE_FROM_WORLD_ROOT.some(t => subType.includes(t))
  })

  // Determine if we should show the world root selector
  // Show it when: no world location detected, but we have eligible maps to choose from
  const showWorldRootSelector = !worldLocation && eligibleWorldRoots.length > 0 && onSetWorldRoot

  // Group existing maps by category
  const mapsByCategory = existingMaps.reduce(
    (acc, loc) => {
      const category = getMapCategory(loc.sub_type || '')
      if (!acc[category]) acc[category] = []
      acc[category].push(loc)
      return acc
    },
    {} as Record<string, LivingEntity[]>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 text-slate-300 hover:bg-slate-700 backdrop-blur-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
            <Globe className="w-12 h-12 text-teal-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">Your World Awaits</h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Create your world map to begin exploring. Click regions to dive deeper, add markers for
            important locations, and bring your campaign to life.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleCreateWorld}
              size="lg"
              className="gap-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-lg px-8 h-14"
            >
              <Sparkles className="w-5 h-5" />
              {worldLocation ? 'Add World Map' : 'Create World Map'}
            </Button>

            <Button
              onClick={() => {
                if (worldLocation) {
                  router.push(`/dashboard/campaigns/${campaignId}/atlas/${worldLocation.id}?upload=true`)
                } else {
                  router.push(
                    `/dashboard/campaigns/${campaignId}/forge/location?sub_type=world&upload=true`
                  )
                }
              }}
              variant="outline"
              size="lg"
              className="gap-3 text-lg px-8 h-14"
            >
              <Upload className="w-5 h-5" />
              Upload Your Map
            </Button>
          </div>
        </div>
      </div>

      {/* World Root Selector - shown when no clear world detected but maps exist */}
      {showWorldRootSelector && (
        <div className="border-t border-slate-800 bg-gradient-to-b from-teal-950/20 to-transparent">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Crown className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Select Your World Map</h2>
                <p className="text-sm text-slate-400">
                  Choose which location should be your Atlas starting point
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {eligibleWorldRoots.map((location) => {
                const mapUrl = location.attributes?.map_image_url as string | undefined
                const isSettingThis = settingRoot === location.id

                return (
                  <button
                    key={location.id}
                    onClick={() => handleSetAsWorldRoot(location)}
                    disabled={settingRoot !== null}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-700 hover:border-teal-500 transition-all hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {mapUrl && (
                      <img
                        src={mapUrl}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-medium text-white text-sm truncate">{location.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{location.sub_type}</p>
                    </div>

                    {/* Hover/Loading State */}
                    <div className="absolute inset-0 flex items-center justify-center bg-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSettingThis ? (
                        <div className="bg-teal-500 rounded-full p-2 animate-pulse">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="bg-teal-500 rounded-full p-2">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Existing Maps Section */}
      {existingMaps.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-lg font-semibold text-slate-300 mb-2">Your Location Maps</h2>
            <p className="text-sm text-slate-500 mb-8">
              {worldLocation
                ? 'These maps can be linked to your world map for seamless exploration.'
                : "These maps aren't connected to a world map yet. Create your world map above to explore them in context."}
            </p>

            {/* Maps by Category */}
            {Object.entries(mapsByCategory).map(([category, maps]) => (
              <div key={category} className="mb-8">
                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {category} ({maps.length})
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {maps.map((location) => {
                    const mapUrl = location.attributes?.map_image_url as string | undefined
                    return (
                      <button
                        key={location.id}
                        onClick={() =>
                          router.push(`/dashboard/campaigns/${campaignId}/atlas/${location.id}`)
                        }
                        className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/10"
                      >
                        {mapUrl && (
                          <img
                            src={mapUrl}
                            alt={location.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Label */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-medium text-white text-sm truncate">{location.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{location.sub_type}</p>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-teal-500 rounded-full p-1">
                            <ChevronRight className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
