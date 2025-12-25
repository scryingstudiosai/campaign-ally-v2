'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EntityCard, Entity } from '@/components/memory/entity-card'
import { EntityListItem, EntityListHeader } from '@/components/memory/entity-list-item'
import { EntityFiltersBar, EntityFilters } from '@/components/memory/entity-filters'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Plus, Brain, Database, CheckSquare, X, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'memory-view-mode'

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
  // Track entities in state for optimistic updates on delete
  const [entities, setEntities] = useState<Entity[]>(initialEntities)

  // Update entities when initialEntities changes (e.g., after navigation)
  useEffect(() => {
    setEntities(initialEntities)
  }, [initialEntities])

  // Initialize with default, then hydrate from localStorage
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Hydrate view mode from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'card' || stored === 'list') {
      setViewMode(stored)
    }
  }, [])

  // Persist view mode changes to localStorage
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  // Handle entity deletion - optimistic update
  const handleEntityDelete = (deletedId: string) => {
    setEntities(prev => prev.filter(e => e.id !== deletedId))
  }

  const [filters, setFilters] = useState<EntityFilters>({
    search: '',
    entityType: 'all',
    status: 'all',
    importance: 'all',
    visibility: 'all',
  })

  // Selection mode state for bulk delete
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Toggle selection for a single entity
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return newSelected
    })
  }, [])

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  // Filter entities based on current filters
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
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
  }, [entities, filters])

  // Count by type for display
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    entities.forEach((entity) => {
      counts[entity.entity_type] = (counts[entity.entity_type] || 0) + 1
    })
    return counts
  }, [entities])

  // Select all visible (filtered) entities
  const selectAll = useCallback(() => {
    const visibleIds = filteredEntities.map((e) => e.id)
    setSelectedIds(new Set(visibleIds))
  }, [filteredEntities])

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    setDeleting(true)
    try {
      // Delete all selected entities
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/entities/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter((r) => !r.ok).length

      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} items`)
      } else {
        toast.success(`Deleted ${selectedIds.size} items`)
      }

      // Optimistically update local state
      setEntities((prev) => prev.filter((e) => !selectedIds.has(e.id)))
      exitSelectionMode()
    } catch (err) {
      console.error('Bulk delete error:', err)
      toast.error('Failed to delete items')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [selectedIds, exitSelectionMode])

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
                {entities.length} {entities.length === 1 ? 'entity' : 'entities'} in your campaign knowledge base
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!selectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                  <Button asChild>
                    <Link href={`/dashboard/campaigns/${campaignId}/memory/new`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entity
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exitSelectionMode}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedIds.size === filteredEntities.length ? deselectAll : selectAll}
                  >
                    {selectedIds.size === filteredEntities.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedIds.size})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {entities.length > 0 && (
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
            {typeCounts.encounter && (
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                {typeCounts.encounter} Encounters
              </span>
            )}
            {typeCounts.creature && (
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {typeCounts.creature} Creatures
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
            onViewModeChange={handleViewModeChange}
          />
        </div>

        {/* Entity Display */}
        {filteredEntities.length === 0 ? (
          <Card className="p-12 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            {entities.length === 0 ? (
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
              <EntityCard
                key={entity.id}
                entity={entity}
                campaignId={campaignId}
                onDelete={handleEntityDelete}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(entity.id)}
                onToggleSelect={() => toggleSelection(entity.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <EntityListHeader selectionMode={selectionMode} />
            <div className="divide-y divide-border">
              {filteredEntities.map((entity) => (
                <EntityListItem
                  key={entity.id}
                  entity={entity}
                  campaignId={campaignId}
                  onDelete={handleEntityDelete}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(entity.id)}
                  onToggleSelect={() => toggleSelection(entity.id)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Results count */}
        {filteredEntities.length > 0 && filteredEntities.length !== entities.length && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {filteredEntities.length} of {entities.length} entities
          </p>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">
              Delete {selectedIds.size} {selectedIds.size === 1 ? 'entity' : 'entities'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the selected
              {selectedIds.size === 1 ? ' entity' : ' entities'} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'item' : 'items'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
