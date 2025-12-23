'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, LayoutGrid, List } from 'lucide-react'
import { EntityType } from './entity-type-badge'

export interface EntityFilters {
  search: string
  entityType: EntityType | 'all'
  status: 'all' | 'active' | 'deceased' | 'destroyed' | 'missing' | 'archived'
  importance: 'all' | 'legendary' | 'major' | 'minor' | 'background'
  visibility: 'all' | 'public' | 'dm_only' | 'revealable'
}

interface EntityFiltersProps {
  filters: EntityFilters
  onFiltersChange: (filters: EntityFilters) => void
  viewMode: 'card' | 'list'
  onViewModeChange: (mode: 'card' | 'list') => void
}

export function EntityFiltersBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: EntityFiltersProps): JSX.Element {
  const updateFilter = <K extends keyof EntityFilters>(key: K, value: EntityFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      entityType: 'all',
      status: 'all',
      importance: 'all',
      visibility: 'all',
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.entityType !== 'all' ||
    filters.status !== 'all' ||
    filters.importance !== 'all' ||
    filters.visibility !== 'all'

  return (
    <div className="space-y-3">
      {/* Search and View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('card')}
            className="rounded-r-none"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.entityType}
          onValueChange={(v) => updateFilter('entityType', v as EntityType | 'all')}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="npc">NPCs</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="item">Items</SelectItem>
            <SelectItem value="faction">Factions</SelectItem>
            <SelectItem value="quest">Quests</SelectItem>
            <SelectItem value="encounter">Encounters</SelectItem>
            <SelectItem value="creature">Creatures</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter('status', v as EntityFilters['status'])}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
            <SelectItem value="destroyed">Destroyed</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.importance}
          onValueChange={(v) => updateFilter('importance', v as EntityFilters['importance'])}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Importance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Importance</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="background">Background</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.visibility}
          onValueChange={(v) => updateFilter('visibility', v as EntityFilters['visibility'])}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="dm_only">DM Only</SelectItem>
            <SelectItem value="revealable">Revealable</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
