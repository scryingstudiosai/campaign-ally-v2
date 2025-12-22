'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Search, User, MapPin, Sword, Users, Scroll, HelpCircle, Filter, ChevronDown } from 'lucide-react'

interface QuickReferenceEntity {
  id: string
  name: string
  entity_type: string
  sub_type?: string
  summary?: string
  attributes?: {
    is_stub?: boolean
    needs_review?: boolean
  }
}

interface QuickReferenceProps {
  campaignId: string
  onSelect: (name: string, entityId: string) => void
  excludeIds?: string[]
  className?: string
}

const TYPE_ICONS: Record<string, typeof User> = {
  npc: User,
  location: MapPin,
  item: Sword,
  faction: Users,
  quest: Scroll,
  other: HelpCircle,
}

const TYPE_COLORS: Record<string, string> = {
  npc: 'border-teal-500/30 bg-teal-500/10 text-teal-400 hover:border-teal-500/50',
  location: 'border-green-500/30 bg-green-500/10 text-green-400 hover:border-green-500/50',
  item: 'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-500/50',
  faction: 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-500/50',
  quest: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:border-yellow-500/50',
  other: 'border-slate-500/30 bg-slate-500/10 text-slate-400 hover:border-slate-500/50',
}

const STUB_COLORS: Record<string, string> = {
  npc: 'border-teal-500/20 bg-teal-500/5 text-teal-500/60 hover:border-teal-500/30',
  location: 'border-green-500/20 bg-green-500/5 text-green-500/60 hover:border-green-500/30',
  item: 'border-purple-500/20 bg-purple-500/5 text-purple-500/60 hover:border-purple-500/30',
  faction: 'border-orange-500/20 bg-orange-500/5 text-orange-500/60 hover:border-orange-500/30',
  quest: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500/60 hover:border-yellow-500/30',
  other: 'border-slate-500/20 bg-slate-500/5 text-slate-500/60 hover:border-slate-500/30',
}

const MAX_DISPLAY = 15

export function QuickReference({
  campaignId,
  onSelect,
  excludeIds = [],
  className,
}: QuickReferenceProps): JSX.Element | null {
  const [entities, setEntities] = useState<QuickReferenceEntity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntities(): Promise<void> {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type, summary, attributes')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('name')
        .limit(200)

      if (!error && data) {
        setEntities(data)
      }
      setLoading(false)
    }

    fetchEntities()
  }, [campaignId])

  // Helper to check if entity is a stub
  const isStub = (entity: QuickReferenceEntity): boolean => {
    return !!(entity.attributes?.is_stub || entity.attributes?.needs_review)
  }

  // Filter entities based on search, type, and status
  const filteredEntities = entities
    .filter((e) => !excludeIds.includes(e.id))
    .filter((e) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Type filter
      const matchesType = filterType === 'all' || e.entity_type === filterType

      // Status filter
      const entityIsStub = isStub(e)
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && !entityIsStub) ||
        (filterStatus === 'stub' && entityIsStub)

      return matchesSearch && matchesType && matchesStatus
    })

  const displayedEntities = filteredEntities.slice(0, MAX_DISPLAY)
  const hasMore = filteredEntities.length > MAX_DISPLAY

  // Check if any filters are active (non-default)
  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'active'

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Search className="w-3 h-3" />
          Loading entities...
        </div>
      </div>
    )
  }

  if (entities.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header with Filter Button */}
      <div className="flex items-center gap-2">
        <Search className="w-3 h-3 text-slate-500" />
        <span className="text-xs text-slate-500">Quick Reference</span>

        {/* Filter Popover */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-5 px-1.5 text-xs hover:text-slate-300 ml-auto',
                hasActiveFilters ? 'text-teal-400' : 'text-slate-500'
              )}
            >
              <Filter className="w-3 h-3 mr-1" />
              {hasActiveFilters ? 'Filtered' : 'Filter'}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 space-y-3" align="end">
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1.5 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="npc">NPCs</SelectItem>
                  <SelectItem value="location">Locations</SelectItem>
                  <SelectItem value="item">Items</SelectItem>
                  <SelectItem value="faction">Factions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase mb-1.5 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Active Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="stub">Stubs Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-slate-400"
                onClick={() => {
                  setFilterType('all')
                  setFilterStatus('active')
                }}
              >
                Reset Filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search entities..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-7 text-xs bg-slate-900/50 border-slate-700"
      />

      {/* Entity Chips */}
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {displayedEntities.length > 0 ? (
          <>
            {displayedEntities.map((entity) => {
              const Icon = TYPE_ICONS[entity.entity_type] || TYPE_ICONS.other
              const entityIsStub = isStub(entity)
              const colorClass = entityIsStub
                ? (STUB_COLORS[entity.entity_type] || STUB_COLORS.other)
                : (TYPE_COLORS[entity.entity_type] || TYPE_COLORS.other)

              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => onSelect(entity.name, entity.id)}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs border transition-all cursor-pointer',
                    'flex items-center gap-1',
                    colorClass,
                    entityIsStub && 'border-dashed'
                  )}
                  title={entityIsStub ? `[Stub] ${entity.summary || entity.name}` : (entity.summary || entity.name)}
                >
                  <Icon className="w-3 h-3" />
                  {entity.name}
                </button>
              )
            })}
            {hasMore && (
              <span className="text-xs text-slate-500 self-center ml-1">
                +{filteredEntities.length - MAX_DISPLAY} more
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-500 italic">
            {searchTerm ? `No matches for "${searchTerm}"` : 'No entities match filters'}
          </span>
        )}
      </div>
    </div>
  )
}
