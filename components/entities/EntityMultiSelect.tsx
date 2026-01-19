'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
import { EntityTypeBadge, EntityType } from '@/components/memory/entity-type-badge'

interface Entity {
  id: string
  name: string
  entity_type: EntityType
}

interface EntityMultiSelectProps {
  campaignId: string
  entityTypes?: EntityType[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  maxSelected?: number
}

export function EntityMultiSelect({
  campaignId,
  entityTypes = ['npc', 'faction', 'location', 'deity'],
  selected,
  onChange,
  placeholder = 'Search entities...',
  maxSelected = 10,
}: EntityMultiSelectProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Entity[]>([])
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch selected entities on mount or when selection changes
  useEffect(() => {
    if (selected.length === 0) {
      setSelectedEntities([])
      return
    }

    const fetchSelected = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .in('id', selected)

      if (data) {
        setSelectedEntities(data as Entity[])
      }
    }
    fetchSelected()
  }, [selected])

  // Search entities with debounce
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([])
      return
    }

    const searchEntities = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .eq('campaign_id', campaignId)
        .in('entity_type', entityTypes)
        .ilike('name', `%${search}%`)
        .limit(10)

      // Filter out already selected
      const filtered = data?.filter(e => !selected.includes(e.id)) || []
      setResults(filtered as Entity[])
      setIsLoading(false)
    }

    const debounce = setTimeout(searchEntities, 200)
    return () => clearTimeout(debounce)
  }, [search, campaignId, entityTypes, selected])

  const addEntity = (entity: Entity) => {
    if (selected.length >= maxSelected) {
      return
    }
    onChange([...selected, entity.id])
    setSearch('')
    setResults([])
  }

  const removeEntity = (id: string) => {
    onChange(selected.filter(s => s !== id))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected entities */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedEntities.map(entity => (
            <Badge
              key={entity.id}
              variant="secondary"
              className="flex items-center gap-1.5 pr-1 bg-slate-800 border-slate-700"
            >
              <EntityTypeBadge type={entity.entity_type} size="sm" showIcon />
              <span className="text-slate-200">{entity.name}</span>
              <button
                onClick={() => removeEntity(entity.id)}
                className="ml-1 hover:bg-white/10 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length >= maxSelected ? `Maximum ${maxSelected} entities selected` : placeholder}
          disabled={selected.length >= maxSelected}
          className="pl-9 bg-slate-800/50"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-slate-500 text-sm">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map(entity => (
              <button
                key={entity.id}
                onClick={() => addEntity(entity)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-800 text-left transition-colors"
              >
                <EntityTypeBadge type={entity.entity_type} size="sm" showIcon />
                <span className="text-slate-200">{entity.name}</span>
              </button>
            ))
          ) : search.length >= 2 ? (
            <div className="px-3 py-4 text-center text-slate-500 text-sm">
              No entities found matching &ldquo;{search}&rdquo;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
