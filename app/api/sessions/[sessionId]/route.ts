import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions/[sessionId]
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single();

  if (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/sessions/[sessionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', params.sessionId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/sessions/[sessionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', params.sessionId);

  if (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
