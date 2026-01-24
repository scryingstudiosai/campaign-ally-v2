'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Info, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getLocationCategory } from '@/lib/ai/map-prompts'
import { MAP_STYLE_PRESETS, CampaignMapStyle } from '@/lib/ai/map-styles'
import { cn } from '@/lib/utils'

interface MapGeneratorProps {
  campaignId: string
  locationId: string
  location: {
    name: string
    sub_type: string
    description?: string
  }
  childLocations: Array<{ name: string; sub_type: string }>
  campaignStyle?: CampaignMapStyle
  onGenerateComplete: (imageUrl: string) => void
  onCancel: () => void
}

const CATEGORY_INFO: Record<string, { label: string; description: string; icon: string }> = {
  world: { label: 'World Map', description: 'Continents, oceans, mountain ranges', icon: '🌍' },
  region: { label: 'Regional Map', description: 'Terrain, roads, settlements', icon: '🗺️' },
  settlement: { label: 'City/Town Map', description: 'Districts, streets, buildings', icon: '🏰' },
  building: { label: 'Floor Plan', description: 'Rooms, corridors, furniture', icon: '🏠' },
  dungeon: { label: 'Dungeon Map', description: 'Chambers, passages, traps', icon: '⚔️' },
  wilderness: { label: 'Wilderness Map', description: 'Natural terrain, paths, clearings', icon: '🌲' },
}

export function MapGenerator({
  campaignId,
  locationId,
  location,
  childLocations,
  campaignStyle,
  onGenerateComplete,
  onCancel,
}: MapGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string>(
    campaignStyle?.artDirection
      ? Object.keys(MAP_STYLE_PRESETS).find(
          (k) => MAP_STYLE_PRESETS[k].artDirection === campaignStyle.artDirection
        ) || 'classic-fantasy'
      : 'classic-fantasy'
  )
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [lastError, setLastError] = useState<string | null>(null)

  const category = getLocationCategory(location.sub_type || 'region')
  const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.region

  const handleGenerate = async (attempt: number = 1) => {
    setIsGenerating(true)
    setLastError(null)
    setAttemptNumber(attempt)

    try {
      const response = await fetch('/api/ai/generate-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          campaignId,
          attemptNumber: attempt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate map')
      }

      toast.success('Map generated successfully!')
      onGenerateComplete(data.imageUrl)
    } catch (error: unknown) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)

      if (attempt < 3) {
        toast.error(`Generation failed. Try again with stricter settings.`, {
          action: {
            label: 'Retry',
            onClick: () => handleGenerate(attempt + 1),
          },
        })
      } else {
        toast.error('Map generation failed after multiple attempts. Try uploading a custom map instead.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center text-3xl">
          {categoryInfo.icon}
        </div>
        <h2 className="text-xl font-bold">Generate Map</h2>
        <p className="text-slate-400 mt-1">
          AI will create an Atlas-ready map for <strong>{location.name}</strong>
        </p>
      </div>

      {/* Auto-detected Category */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <p className="font-medium text-slate-200">{categoryInfo.label}</p>
            <p className="text-sm text-slate-400">{categoryInfo.description}</p>
          </div>
        </div>

        {childLocations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Will include marker zones for:</p>
            <p className="text-sm text-slate-300">
              {childLocations
                .slice(0, 5)
                .map((c) => c.name)
                .join(', ')}
              {childLocations.length > 5 && ` +${childLocations.length - 5} more`}
            </p>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-300 mb-3">Cartography Style</p>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(MAP_STYLE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedStyle(key)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                selectedStyle === key
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  selectedStyle === key ? 'border-teal-500' : 'border-slate-600'
                )}
              >
                {selectedStyle === key && <Check className="w-3 h-3 text-teal-500" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{preset.label}</p>
                <p className="text-xs text-slate-500">{preset.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Specs */}
      <div className="flex justify-center gap-4 text-xs text-slate-500 mb-6">
        <span>1024 × 1024</span>
        <span>•</span>
        <span>Top-down view</span>
        <span>•</span>
        <span>No text/labels</span>
      </div>

      {/* Error State */}
      {lastError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <p className="text-sm text-red-400">{lastError}</p>
          {attemptNumber < 3 && (
            <p className="text-xs text-red-400/70 mt-1">Click "Retry" for stricter generation settings.</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel} className="flex-1" disabled={isGenerating}>
          Cancel
        </Button>

        {lastError && attemptNumber < 3 ? (
          <Button
            onClick={() => handleGenerate(attemptNumber + 1)}
            disabled={isGenerating}
            className="flex-1 bg-amber-600 hover:bg-amber-500"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry (Attempt {attemptNumber + 1}/3)
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => handleGenerate(1)}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Map
              </>
            )}
          </Button>
        )}
      </div>

      {isGenerating && (
        <div className="text-center mt-4">
          <p className="text-xs text-slate-500 animate-pulse">
            Creating your {categoryInfo.label.toLowerCase()}...
          </p>
          <p className="text-xs text-slate-600 mt-1">This typically takes 15-30 seconds</p>
        </div>
      )}
    </div>
  )
}
