'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2, Users, MapPin, Package, Skull, Flag, Scroll, Swords, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { createClient } from '@/lib/supabase/client'

export type EntityType = 'npc' | 'player' | 'location' | 'item' | 'creature' | 'faction' | 'quest' | 'encounter'

export interface EntityOption {
  id: string
  name: string
  entityType: EntityType
  isSrd?: boolean
  cr?: string
  description?: string
}

interface EntityTypeaheadProps {
  value?: EntityOption | null
  onChange: (value: EntityOption | null) => void
  campaignId: string
  entityTypes?: EntityType[]
  includeSrd?: boolean
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

// Unified entity type colors - keep consistent across the app
// Colors: npc=blue, player=yellow, location=emerald, item=amber, creature=red,
//         faction=purple, quest=teal, encounter=orange, event=cyan, deity=violet
const ENTITY_COLORS: Record<string, string> = {
  npc: 'text-blue-400',
  player: 'text-yellow-400',
  location: 'text-emerald-400',
  item: 'text-amber-400',
  creature: 'text-red-400',
  faction: 'text-purple-400',
  quest: 'text-teal-400',
  encounter: 'text-orange-400',
  event: 'text-cyan-400',
  deity: 'text-violet-400',
}

export function EntityTypeahead({
  value,
  onChange,
  campaignId,
  entityTypes = ['npc', 'location', 'creature'],
  includeSrd = true,
  placeholder = 'Select entity...',
  disabled = false,
  className,
}: EntityTypeaheadProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<EntityOption[]>([])
  const [srdOptions, setSrdOptions] = useState<EntityOption[]>([])
  const [loading, setLoading] = useState(false)
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
        .select('id, name, entity_type, description')
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
          description: e.description,
        })))
      }

      // Search SRD if enabled and relevant entity types are selected
      if (includeSrd) {
        const srdTypes: string[] = []
        if (entityTypes.includes('creature')) srdTypes.push('creatures')
        if (entityTypes.includes('item')) srdTypes.push('items')

        if (srdTypes.length > 0) {
          const srdResponse = await fetch(
            `/api/srd/search?q=${encodeURIComponent(query)}&types=${srdTypes.join(',')}&limit=5`
          )

          if (srdResponse.ok) {
            const srdData = await srdResponse.json()
            const srdEntities: EntityOption[] = []

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

  const handleSelect = (option: EntityOption) => {
    onChange(option)
    setOpen(false)
    setSearch('')
  }

  const Icon = value ? ENTITY_ICONS[value.entityType] || Users : null
  const color = value ? ENTITY_COLORS[value.entityType] || 'text-slate-400' : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'justify-between bg-slate-800 border-slate-700 hover:bg-slate-700 text-left font-normal',
            !value && 'text-slate-500',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {value && Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />}
            {value ? value.name : placeholder}
            {value?.isSrd && (
              <span className="text-xs bg-amber-900/50 text-amber-400 px-1 rounded">SRD</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-slate-900 border-slate-700" align="start">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search entities..."
            value={search}
            onValueChange={setSearch}
            className="border-none focus:ring-0"
          />
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

                  return (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value?.id === option.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <OptionIcon className={cn('mr-2 h-4 w-4', optionColor)} />
                      <span className="flex-1 truncate">{option.name}</span>
                      <span className="text-xs text-slate-500 capitalize">{option.entityType}</span>
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

                    return (
                      <CommandItem
                        key={option.id}
                        value={`srd-${option.name}`}
                        onSelect={() => handleSelect(option)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value?.id === option.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <OptionIcon className={cn('mr-2 h-4 w-4', optionColor)} />
                        <span className="flex-1 truncate">{option.name}</span>
                        {option.cr && (
                          <span className="text-xs text-red-400">CR {option.cr}</span>
                        )}
                        <span className="ml-1 text-xs bg-amber-900/50 text-amber-400 px-1 rounded">SRD</span>
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
  )
}
