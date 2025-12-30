import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string; locationId: string; markerId: string }>;
}

// PATCH - Update marker position/details
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { markerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.xPercent !== undefined) updates.x_percent = body.xPercent;
  if (body.yPercent !== undefined) updates.y_percent = body.yPercent;
  if (body.color !== undefined) updates.color = body.color;
  if (body.iconType !== undefined) updates.icon_type = body.iconType;
  if (body.label !== undefined) updates.label = body.label;
  if (body.description !== undefined) updates.description = body.description;
  if (body.linkedEntityId !== undefined) updates.linked_entity_id = body.linkedEntityId;

  const { data: marker, error } = await supabase
    .from('map_markers')
    .update(updates)
    .eq('id', markerId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(marker);
}

// DELETE - Remove marker
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { markerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('map_markers')
    .delete()
    .eq('id', markerId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
