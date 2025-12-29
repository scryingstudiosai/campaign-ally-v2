'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  User,
  Bug,
  MapPin,
  Package,
  Users,
  Swords,
  Scroll,
  BookOpen,
  Brain,
  Calendar,
  Home,
  Sparkles,
  Dice6,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type EntityResult = {
  id: string
  name: string
  entity_type: string
}

export function CommandMenu(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [entities, setEntities] = useState<EntityResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const params = useParams()

  // Handle params.id being string | string[]
  const campaignId = useMemo(() => {
    const id = params?.id
    return Array.isArray(id) ? id[0] : id
  }, [params])

  const supabase = useMemo(() => createClient(), [])
  const cacheRef = useRef<Map<string, EntityResult[]>>(new Map())
  const latestRequestRef = useRef(0)

  // Cmd/Ctrl+K to toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Clear query when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
      setEntities([])
      setIsLoading(false)
    }
  }, [open])

  // Debounced search with cache and race-condition protection
  useEffect(() => {
    const q = query.trim()
    if (!campaignId || q.length < 2) {
      setEntities([])
      setIsLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `${campaignId}:${q.toLowerCase()}`
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setEntities(cached)
      setIsLoading(false)
      return
    }

    const requestId = ++latestRequestRef.current
    setIsLoading(true)

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .is('deleted_at', null)
          .ilike('name', `%${q}%`)
          .limit(10)

        // Ignore stale responses
        if (requestId !== latestRequestRef.current) return
        if (error) throw error

        const results = (data ?? []) as EntityResult[]
        cacheRef.current.set(cacheKey, results)
        setEntities(results)
      } catch (err) {
        if (requestId !== latestRequestRef.current) return
        console.error('Omni-search error:', err)
        setEntities([])
      } finally {
        if (requestId === latestRequestRef.current) setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, campaignId, supabase])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const entityIcon = (type: string): React.ElementType => {
    const icons: Record<string, React.ElementType> = {
      npc: User,
      creature: Bug,
      location: MapPin,
      item: Package,
      faction: Users,
      encounter: Swords,
      quest: Scroll,
    }
    return icons[type] || Sparkles
  }

  const rollD20 = (): void => {
    const result = Math.floor(Math.random() * 20) + 1
    const isCrit = result === 20
    const isFail = result === 1

    toast(
      isCrit ? '🎉 Natural 20!' : isFail ? '💀 Natural 1!' : `🎲 Rolled ${result}`,
      {
        description: isCrit
          ? 'Critical success!'
          : isFail
          ? 'Critical fail!'
          : `d20 = ${result}`,
      }
    )
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search entities, navigate, or roll dice..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Entity Search Results */}
        {entities.length > 0 && (
          <CommandGroup heading="Entities">
            {entities.map((entity) => {
              const Icon = entityIcon(entity.entity_type)
              return (
                <CommandItem
                  key={entity.id}
                  onSelect={() =>
                    runCommand(() =>
                      router.push(
                        `/dashboard/campaigns/${campaignId}/memory/${entity.id}`
                      )
                    )
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{entity.name}</span>
                  <span className="ml-auto text-xs text-slate-500 capitalize">
                    {entity.entity_type}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>

          {campaignId && (
            <>
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/dashboard/campaigns/${campaignId}/memory`)
                  )
                }
              >
                <Brain className="mr-2 h-4 w-4" />
                Memory
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/dashboard/campaigns/${campaignId}/codex`)
                  )
                }
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Codex
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/dashboard/campaigns/${campaignId}`)
                  )
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Sessions
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Forges */}
        {campaignId && (
          <CommandGroup heading="Forges">
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(`/dashboard/campaigns/${campaignId}/forge/npc`)
                )
              }
            >
              <User className="mr-2 h-4 w-4 text-teal-400" />
              NPC Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(
                    `/dashboard/campaigns/${campaignId}/forge/creature`
                  )
                )
              }
            >
              <Bug className="mr-2 h-4 w-4 text-rose-400" />
              Creature Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(
                    `/dashboard/campaigns/${campaignId}/forge/location`
                  )
                )
              }
            >
              <MapPin className="mr-2 h-4 w-4 text-emerald-400" />
              Location Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(`/dashboard/campaigns/${campaignId}/forge/item`)
                )
              }
            >
              <Package className="mr-2 h-4 w-4 text-blue-400" />
              Item Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(
                    `/dashboard/campaigns/${campaignId}/forge/faction`
                  )
                )
              }
            >
              <Users className="mr-2 h-4 w-4 text-orange-400" />
              Faction Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(
                    `/dashboard/campaigns/${campaignId}/forge/encounter`
                  )
                )
              }
            >
              <Swords className="mr-2 h-4 w-4 text-amber-400" />
              Encounter Forge
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push(`/dashboard/campaigns/${campaignId}/forge/quest`)
                )
              }
            >
              <Scroll className="mr-2 h-4 w-4 text-purple-400" />
              Quest Forge
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(rollD20)}>
            <Dice6 className="mr-2 h-4 w-4 text-amber-400" />
            Roll d20
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
