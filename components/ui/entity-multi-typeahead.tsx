'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Loader2, Users, MapPin, Package, Skull, Flag, Scroll, Swords, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export type EntityType = 'npc' | 'player' | 'location' | 'item' | 'creature' | 'faction' | 'quest' | 'encounter'

export interface EntitySelection {
  id: string
  name: string
  entityType: EntityType
  isSrd?: boolean
  cr?: string
  count?: number
}

interface EntityMultiTypeaheadProps {
  values: EntitySelection[]
  onChange: (values: EntitySelection[]) => void
  campaignId: string
  entityTypes?: EntityType[]
  includeSrd?: boolean
  showCount?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  npc: Users,
  player: Users,
  location: MapPin,
  item: Package,
  creature: Skull,
  faction: Flag,
  quest: Scroll,
  encounter: Swords,
}

const ENTITY_COLORS: Record<string, string> = {
  npc: 'text-blue-400',
  player: 'text-green-400',
  location: 'text-emerald-400',
  item: 'text-amber-400',
  creature: 'text-red-400',
  faction: 'text-purple-400',
  quest: 'text-teal-400',
  encounter: 'text-orange-400',
}

const BADGE_COLORS: Record<string, string> = {
  npc: 'bg-blue-900/50 border-blue-700 text-blue-300',
  player: 'bg-green-900/50 border-green-700 text-green-300',
  location: 'bg-emerald-900/50 border-emerald-700 text-emerald-300',
  item: 'bg-amber-900/50 border-amber-700 text-amber-300',
  creature: 'bg-red-900/50 border-red-700 text-red-300',
  faction: 'bg-purple-900/50 border-purple-700 text-purple-300',
  quest: 'bg-teal-900/50 border-teal-700 text-teal-300',
  encounter: 'bg-orange-900/50 border-orange-700 text-orange-300',
}

