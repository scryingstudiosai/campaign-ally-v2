import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string; locationId: string }>;
}

// GET - Fetch markers for a location
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, locationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: markers, error } = await supabase
    .from('map_markers')
    .select(
      `
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type,
        soul
      )
    `
    )
    .eq('parent_location_id', locationId)
    .eq('campaign_id', campaignId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(markers);
}

// POST - Create new marker
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, locationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { linkedEntityId, label, description, xPercent, yPercent, color, iconType } = body;

  const { data: marker, error } = await supabase
    .from('map_markers')
    .insert({
      campaign_id: campaignId,
      user_id: user.id,
      parent_location_id: locationId,
      linked_entity_id: linkedEntityId || null,
      label: label || null,
      description: description || null,
      x_percent: xPercent,
      y_percent: yPercent,
      color: color || 'teal',
      icon_type: iconType || 'default',
    })
    .select(
      `
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type,
        soul
      )
    `
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(marker);
}
