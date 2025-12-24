import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SrdCreature } from '@/types/srd'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { data, error } = await supabase
      .from('srd_creatures')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data as SrdCreature)
  } catch (error) {
    console.error('SRD creature lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creature' },
      { status: 500 }
    )
  }
}
