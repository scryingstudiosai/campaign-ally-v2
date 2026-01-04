import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Update suggestion status (accept/reject/merge)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: suggestionId } = await params;
  const body = await req.json();
  const { action, mergeTargetId, proposedData } = body;

  // Validate action
  if (!['accepted', 'rejected', 'merged'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Update suggestion
  const updateData: Record<string, unknown> = { status: action };

  if (action === 'merged' && mergeTargetId) {
    updateData.merge_target_id = mergeTargetId;
  }

  if (proposedData) {
    updateData.proposed_data = proposedData;
  }

  const { data: suggestion, error } = await supabase
    .from('import_suggestions')
    .update(updateData)
    .eq('id', suggestionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  // Update batch stats
  await updateBatchStats(supabase, suggestion.batch_id);

  return NextResponse.json(suggestion);
}

async function updateBatchStats(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, batchId: string) {
  const { data: suggestions } = await supabase
    .from('import_suggestions')
    .select('status')
    .eq('batch_id', batchId);

  const stats = {
    total: suggestions?.length || 0,
    pending: suggestions?.filter((s: { status: string }) => s.status === 'pending').length || 0,
    accepted: suggestions?.filter((s: { status: string }) => s.status === 'accepted').length || 0,
    rejected: suggestions?.filter((s: { status: string }) => s.status === 'rejected').length || 0,
    merged: suggestions?.filter((s: { status: string }) => s.status === 'merged').length || 0,
  };

  await supabase
    .from('import_batches')
    .update({ stats })
    .eq('id', batchId);
}
