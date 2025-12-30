import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch batch with suggestions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: batchId } = await params;

  // Fetch batch with suggestions
  const { data: batch, error } = await supabase
    .from('import_batches')
    .select(`
      *,
      source_doc:source_docs(*),
      suggestions:import_suggestions(
        *,
        merge_target:entities(id, name, entity_type)
      )
    `)
    .eq('id', batchId)
    .eq('user_id', user.id)
    .single();

  if (error || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  return NextResponse.json(batch);
}

// DELETE - Cancel/rollback batch
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: batchId } = await params;

  // Update status to rolled_back (cascade will handle suggestions)
  const { error } = await supabase
    .from('import_batches')
    .update({ status: 'rolled_back' })
    .eq('id', batchId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to rollback' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