export function EntityMultiTypeahead({
  values,
  onChange,
  campaignId,
  entityTypes = ['creature'],
  includeSrd = true,
  showCount = true,
  placeholder = 'Add entities...',
  disabled = false,
  className,
}: EntityMultiTypeaheadProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<EntitySelection[]>([])
  const [srdOptions, setSrdOptions] = useState<EntitySelection[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCount, setSelectedCount] = useState(1)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const searchEntities = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([])
      setSrdOptions([])
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Search campaign entities
      const { data: entities, error } = await supabase
        .from('entities')
        .select('id, name, entity_type, mechanics')
        .eq('campaign_id', campaignId)
        .in('entity_type', entityTypes)
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10)

      if (!error && entities) {
        setOptions(entities.map(e => ({
          id: e.id,
          name: e.name,
          entityType: e.entity_type as EntityType,
          cr: e.mechanics?.cr,
        })))
      }

      // Search SRD if enabled and relevant entity types are selected
      if (includeSrd) {
        const srdTypes: string[] = []
        if (entityTypes.includes('creature')) srdTypes.push('creatures')
        if (entityTypes.includes('item')) srdTypes.push('items')

        if (srdTypes.length > 0) {
          const srdResponse = await fetch(
            `/api/srd/search?q=${encodeURIComponent(query)}&types=${srdTypes.join(',')}&limit=10`
          )

          if (srdResponse.ok) {
            const srdData = await srdResponse.json()
            const srdEntities: EntitySelection[] = []

            if (srdData.creatures) {
              srdData.creatures.forEach((c: { id: string; name: string; challenge_rating?: string }) => {
                srdEntities.push({
                  id: `srd-creature-${c.id}`,
                  name: c.name,
                  entityType: 'creature',
                  isSrd: true,
                  cr: c.challenge_rating,
                })
              })
            }

            if (srdData.items) {
              srdData.items.forEach((i: { id: string; name: string }) => {
                srdEntities.push({
                  id: `srd-item-${i.id}`,
                  name: i.name,
                  entityType: 'item',
                  isSrd: true,
                })
              })
            }

            setSrdOptions(srdEntities)
          }
        }
      }
    } catch (error) {
      console.error('Error searching entities:', error)
    }

    setLoading(false)
  }, [campaignId, entityTypes, includeSrd])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchEntities(search)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [search, searchEntities])

  const handleSelect = (option: EntitySelection) => {
    // Check if already selected
    const existingIndex = values.findIndex(v => v.id === option.id)

    if (existingIndex >= 0) {
      // Update count if already selected
      const newValues = [...values]
      newValues[existingIndex] = {
        ...newValues[existingIndex],
        count: (newValues[existingIndex].count || 1) + selectedCount,
      }
      onChange(newValues)
    } else {
      // Add new selection
      onChange([...values, { ...option, count: selectedCount }])
    }

    setSearch('')
    setSelectedCount(1)
  }

  const handleRemove = (id: string) => {
    onChange(values.filter(v => v.id !== id))
  }

  const handleUpdateCount = (id: string, count: number) => {
    if (count < 1) {
      handleRemove(id)
      return
    }
    onChange(values.map(v => v.id === id ? { ...v, count } : v))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected entities */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((entity) => {
            const Icon = ENTITY_ICONS[entity.entityType] || Skull
            const badgeColor = BADGE_COLORS[entity.entityType] || BADGE_COLORS.creature

            return (
              <Badge
                key={entity.id}
                variant="outline"
                className={cn('flex items-center gap-1.5 py-1 px-2', badgeColor)}
              >
                <Icon className="w-3 h-3" />
                {showCount && entity.count && entity.count > 1 && (
                  <span className="font-bold">{entity.count}x</span>
                )}
                <span>{entity.name}</span>
                {entity.cr && (
                  <span className="text-xs opacity-70">CR {entity.cr}</span>
                )}
                {entity.isSrd && (
                  <span className="text-xs bg-amber-900/50 text-amber-400 px-1 rounded">SRD</span>
                )}
                {showCount && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateCount(entity.id, (entity.count || 1) - 1)
                      }}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 text-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateCount(entity.id, (entity.count || 1) + 1)
                      }}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 text-xs"
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleRemove(entity.id)}
                  className="ml-1 hover:text-red-400"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Add entity popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0 bg-slate-900 border-slate-700" align="start">
          <Command className="bg-transparent">
            <div className="flex items-center gap-2 p-2 border-b border-slate-700">
              <CommandInput
                placeholder="Search..."
                value={search}
                onValueChange={setSearch}
                className="border-none focus:ring-0 flex-1"
              />
              {showCount && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Qty:</span>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={selectedCount}
                    onChange={(e) => setSelectedCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-7 bg-slate-800 border-slate-700 text-center text-xs"
                  />
                </div>
              )}
            </div>
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" />
                </div>
              )}

              {!loading && search.length >= 2 && options.length === 0 && srdOptions.length === 0 && (
                <CommandEmpty>No entities found.</CommandEmpty>
              )}

              {!loading && search.length < 2 && (
                <div className="py-6 text-center text-sm text-slate-500">
                  Type at least 2 characters to search...
                </div>
              )}

              {options.length > 0 && (
                <CommandGroup heading="Campaign Entities">
                  {options.map((option) => {
                    const OptionIcon = ENTITY_ICONS[option.entityType] || Users
                    const optionColor = ENTITY_COLORS[option.entityType] || 'text-slate-400'
                    const isSelected = values.some(v => v.id === option.id)

                    return (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => handleSelect(option)}
                        className="cursor-pointer"
                      >
                        <OptionIcon className={cn('mr-2 h-4 w-4', optionColor)} />
                        <span className="flex-1 truncate">{option.name}</span>
                        {option.cr && (
                          <span className="text-xs text-red-400 mr-2">CR {option.cr}</span>
                        )}
                        {isSelected && (
                          <span className="text-xs text-teal-400">+ {selectedCount}</span>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {srdOptions.length > 0 && (
                <>
                  {options.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="SRD Reference">
                    {srdOptions.map((option) => {
                      const OptionIcon = ENTITY_ICONS[option.entityType] || BookOpen
                      const optionColor = ENTITY_COLORS[option.entityType] || 'text-slate-400'
                      const isSelected = values.some(v => v.id === option.id)

                      return (
                        <CommandItem
                          key={option.id}
                          value={`srd-${option.name}`}
                          onSelect={() => handleSelect(option)}
                          className="cursor-pointer"
                        >
                          <OptionIcon className={cn('mr-2 h-4 w-4', optionColor)} />
                          <span className="flex-1 truncate">{option.name}</span>
                          {option.cr && (
                            <span className="text-xs text-red-400 mr-1">CR {option.cr}</span>
                          )}
                          <span className="text-xs bg-amber-900/50 text-amber-400 px-1 rounded">SRD</span>
                          {isSelected && (
                            <span className="ml-1 text-xs text-teal-400">+ {selectedCount}</span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
