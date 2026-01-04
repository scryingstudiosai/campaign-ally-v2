import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Suggestion {
  id: string;
  entity_name: string;
  entity_type: string;
  status: string;
  merge_target_id: string | null;
  proposed_data: {
    soul?: { description?: string };
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
  };
}

// POST - Commit accepted/merged suggestions to create entities
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { batchId } = body;

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  // Fetch batch with suggestions
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .select(`
      *,
      suggestions:import_suggestions(*)
    `)
    .eq('id', batchId)
    .eq('user_id', user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  if (batch.status === 'committed') {
    return NextResponse.json({ error: 'Batch already committed' }, { status: 400 });
  }

  const suggestions = batch.suggestions as Suggestion[];
  const accepted = suggestions.filter((s) => s.status === 'accepted');
  const merged = suggestions.filter((s) => s.status === 'merged');
  const ignored = suggestions.filter((s) => s.status === 'rejected');

  const stats = { created: 0, merged: 0, ignored: ignored.length };

  try {
    // Process accepted suggestions - create new entities
    for (const suggestion of accepted) {
      const { error: insertError } = await supabase
        .from('entities')
        .insert({
          campaign_id: batch.campaign_id,
          name: suggestion.entity_name,
          entity_type: suggestion.entity_type,
          summary: suggestion.proposed_data?.soul?.description || null,
          status: 'active',
          forge_status: 'stub',
          soul: suggestion.proposed_data?.soul || {},
          brain: suggestion.proposed_data?.brain || {},
          mechanics: suggestion.proposed_data?.mechanics || {},
        });

      if (!insertError) {
        stats.created++;
      } else {
        console.error('Failed to create entity:', insertError);
      }
    }

    // Process merged suggestions - update existing entities
    for (const suggestion of merged) {
      if (!suggestion.merge_target_id) continue;

      // Get existing entity
      const { data: existingEntity } = await supabase
        .from('entities')
        .select('soul, brain, mechanics')
        .eq('id', suggestion.merge_target_id)
        .single();

      if (!existingEntity) continue;

      // Merge the data (new data extends existing)
      const mergedSoul = {
        ...(existingEntity.soul as Record<string, unknown> || {}),
        ...(suggestion.proposed_data?.soul || {}),
      };

      const mergedBrain = {
        ...(existingEntity.brain as Record<string, unknown> || {}),
        ...(suggestion.proposed_data?.brain || {}),
      };

      const mergedMechanics = {
        ...(existingEntity.mechanics as Record<string, unknown> || {}),
        ...(suggestion.proposed_data?.mechanics || {}),
      };

      const { error: updateError } = await supabase
        .from('entities')
        .update({
          soul: mergedSoul,
          brain: mergedBrain,
          mechanics: mergedMechanics,
        })
        .eq('id', suggestion.merge_target_id);

      if (!updateError) {
        stats.merged++;
      } else {
        console.error('Failed to merge entity:', updateError);
      }
    }

    // Update batch status to committed
    await supabase
      .from('import_batches')
      .update({
        status: 'committed',
        stats: {
          ...batch.stats,
          committed: {
            created: stats.created,
            merged: stats.merged,
            ignored: stats.ignored,
          },
        },
      })
      .eq('id', batchId);

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Commit error:', error);
    return NextResponse.json(
      { error: 'Failed to commit entities' },
      { status: 500 }
    );
  }
}
