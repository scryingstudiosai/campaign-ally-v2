import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Advance or adjust clock
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action = 'advance', amount = 1 } = body

    // Get thread with campaign info
    const { data: thread } = await supabase
      .from('story_threads')
      .select('*, campaigns!inner(user_id)')
      .eq('id', params.id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Verify ownership via campaign
    const campaignData = thread.campaigns as { user_id: string }
    if (campaignData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!thread.clock_max) {
      return NextResponse.json({ error: 'Thread has no clock' }, { status: 400 })
    }

    let newCurrent = thread.clock_current || 0

    if (action === 'advance') {
      newCurrent = Math.min(thread.clock_max, newCurrent + amount)
    } else if (action === 'reduce') {
      newCurrent = Math.max(0, newCurrent - amount)
    } else if (action === 'set') {
      newCurrent = Math.max(0, Math.min(thread.clock_max, amount))
    }

    const isTriggered = newCurrent >= thread.clock_max

    const { data: updated, error } = await supabase
      .from('story_threads')
      .update({
        clock_current: newCurrent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      thread: {
        ...updated,
        clock_percentage: Math.round((newCurrent / thread.clock_max) * 100),
        is_triggered: isTriggered,
      },
      triggered: isTriggered,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
