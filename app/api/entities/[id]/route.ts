import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Deep merge helper - merges nested objects without losing data
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  if (!source) return target;
  if (!target) return source;

  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    // Skip undefined or null values from source - don't overwrite with empty
    if (sourceValue === undefined || sourceValue === null) {
      continue;
    }

    // If both are objects (not arrays), merge recursively
    if (
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      // For arrays and primitives, use source value
      result[key] = sourceValue;
    }
  }

  return result;
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

  try {
    const supabase = await createClient();
    const body = await request.json();

    console.log('[API] PATCH entity:', id);

    // Fetch the existing entity with all fields
    const { data: existing, error: fetchError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      console.error('[API] Entity not found:', fetchError);
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Build update object with deep merging for nested objects
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Simple fields - direct update
    if (body.name !== undefined) updateData.name = body.name;
    if (body.sub_type !== undefined) updateData.sub_type = body.sub_type;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.description !== undefined) updateData.description = body.description;

    // Nested objects - DEEP MERGE with existing data
    if (body.soul !== undefined) {
      updateData.soul = deepMerge(
        (existing.soul as Record<string, unknown>) || {},
        body.soul
      );
      console.log('[API] Merged soul:', Object.keys(updateData.soul as object));
    }

    if (body.brain !== undefined) {
      updateData.brain = deepMerge(
        (existing.brain as Record<string, unknown>) || {},
        body.brain
      );
      console.log('[API] Merged brain:', Object.keys(updateData.brain as object));
    }

    if (body.voice !== undefined) {
      updateData.voice = deepMerge(
        (existing.voice as Record<string, unknown>) || {},
        body.voice
      );
    }

    if (body.mechanics !== undefined) {
      updateData.mechanics = deepMerge(
        (existing.mechanics as Record<string, unknown>) || {},
        body.mechanics
      );
    }

    if (body.attributes !== undefined) {
      updateData.attributes = deepMerge(
        (existing.attributes as Record<string, unknown>) || {},
        body.attributes
      );
    }

    console.log('[API] Update fields:', Object.keys(updateData));

    // Perform update
    const { data, error } = await supabase
      .from('entities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Update successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    );
  }
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
