import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const body = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', params.sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', params.sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
