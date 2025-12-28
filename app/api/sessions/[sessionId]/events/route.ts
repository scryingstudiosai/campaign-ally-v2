import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions/[sessionId]/events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Failed to fetch session events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/sessions/[sessionId]/events
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;
  const body = await request.json();
  const supabase = await createClient();

  // Get session to verify it exists and get campaign_id
  const { data: session } = await supabase
    .from('sessions')
    .select('campaign_id, started_at')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Calculate time offset if session has started
  let sessionTimeOffset = null;
  if (session.started_at) {
    const startTime = new Date(session.started_at).getTime();
    sessionTimeOffset = Math.floor((Date.now() - startTime) / 1000);
  }

  const { data, error } = await supabase
    .from('session_events')
    .insert({
      session_id: sessionId,
      campaign_id: session.campaign_id,
      event_type: body.event_type,
      title: body.title,
      description: body.description,
      payload: body.payload || {},
      actor_entity_id: body.actor_entity_id,
      target_entity_id: body.target_entity_id,
      related_entity_ids: body.related_entity_ids || [],
      is_private: body.is_private || false,
      session_time_offset: sessionTimeOffset,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create session event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
