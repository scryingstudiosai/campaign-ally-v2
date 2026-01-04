import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Single thread
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: thread, error } = await supabase
      .from('story_threads')
      .select(
        `
        *,
        trigger_location:trigger_location_id (id, name, entity_type),
        related_quest:related_quest_id (id, name),
        source_session:source_session_id (id, title)
      `
      )
      .eq('id', id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Verify user owns the campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', thread.campaign_id)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ thread });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Update thread
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get existing thread
    const { data: existing } = await supabase
      .from('story_threads')
      .select('campaign_id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', existing.campaign_id)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle status changes
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === 'resolved' && existing.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: thread, error } = await supabase
      .from('story_threads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ thread });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Remove thread
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get thread to verify ownership
    const { data: thread } = await supabase
      .from('story_threads')
      .select('campaign_id')
      .eq('id', id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', thread.campaign_id)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase.from('story_threads').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
