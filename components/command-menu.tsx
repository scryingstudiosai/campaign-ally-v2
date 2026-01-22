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

type SrdCreatureResult = {
  id: string
  slug: string
  name: string
  creature_type: string | null
  cr: string | null
}

export function CommandMenu(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [entities, setEntities] = useState<EntityResult[]>([])
  const [srdCreatures, setSrdCreatures] = useState<SrdCreatureResult[]>([])
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

  // Cmd/Ctrl+K to toggle, Escape to close
  // Use capture phase to intercept before browser's native shortcut handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      // Handle Escape to close
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }

      // Handle Ctrl+K or Cmd+K
      if (e.key?.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        // Check if user is typing in an input
        const target = e.target as HTMLElement
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable

        // Allow if modifier key is held (even in inputs)
        if (!isInput || e.metaKey || e.ctrlKey) {
          e.preventDefault()
          e.stopPropagation()
          setOpen((prev) => !prev)
        }
      }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [])

  // Clear query when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
      setEntities([])
      setSrdCreatures([])
      setIsLoading(false)
    }
  }, [open])

  // Debounced search with cache and race-condition protection
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setEntities([])
      setSrdCreatures([])
      setIsLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `${campaignId || 'global'}:${q.toLowerCase()}`
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setEntities(cached)
      setIsLoading(false)
      // Don't return - still need to search SRD
    }

    const requestId = ++latestRequestRef.current
    setIsLoading(true)

    const timer = setTimeout(async () => {
      try {
        // Search campaign entities (if in a campaign)
        if (campaignId && !cached) {
          const { data, error } = await supabase
            .from('entities')
            .select('id, name, entity_type')
            .eq('campaign_id', campaignId)
            .is('deleted_at', null)
            .ilike('name', `%${q}%`)
            .limit(10)

          if (requestId !== latestRequestRef.current) return
          if (!error) {
            const results = (data ?? []) as EntityResult[]
            cacheRef.current.set(cacheKey, results)
            setEntities(results)
          }
        }

        // Search SRD creatures (always available)
        const { data: srdData, error: srdError } = await supabase
          .from('srd_creatures')
          .select('id, slug, name, creature_type, cr')
          .ilike('name', `%${q}%`)
          .limit(5)

        if (requestId !== latestRequestRef.current) return
        if (!srdError) {
          setSrdCreatures((srdData ?? []) as SrdCreatureResult[])
        }
      } catch (err) {
        if (requestId !== latestRequestRef.current) return
        console.error('Omni-search error:', err)
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
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
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

        {/* SRD Creature Search Results */}
        {srdCreatures.length > 0 && (
          <CommandGroup heading="SRD Reference">
            {srdCreatures.map((creature) => (
              <CommandItem
                key={creature.id}
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/dashboard/srd/creature/${creature.slug}`)
                  )
                }
              >
                <BookOpen className="mr-2 h-4 w-4 text-amber-400" />
                <span>{creature.name}</span>
                <span className="ml-auto text-xs text-amber-500">
                  {creature.creature_type && `${creature.creature_type} · `}
                  {creature.cr && `CR ${creature.cr}`}
                </span>
              </CommandItem>
            ))}
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
