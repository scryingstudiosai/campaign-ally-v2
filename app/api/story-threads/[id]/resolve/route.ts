import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Resolve a thread
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
    const {
      resolution_type, // 'resolved' | 'failed' | 'dormant'
      resolution_notes,
      custom_consequence,
    } = body

    if (!resolution_type) {
      return NextResponse.json({ error: 'Missing resolution_type' }, { status: 400 })
    }

    // Get thread with campaign info
    const { data: thread } = await supabase
      .from('story_threads')
      .select('*, campaigns!inner(user_id)')
      .eq('id', params.id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const campaignData = thread.campaigns as { user_id: string }
    if (campaignData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine which consequence to apply
    let applied_consequence = custom_consequence
    if (!applied_consequence) {
      if (resolution_type === 'resolved') {
        applied_consequence = thread.consequence_if_resolved
      } else if (resolution_type === 'failed') {
        applied_consequence = thread.consequence_if_ignored
      }
    }

    // Map resolution_type to status
    const statusMap: Record<string, string> = {
      resolved: 'resolved',
      failed: 'failed',
      dormant: 'dormant',
    }

    const { data: updated, error } = await supabase
      .from('story_threads')
      .update({
        status: statusMap[resolution_type] || 'resolved',
        resolution_type,
        resolution_notes,
        applied_consequence,
        resolved_at: resolution_type !== 'dormant' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[StoryThreads] Resolved "${thread.title}" as ${resolution_type}`)

    return NextResponse.json({
      thread: updated,
      applied_consequence,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
