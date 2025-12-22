'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStageStateProps {
  entityType: string
  entityId: string
  entityName: string
  campaignId: string
  isStub?: boolean
}

export function EmptyStageState({
  entityType,
  entityId,
  entityName,
  campaignId,
  isStub = false,
}: EmptyStageStateProps) {
  // Determine the appropriate forge path based on entity type
  const forgeType = entityType === 'npc' ? 'npc' : entityType === 'item' ? 'item' : 'location'
  const forgePath = `/dashboard/campaigns/${campaignId}/forge/${forgeType}?stub=${entityId}`

  const getMessage = () => {
    if (isStub) {
      return `${entityName} is a stub waiting to be fleshed out.`
    }
    return `No player-facing details have been added yet.`
  }

  return (
    <div className="ca-panel p-6 text-center border-dashed border-slate-700">
      <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-500" />
      <p className="text-sm text-slate-400 mb-4">{getMessage()}</p>
      {isStub && (
        <Button variant="outline" size="sm" asChild>
          <Link href={forgePath}>
            <Sparkles className="w-4 h-4 mr-2" />
            Flesh Out in Forge
          </Link>
        </Button>
      )}
    </div>
  )
}
