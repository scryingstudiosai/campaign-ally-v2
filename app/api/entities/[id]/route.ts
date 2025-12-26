import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/entities/[id] - Update an entity (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Entity ID required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get the update payload
  const body = await request.json();

  // First verify the entity exists
  const { data: entity, error: fetchError } = await supabase
    .from('entities')
    .select('id, campaign_id, attributes')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
  }

  // Handle partial attributes updates (merge with existing)
  let updatePayload = { ...body };
  if (body.attributes) {
    updatePayload.attributes = {
      ...(entity.attributes || {}),
      ...body.attributes,
    };
  }

  // Add updated_at timestamp
  updatePayload.updated_at = new Date().toISOString();

  // Update the entity
  const { data: updated, error: updateError } = await supabase
    .from('entities')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update entity:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/entities/[id] - Soft delete an entity
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Entity ID required' }, { status: 400 });
  }

  const supabase = await createClient();

  // First verify the entity exists and get campaign_id for auth check
  const { data: entity, error: fetchError } = await supabase
    .from('entities')
    .select('id, campaign_id, name')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
  }

  // Delete related facts first
  const { error: factsError } = await supabase
    .from('facts')
    .delete()
    .eq('entity_id', id);

  if (factsError) {
    console.error('Failed to delete related facts:', factsError);
  }

  // Delete relationships where this entity is source or target
  const { error: relationshipsError } = await supabase
    .from('relationships')
    .delete()
    .or(`source_id.eq.${id},target_id.eq.${id}`);

  if (relationshipsError) {
    console.error('Failed to delete related relationships:', relationshipsError);
  }

  // Soft delete the entity (set deleted_at)
  const { error: deleteError } = await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (deleteError) {
    console.error('Failed to delete entity:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedId: id, name: entity.name });
}
