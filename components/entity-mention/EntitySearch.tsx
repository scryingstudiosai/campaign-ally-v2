'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, Package, Users, Skull, ScrollText, Swords, Sparkles } from 'lucide-react'

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  npc: User,
  location: MapPin,
  item: Package,
  faction: Users,
  creature: Skull,
  quest: ScrollText,
  encounter: Swords,
}

const ENTITY_COLORS: Record<string, string> = {
  npc: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  location: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  item: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  faction: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  creature: 'bg-red-500/20 text-red-400 border-red-500/50',
  quest: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  encounter: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
}

interface Entity {
  id: string
  name: string
  entity_type: string
}

interface EntitySearchProps {
  campaignId: string
  onSelect: (entity: Entity) => void
  trigger: React.ReactNode
  filterTypes?: string[]
  placeholder?: string
}

export function EntitySearch({
  campaignId,
  onSelect,
  trigger,
  filterTypes,
  placeholder = 'Search entities...',
}: EntitySearchProps): JSX.Element {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadEntities = async (): Promise<void> => {
      setLoading(true)
      let query = supabase
        .from('entities')
        .select('id, name, entity_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('name')
        .limit(50)

      if (filterTypes?.length) {
        query = query.in('entity_type', filterTypes)
      }

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data } = await query
      setEntities(data || [])
      setLoading(false)
    }

    loadEntities()
  }, [open, search, campaignId, filterTypes, supabase])

  const handleSelect = (entity: Entity): void => {
    onSelect(entity)
    setOpen(false)
    setSearch('')
  }

  // Group entities by type
  const groupedEntities = entities.reduce(
    (acc, entity) => {
      const type = entity.entity_type
      if (!acc[type]) acc[type] = []
      acc[type].push(entity)
      return acc
    },
    {} as Record<string, Entity[]>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-zinc-900 border-zinc-700" align="start">
        <Command>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandEmpty>{loading ? 'Searching...' : 'No entities found.'}</CommandEmpty>
          {Object.entries(groupedEntities).map(([type, typeEntities]) => {
            const Icon = ENTITY_ICONS[type] || Sparkles
            return (
              <CommandGroup
                key={type}
                heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}
              >
                {typeEntities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    onSelect={() => handleSelect(entity)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-zinc-400" />
                    <span>{entity.name}</span>
                    <Badge
                      variant="outline"
                      className={`ml-auto text-xs ${ENTITY_COLORS[type] || ''}`}
                    >
                      {type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
