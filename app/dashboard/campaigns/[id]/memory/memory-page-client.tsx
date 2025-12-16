'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EntityCard, Entity } from '@/components/memory/entity-card'
import { EntityListItem, EntityListHeader } from '@/components/memory/entity-list-item'
import { EntityFiltersBar, EntityFilters } from '@/components/memory/entity-filters'
import { ArrowLeft, Plus, Brain, Database } from 'lucide-react'

interface MemoryPageClientProps {
  campaignId: string
  campaignName: string
  initialEntities: Entity[]
}

export function MemoryPageClient({
  campaignId,
  campaignName,
  initialEntities,
}: MemoryPageClientProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [filters, setFilters] = useState<EntityFilters>({
    search: '',
    entityType: 'all',
    status: 'all',
    importance: 'all',
    visibility: 'all',
  })

  // Filter entities based on current filters
  const filteredEntities = useMemo(() => {
    return initialEntities.filter((entity) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          entity.name.toLowerCase().includes(searchLower) ||
          entity.summary?.toLowerCase().includes(searchLower) ||
          entity.description?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Type filter
      if (filters.entityType !== 'all' && entity.entity_type !== filters.entityType) {
        return false
      }

      // Status filter
      if (filters.status !== 'all' && entity.status !== filters.status) {
        return false
      }

      // Importance filter
      if (filters.importance !== 'all' && entity.importance_tier !== filters.importance) {
        return false
      }

      // Visibility filter
      if (filters.visibility !== 'all' && entity.visibility !== filters.visibility) {
        return false
      }

      return true
    })
  }, [initialEntities, filters])

  // Count by type for display
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    initialEntities.forEach((entity) => {
      counts[entity.entity_type] = (counts[entity.entity_type] || 0) + 1
    })
    return counts
  }, [initialEntities])

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/campaigns/${campaignId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {campaignName}
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                Memory
              </h1>
              <p className="text-muted-foreground mt-1">
                {initialEntities.length} {initialEntities.length === 1 ? 'entity' : 'entities'} in your campaign knowledge base
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard/campaigns/${campaignId}/memory/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entity
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {initialEntities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 text-sm">
            {typeCounts.npc && (
              <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                {typeCounts.npc} NPCs
              </span>
            )}
            {typeCounts.location && (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                {typeCounts.location} Locations
              </span>
            )}
            {typeCounts.item && (
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {typeCounts.item} Items
              </span>
            )}
            {typeCounts.faction && (
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {typeCounts.faction} Factions
              </span>
            )}
            {typeCounts.quest && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                {typeCounts.quest} Quests
              </span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <EntityFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Entity Display */}
        {filteredEntities.length === 0 ? (
          <Card className="p-12 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            {initialEntities.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No entities yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your campaign memory by adding NPCs, locations, items, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link href={`/dashboard/campaigns/${campaignId}/memory/new`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entity Manually
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/campaigns/${campaignId}/forge/npc`}>
                      Generate with NPC Forge
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No matching entities</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms.
                </p>
              </>
            )}
          </Card>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEntities.map((entity) => (
              <EntityCard key={entity.id} entity={entity} campaignId={campaignId} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <EntityListHeader />
            <div className="divide-y divide-border">
              {filteredEntities.map((entity) => (
                <EntityListItem key={entity.id} entity={entity} campaignId={campaignId} />
              ))}
            </div>
          </Card>
        )}

        {/* Results count */}
        {filteredEntities.length > 0 && filteredEntities.length !== initialEntities.length && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {filteredEntities.length} of {initialEntities.length} entities
          </p>
        )}
      </div>
    </div>
  )
}
