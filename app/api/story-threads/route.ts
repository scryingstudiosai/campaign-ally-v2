import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List threads for a campaign
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    // Verify user owns campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('story_threads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: threads, error } = await query

    if (error) {
      console.error('[StoryThreads] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate clock percentages and urgency
    const threadsWithProgress = (threads || []).map((thread) => ({
      ...thread,
      clock_percentage: thread.clock_max
        ? Math.round((thread.clock_current / thread.clock_max) * 100)
        : null,
      is_urgent:
        thread.priority === 'critical' ||
        (thread.clock_max ? thread.clock_current / thread.clock_max >= 0.75 : false),
      is_triggered: thread.clock_max ? thread.clock_current >= thread.clock_max : false,
    }))

    return NextResponse.json({ threads: threadsWithProgress })
  } catch (error: unknown) {
    console.error('[StoryThreads] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Create new thread
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      campaignId,
      title,
      description,
      thread_type = 'consequence',
      priority = 'medium',
      clock_type,
      clock_max,
      trigger_type,
      trigger_location_id,
      trigger_entity_ids,
      stake_type,
      consequence_if_ignored,
      consequence_if_resolved,
      related_entity_ids,
      related_quest_id,
      source_session_id,
    } = body

    if (!campaignId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: thread, error } = await supabase
      .from('story_threads')
      .insert({
        campaign_id: campaignId,
        title,
        description,
        thread_type,
        status: 'active',
        priority,
        clock_type: clock_type || null,
        clock_max: clock_max || null,
        clock_current: 0,
        clock_started_at: clock_type && clock_type !== 'none' ? new Date().toISOString() : null,
        trigger_type: trigger_type || null,
        trigger_location_id: trigger_location_id || null,
        trigger_entity_ids: trigger_entity_ids || [],
        trigger_conditions: trigger_location_id ? { location_id: trigger_location_id } : null,
        stake_type: stake_type || null,
        consequence_if_ignored,
        consequence_if_resolved,
        related_entity_ids: related_entity_ids || [],
        related_quest_id: related_quest_id || null,
        source_session_id: source_session_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[StoryThreads] Create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[StoryThreads] Created: ${title}`)
    return NextResponse.json({ thread })
  } catch (error: unknown) {
    console.error('[StoryThreads] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
