import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string; mapId: string }>;
}

// GET - Fetch single map
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, mapId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: map, error } = await supabase
    .from('atlas_maps')
    .select(`
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type,
        soul
      )
    `)
    .eq('id', mapId)
    .eq('campaign_id', campaignId)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  return NextResponse.json(map);
}

// PATCH - Update map
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, mapId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found or not authorized' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    description,
    imageUrl,
    thumbnailUrl,
    mapType,
    style,
    linkedEntityId,
    poiData,
    metadata,
    isPrimary,
    isPublic,
  } = body;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.image_url = imageUrl;
  if (thumbnailUrl !== undefined) updateData.thumbnail_url = thumbnailUrl;
  if (mapType !== undefined) updateData.map_type = mapType;
  if (style !== undefined) updateData.style = style;
  if (linkedEntityId !== undefined) updateData.linked_entity_id = linkedEntityId;
  if (poiData !== undefined) updateData.poi_data = poiData;
  if (metadata !== undefined) updateData.metadata = metadata;
  if (isPrimary !== undefined) updateData.is_primary = isPrimary;
  if (isPublic !== undefined) updateData.is_public = isPublic;

  // If setting as primary, unset other primary maps for the same entity
  if (isPrimary && linkedEntityId) {
    await supabase
      .from('atlas_maps')
      .update({ is_primary: false })
      .eq('campaign_id', campaignId)
      .eq('linked_entity_id', linkedEntityId)
      .eq('is_primary', true)
      .neq('id', mapId);
  }

  const { data: map, error } = await supabase
    .from('atlas_maps')
    .update(updateData)
    .eq('id', mapId)
    .eq('campaign_id', campaignId)
    .select(`
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(map);
}

// DELETE - Delete map
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, mapId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found or not authorized' }, { status: 404 });
  }

  const { error } = await supabase
    .from('atlas_maps')
    .delete()
    .eq('id', mapId)
    .eq('campaign_id', campaignId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
