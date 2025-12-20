'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, User, MapPin, Sword, Users, Scroll, HelpCircle } from 'lucide-react'

interface QuickReferenceEntity {
  id: string
  name: string
  entity_type: string
  sub_type?: string
  summary?: string
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

export function QuickReference({
  campaignId,
  onSelect,
  excludeIds = [],
  className,
}: QuickReferenceProps): JSX.Element | null {
  const [entities, setEntities] = useState<QuickReferenceEntity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntities(): Promise<void> {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type, summary')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (!error && data) {
        setEntities(data)
      }
      setLoading(false)
    }

    fetchEntities()
  }, [campaignId])

  const filteredEntities = entities
    .filter((e) => !excludeIds.includes(e.id))
    .filter((e) =>
      searchTerm
        ? e.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
    .slice(0, 20)

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
      <div className="flex items-center gap-2">
        <Search className="w-3 h-3 text-slate-500" />
        <span className="text-xs text-slate-500">Quick Reference</span>
      </div>

      {entities.length > 10 && (
        <Input
          type="text"
          placeholder="Search entities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-7 text-xs bg-slate-900/50 border-slate-700"
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        {filteredEntities.map((entity) => {
          const Icon = TYPE_ICONS[entity.entity_type] || TYPE_ICONS.other
          const colorClass = TYPE_COLORS[entity.entity_type] || TYPE_COLORS.other

          return (
            <button
              key={entity.id}
              type="button"
              onClick={() => onSelect(entity.name, entity.id)}
              className={cn(
                'px-2 py-1 rounded-md text-xs border transition-all cursor-pointer',
                'flex items-center gap-1',
                colorClass
              )}
              title={entity.summary || entity.name}
            >
              <Icon className="w-3 h-3" />
              {entity.name}
            </button>
          )
        })}
      </div>

      {filteredEntities.length === 0 && searchTerm && (
        <p className="text-xs text-slate-500 italic">No entities match &quot;{searchTerm}&quot;</p>
      )}
    </div>
  )
}
