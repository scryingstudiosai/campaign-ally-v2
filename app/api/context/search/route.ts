import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embedding';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, query, threshold = 0.2, limit = 10 } = await req.json();

    if (!campaignId || !query) {
      return NextResponse.json({ error: 'Missing campaignId or query' }, { status: 400 });
    }

    // Verify user owns this campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log(`[ContextSearch] Query: "${query}" in campaign ${campaignId}`);

    // Generate embedding for search query
    const embeddingArray = await generateEmbedding(query);

    // Convert to string format for Supabase vector type
    // Format: "[0.1,0.2,0.3,...]"
    const embeddingString = `[${embeddingArray.join(',')}]`;

    console.log(`[ContextSearch] Generated embedding with ${embeddingArray.length} dimensions`);

    // Perform semantic search
    const { data: results, error } = await supabase.rpc('match_campaign_context_text', {
      query_embedding_text: embeddingString,
      match_threshold: threshold,
      match_count: limit,
      p_campaign_id: campaignId,
    });

    if (error) {
      console.error('[ContextSearch] Search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[ContextSearch] Found ${results?.length || 0} results`);

    return NextResponse.json({
      query,
      results: results || [],
      count: results?.length || 0,
    });
  } catch (error: unknown) {
    console.error('[ContextSearch] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
