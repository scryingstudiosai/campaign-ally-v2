'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Sparkles } from 'lucide-react'

interface StubBannerProps {
  entityId: string
  entityName: string
  entityType: string
  campaignId: string
  stubContext?: string
  sourceEntityId?: string
  sourceEntityName?: string
}

// Helper to extract traits from context
function extractTraitsFromContext(context?: string): string[] {
  if (!context) return []
  const traits: string[] = []

  // Look for race mentions
  const races = [
    'dwarf',
    'elf',
    'gnome',
    'human',
    'orc',
    'halfling',
    'tiefling',
    'dragonborn',
    'half-elf',
    'half-orc',
  ]
  races.forEach((race) => {
    if (context.toLowerCase().includes(race)) traits.push(race)
  })

  // Look for profession mentions
  const professions = [
    'smith',
    'blacksmith',
    'artificer',
    'wizard',
    'mage',
    'warrior',
    'merchant',
    'thief',
    'rogue',
    'cleric',
    'priest',
    'ranger',
    'bard',
    'innkeeper',
    'guard',
    'captain',
  ]
  professions.forEach((prof) => {
    if (context.toLowerCase().includes(prof)) traits.push(prof)
  })

  return traits
}

export function StubBanner({
  entityId,
  entityName,
  entityType,
  campaignId,
  stubContext,
  sourceEntityId,
  sourceEntityName,
}: StubBannerProps): JSX.Element {
  const router = useRouter()

  const handleFleshOut = (): void => {
    const context = {
      stubId: entityId,
      name: entityName,
      entityType,
      sourceEntityId,
      sourceEntityName,
      snippet: stubContext,
      suggestedTraits: extractTraitsFromContext(stubContext),
    }

    const params = new URLSearchParams({
      stubId: entityId,
      name: entityName,
      context: JSON.stringify(context),
    })

    router.push(
      `/dashboard/campaigns/${campaignId}/forge/${entityType}?${params}`
    )
  }

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-amber-500/50 bg-amber-500/5 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-amber-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            Stub Entity - Needs Details
          </h3>
          {stubContext && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              Discovered in: &quot;{stubContext.substring(0, 150)}
              {stubContext.length > 150 ? '...' : ''}&quot;
            </p>
          )}
          {sourceEntityName && (
            <p className="text-xs text-slate-500 mt-1">
              Origin: {sourceEntityName}
            </p>
          )}
        </div>
        <Button
          onClick={handleFleshOut}
          className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Flesh Out
        </Button>
      </div>
    </div>
  )
}
