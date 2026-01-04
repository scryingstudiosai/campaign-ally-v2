import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get single thread
export async function GET(
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

    const { data: thread, error } = await supabase
      .from('story_threads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Verify user owns the campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', thread.campaign_id)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Add computed fields
    const threadWithProgress = {
      ...thread,
      clock_percentage: thread.clock_max
        ? Math.round((thread.clock_current / thread.clock_max) * 100)
        : null,
      is_urgent:
        thread.priority === 'critical' ||
        (thread.clock_max ? thread.clock_current / thread.clock_max >= 0.75 : false),
      is_triggered: thread.clock_max ? thread.clock_current >= thread.clock_max : false,
    }

    return NextResponse.json({ thread: threadWithProgress })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH - Update thread
export async function PATCH(
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

    // Get existing thread
    const { data: existing } = await supabase
      .from('story_threads')
      .select('campaign_id')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', existing.campaign_id)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that were sent
    const allowedFields = [
      'title',
      'description',
      'thread_type',
      'status',
      'priority',
      'clock_type',
      'clock_max',
      'clock_current',
      'trigger_type',
      'trigger_location_id',
      'trigger_entity_ids',
      'stake_type',
      'consequence_if_ignored',
      'consequence_if_resolved',
      'related_entity_ids',
      'related_quest_id',
      'resolution_type',
      'resolution_notes',
      'applied_consequence',
      'resolved_at',
    ]

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const { data: thread, error } = await supabase
      .from('story_threads')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[StoryThreads] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ thread })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete thread
export async function DELETE(
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

    // Get existing thread
    const { data: existing } = await supabase
      .from('story_threads')
      .select('campaign_id')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', existing.campaign_id)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase.from('story_threads').delete().eq('id', params.id)

    if (error) {
      console.error('[StoryThreads] Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
