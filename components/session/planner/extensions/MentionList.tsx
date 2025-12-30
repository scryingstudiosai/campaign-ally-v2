'use client'

import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react'
import { Users, MapPin, Package, Flag, Skull, Scroll, Swords } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MentionItem {
  id: string
  name: string
  entityType: string
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
}

export interface MentionListRef {
  onKeyDown: (event: { event: KeyboardEvent }) => boolean
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

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback((index: number) => {
      const item = items[index]
      if (item) {
        // Map 'name' to 'label' for Tiptap Mention extension
        command({
          ...item,
          label: item.name,
        } as MentionItem & { label: string })
      }
    }, [items, command])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-[9999]">
          <p className="text-sm text-slate-500">No entities found</p>
        </div>
      )
    }

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-[9999] max-h-60 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = ENTITY_ICONS[item.entityType] || Users
          const color = ENTITY_COLORS[item.entityType] || 'text-slate-400'

          return (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-teal-900/50 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-xs text-slate-500 capitalize">{item.entityType}</span>
            </button>
          )
        })}
      </div>
    )
  }
)

MentionList.displayName = 'MentionList'

// Helper function to fetch entities for mention suggestions
export async function fetchMentionSuggestions(
  query: string,
  campaignId: string | null
): Promise<MentionItem[]> {
  if (!campaignId) return []

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('entities')
      .select('id, name, entity_type')
      .eq('campaign_id', campaignId)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10)

    if (error) {
      console.error('Error fetching mention suggestions:', error)
      return []
    }

    return (data || []).map((entity) => ({
      id: entity.id,
      name: entity.name,
      entityType: entity.entity_type,
    }))
  } catch (error) {
    console.error('Error fetching mention suggestions:', error)
    return []
  }
}
