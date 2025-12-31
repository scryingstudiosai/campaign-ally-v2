'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search, MapPin, Users, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface EntityOption {
  id: string
  name: string
  entity_type: string
}

interface EntityTypeaheadProps {
  entities: EntityOption[]
  value: string
  onChange: (value: string) => void
  entityType: 'location' | 'faction' | 'npc'
  placeholder?: string
  emptyMessage?: string
  className?: string
}

const ENTITY_CONFIG = {
  location: {
    icon: MapPin,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Location',
  },
  faction: {
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Faction',
  },
  npc: {
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'NPC',
  },
}

export function EntityTypeahead({
  entities,
  value,
  onChange,
  entityType,
  placeholder,
  emptyMessage,
  className,
}: EntityTypeaheadProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const config = ENTITY_CONFIG[entityType]
  const Icon = config.icon

  // Filter entities by type and search query
  const filteredEntities = entities
    .filter((e) => e.entity_type === entityType && e.id)
    .filter((e) =>
      searchQuery
        ? e.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )

  const selectedEntity = entities.find((e) => e.id === value)

  const handleSelect = (entityId: string) => {
    onChange(entityId === value ? '' : entityId)
    setOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-slate-900/50 border-slate-700 hover:bg-slate-800/50',
            !value && 'text-slate-500',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedEntity ? (
              <>
                <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
                <span className="truncate text-white">{selectedEntity.name}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <span>{placeholder || `Search ${config.label.toLowerCase()}s...`}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
            <ChevronsUpDown className="w-4 h-4 text-slate-400" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${config.label.toLowerCase()}s...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {emptyMessage || `No ${config.label.toLowerCase()}s found.`}
            </CommandEmpty>
            <CommandGroup>
              {filteredEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.id}
                  onSelect={() => handleSelect(entity.id)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center mr-2 flex-shrink-0',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('w-3 h-3', config.color)} />
                  </div>
                  <span className="truncate">{entity.name}</span>
                  {value === entity.id && (
                    <Check className="ml-auto w-4 h-4 text-teal-400 flex-shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
