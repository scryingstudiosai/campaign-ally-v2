import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Deep merge helper - merges nested objects without losing data
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  if (!source) return target;
  if (!target) return source;

  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    // Skip undefined values only (allow null to overwrite)
    if (sourceValue === undefined) {
      continue;
    }

    // If both are objects (not arrays, not null), merge recursively
    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      // For arrays, primitives, and null - use source value
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

    console.log('[API PATCH] Entity ID:', id);
    console.log('[API PATCH] Received body keys:', Object.keys(body));
    console.log('[API PATCH] Summary in body:', body.summary);

    // Fetch existing entity
    const { data: existing, error: fetchError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      console.error('[API PATCH] Entity not found:', fetchError);
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    console.log('[API PATCH] Existing summary:', existing.summary);

    // Build update object - use 'key' in body to check if field was sent
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Simple string fields - update if key exists in body
    if ('name' in body) {
      updateData.name = body.name;
      console.log('[API PATCH] Will update name to:', body.name);
    }
    if ('sub_type' in body) {
      updateData.sub_type = body.sub_type;
      console.log('[API PATCH] Will update sub_type to:', body.sub_type);
    }
    if ('summary' in body) {
      updateData.summary = body.summary;
      console.log('[API PATCH] Will update summary to:', body.summary);
    }
    if ('description' in body) {
      updateData.description = body.description;
      console.log('[API PATCH] Will update description to:', body.description);
    }

    // Nested objects - deep merge with existing data
    if ('soul' in body && body.soul) {
      updateData.soul = deepMerge(
        (existing.soul as Record<string, unknown>) || {},
        body.soul
      );
      console.log('[API PATCH] Merged soul keys:', Object.keys(updateData.soul as object));
    }

    if ('brain' in body && body.brain) {
      updateData.brain = deepMerge(
        (existing.brain as Record<string, unknown>) || {},
        body.brain
      );
      console.log('[API PATCH] Merged brain keys:', Object.keys(updateData.brain as object));
    }

    if ('voice' in body && body.voice) {
      updateData.voice = deepMerge(
        (existing.voice as Record<string, unknown>) || {},
        body.voice
      );
    }

    if ('mechanics' in body && body.mechanics) {
      updateData.mechanics = deepMerge(
        (existing.mechanics as Record<string, unknown>) || {},
        body.mechanics
      );
    }

    if ('attributes' in body && body.attributes) {
      updateData.attributes = deepMerge(
        (existing.attributes as Record<string, unknown>) || {},
        body.attributes
      );
    }

    console.log('[API PATCH] Final updateData keys:', Object.keys(updateData));
    console.log('[API PATCH] Final summary value:', updateData.summary);

    // Perform update
    const { data, error } = await supabase
      .from('entities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API PATCH] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API PATCH] After save, returned summary:', data.summary);

    // Verify it actually saved
    if ('summary' in updateData && data.summary !== updateData.summary) {
      console.error('[API PATCH] WARNING: Summary did not save correctly!');
      console.error('[API PATCH] Expected:', updateData.summary);
      console.error('[API PATCH] Got:', data.summary);
    }

    console.log('[API PATCH] Update successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API PATCH] Exception:', error);
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
