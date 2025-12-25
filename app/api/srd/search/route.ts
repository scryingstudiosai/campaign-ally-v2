import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GameSystem, SrdCreature, SrdItem, SrdSpell } from '@/types/srd'

export interface SrdSearchResult {
  creatures: SrdCreature[]
  items: SrdItem[]
  spells: SrdSpell[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const gameSystem = (searchParams.get('game_system') || '5e_2014') as GameSystem
    const types = searchParams.get('types')?.split(',') || ['creatures', 'items', 'spells']
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({
        creatures: [],
        items: [],
        spells: []
      } as SrdSearchResult)
    }

    const searchPattern = `%${query}%`
    const result: SrdSearchResult = {
      creatures: [],
      items: [],
      spells: [],
    }

    // Search creatures
    if (types.includes('creatures')) {
      const { data: creatures, error } = await supabase
        .from('srd_creatures')
        .select('*')
        .eq('game_system', gameSystem)
        .ilike('name', searchPattern)
        .order('name')
        .limit(limit)

      if (!error && creatures) {
        result.creatures = creatures as SrdCreature[]
      }
    }

    // Search items
    if (types.includes('items')) {
      const { data: items, error } = await supabase
        .from('srd_items')
        .select('*')
        .eq('game_system', gameSystem)
        .ilike('name', searchPattern)
        .order('name')
        .limit(limit)

      if (!error && items) {
        result.items = items as SrdItem[]
      }
    }

    // Search spells
    if (types.includes('spells')) {
      const { data: spells, error } = await supabase
        .from('srd_spells')
        .select('*')
        .eq('game_system', gameSystem)
        .ilike('name', searchPattern)
        .order('name')
        .limit(limit)

      if (!error && spells) {
        result.spells = spells as SrdSpell[]
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('SRD search error:', error)
    return NextResponse.json(
      { error: 'Failed to search SRD data' },
      { status: 500 }
    )
  }
}
