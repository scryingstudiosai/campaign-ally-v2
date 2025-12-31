import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Create new manual suggestion
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    batchId,
    campaignId,
    entityName,
    entityType,
    textStartIndex,
    textEndIndex,
    snippet,
    confidenceScore = 1.0,
    status = 'pending',
  } = body;

  if (!batchId || !campaignId || !entityName || !entityType) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Verify batch ownership
  const { data: batch } = await supabase
    .from('import_batches')
    .select('id')
    .eq('id', batchId)
    .eq('user_id', user.id)
    .single();

  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  // Check for similar existing entities
  let bestMatch: { id: string; name: string; similarity: number } | null = null;
  try {
    const { data: similarEntities } = await supabase
      .rpc('find_similar_entities', {
        p_campaign_id: campaignId,
        p_name: entityName,
        p_threshold: 0.3,
      });

    if (similarEntities && similarEntities.length > 0) {
      bestMatch = similarEntities[0];
    }
  } catch {
    // Fallback if RPC doesn't exist
    const { data: existingEntities } = await supabase
      .from('entities')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .ilike('name', `%${entityName}%`)
      .limit(1);

    if (existingEntities && existingEntities.length > 0) {
      bestMatch = {
        id: existingEntities[0].id,
        name: existingEntities[0].name,
        similarity: 0.7,
      };
    }
  }

  // Create suggestion
  const { data: suggestion, error } = await supabase
    .from('import_suggestions')
    .insert({
      batch_id: batchId,
      campaign_id: campaignId,
      user_id: user.id,
      entity_name: entityName,
      entity_type: entityType,
      confidence_score: confidenceScore,
      snippet: snippet ? `...${snippet}...` : null,
      text_start_index: textStartIndex,
      text_end_index: textEndIndex,
      status,
      merge_target_id: bestMatch && bestMatch.similarity > 0.6 ? bestMatch.id : null,
      similarity_score: bestMatch?.similarity || null,
      proposed_data: {
        soul: { description: `Manually tagged ${entityType}` },
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }

  // Update batch stats
  const { data: allSuggestions } = await supabase
    .from('import_suggestions')
    .select('status')
    .eq('batch_id', batchId);

  const stats = {
    total: allSuggestions?.length || 0,
    pending: allSuggestions?.filter(s => s.status === 'pending').length || 0,
    accepted: allSuggestions?.filter(s => s.status === 'accepted').length || 0,
    rejected: allSuggestions?.filter(s => s.status === 'rejected').length || 0,
  };

  await supabase
    .from('import_batches')
    .update({ stats })
    .eq('id', batchId);

  return NextResponse.json(suggestion);
}
