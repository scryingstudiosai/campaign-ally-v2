import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SrdCreature, SrdItem, SrdSpell } from '@/types/srd'

type SrdType = 'creatures' | 'items' | 'spells'

const TABLE_MAP: Record<SrdType, string> = {
  creatures: 'srd_creatures',
  items: 'srd_items',
  spells: 'srd_spells',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: SrdType; slug: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, slug } = params

    if (!TABLE_MAP[type]) {
      return NextResponse.json(
        { error: 'Invalid type. Must be creatures, items, or spells.' },
        { status: 400 }
      )
    }

    const tableName = TABLE_MAP[type]

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: `${type.slice(0, -1)} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(data as SrdCreature | SrdItem | SrdSpell)
  } catch (error) {
    console.error('SRD lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SRD data' },
      { status: 500 }
    )
  }
}
