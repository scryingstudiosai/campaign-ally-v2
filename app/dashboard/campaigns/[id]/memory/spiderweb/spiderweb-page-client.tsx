'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SpiderwebGraphWrapper as SpiderwebGraph } from '@/components/memory/SpiderwebWrapper'
import { ArrowLeft, Network, LayoutGrid } from 'lucide-react'
import { PageTransition, FadeIn } from '@/components/ui/motion'

interface Entity {
  id: string
  name: string
  entity_type: string
  sub_type?: string
  summary?: string
  image_url?: string
  status?: string
  importance_tier?: string
}

interface Relationship {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  description?: string
  is_secret?: boolean
}

interface SpiderwebPageClientProps {
  campaignId: string
  campaignName: string
  initialEntities: Entity[]
  initialRelationships: Relationship[]
}

export function SpiderwebPageClient({
  campaignId,
  campaignName,
  initialEntities,
  initialRelationships,
}: SpiderwebPageClientProps): JSX.Element {
  const router = useRouter()

  // Handle entity click - navigate to entity detail page
  const handleEntityClick = useCallback((entityId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}/memory/${entityId}`)
  }, [campaignId, router])

  return (
    <PageTransition>
      <div className="h-screen flex flex-col bg-background text-foreground">
        {/* Header */}
        <FadeIn className="p-4 border-b border-stone-800">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild size="sm">
                <Link href={`/dashboard/campaigns/${campaignId}/memory`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Memory
                </Link>
              </Button>
              <div className="h-6 w-px bg-stone-700" />
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold">Spiderweb View</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-400">
                {initialEntities.length} entities • {initialRelationships.length} relationships
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/campaigns/${campaignId}/memory`}>
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Grid View
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Graph Container - takes remaining space */}
        <div className="flex-1 relative">
          <SpiderwebGraph
            campaignId={campaignId}
            initialEntities={initialEntities}
            initialRelationships={initialRelationships}
            onEntityClick={handleEntityClick}
            className="w-full h-full"
          />
        </div>

        {/* Help Text */}
        <div className="p-3 bg-stone-900/50 border-t border-stone-800 text-center text-xs text-stone-500">
          Click and drag to pan • Scroll to zoom • Click nodes to view details • Drag nodes to rearrange
        </div>
      </div>
    </PageTransition>
  )
}
