import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { scanTextForEntities } from '@/lib/services/unified-scanner';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { campaignId, title, content, fileType = 'text' } = body;

  if (!campaignId || !title || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: campaignId, title, content' },
      { status: 400 }
    );
  }

  // Verify campaign ownership
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  try {
    // 1. Create source document
    const { data: sourceDoc, error: docError } = await supabase
      .from('source_docs')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        title,
        content,
        file_type: fileType,
        word_count: content.split(/\s+/).length,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) throw docError;

    // 2. Create import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        source_doc_id: sourceDoc.id,
        name: `Import: ${title}`,
        status: 'staging',
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 3. Scan text for entities
    const scanResult = await scanTextForEntities(content, campaignId);

    // 4. Create suggestions for each mention
    const suggestions = scanResult.mentions.map((mention) => ({
      batch_id: batch.id,
      campaign_id: campaignId,
      user_id: user.id,
      entity_name: mention.name,
      entity_type: mention.type,
      confidence_score: mention.confidence,
      snippet: mention.snippet,
      text_start_index: mention.textRange.start,
      text_end_index: mention.textRange.end,
      status: 'pending',
      merge_target_id: mention.existingMatch?.id || null,
      similarity_score: mention.existingMatch?.similarity || null,
      proposed_data: {
        soul: { description: mention.summary },
      },
    }));

    if (suggestions.length > 0) {
      const { error: suggestionsError } = await supabase
        .from('import_suggestions')
        .insert(suggestions);

      if (suggestionsError) throw suggestionsError;
    }

    // 5. Update source doc status
    await supabase
      .from('source_docs')
      .update({ status: 'processed' })
      .eq('id', sourceDoc.id);

    // 6. Update batch stats
    await supabase
      .from('import_batches')
      .update({
        stats: {
          total: scanResult.stats.total,
          newEntities: scanResult.stats.newEntities,
          potentialMerges: scanResult.stats.potentialMerges,
          pending: scanResult.stats.total,
          accepted: 0,
          rejected: 0,
        },
      })
      .eq('id', batch.id);

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      sourceDocId: sourceDoc.id,
      stats: scanResult.stats,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
}
