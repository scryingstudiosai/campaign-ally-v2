'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import type { GameSystem, SrdCreature, SrdItem, SrdSpell } from '@/types/srd'

export interface SrdSearchResult {
  creatures: SrdCreature[]
  items: SrdItem[]
  spells: SrdSpell[]
}

export type SrdSearchType = 'creatures' | 'items' | 'spells'

interface UseSrdSearchOptions {
  gameSystem?: GameSystem
  types?: SrdSearchType[]
  limit?: number
  debounceMs?: number
}

interface UseSrdSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SrdSearchResult
  isLoading: boolean
  error: string | null
  clear: () => void
}

export function useSrdSearch(options: UseSrdSearchOptions = {}): UseSrdSearchReturn {
  const {
    gameSystem = '5e_2014',
    types = ['creatures', 'items', 'spells'],
    limit = 10,
    debounceMs = 300,
  } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SrdSearchResult>({
    creatures: [],
    items: [],
    spells: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, debounceMs)

  const clear = useCallback(() => {
    setQuery('')
    setResults({ creatures: [], items: [], spells: [] })
    setError(null)
  }, [])

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults({ creatures: [], items: [], spells: [] })
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          game_system: gameSystem,
          types: types.join(','),
          limit: limit.toString(),
        })

        const response = await fetch(`/api/srd/search?${params}`)

        if (!response.ok) {
          throw new Error('Failed to search SRD data')
        }

        const data: SrdSearchResult = await response.json()
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults({ creatures: [], items: [], spells: [] })
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery, gameSystem, types, limit])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clear,
  }
}

/**
 * Hook to fetch a single SRD entity by type and slug
 */
export function useSrdLookup<T extends SrdCreature | SrdItem | SrdSpell>(
  type: SrdSearchType,
  slug: string | null
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntity = async () => {
      if (!slug) {
        setData(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/srd/${type}/${slug}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${type.slice(0, -1)}`)
        }

        const entity: T = await response.json()
        setData(entity)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lookup failed')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntity()
  }, [type, slug])

  return { data, isLoading, error }
}
