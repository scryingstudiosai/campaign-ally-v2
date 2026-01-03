import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding vector for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length < 5) {
    throw new Error('Text too short for embedding');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // Truncate to model limit
  });

  return response.data[0].embedding;
}

/**
 * Generate and save embedding for an entity
 */
export async function embedEntity(entityId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get entity data
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('id, name, summary, description, entity_type, brain, soul')
      .eq('id', entityId)
      .single();

    if (fetchError || !entity) {
      console.error('[Embedding] Entity not found:', entityId);
      return false;
    }

    // Build comprehensive text for embedding
    const brain = entity.brain as Record<string, unknown> | null;
    const soul = entity.soul as Record<string, unknown> | null;

    const textParts = [
      entity.name,
      entity.entity_type,
      entity.summary,
      entity.description,
      // Include brain/soul key details for richer context
      brain?.secret as string | undefined,
      brain?.purpose as string | undefined,
      brain?.motivation as string | undefined,
      soul?.description as string | undefined,
      soul?.backstory as string | undefined,
    ].filter(Boolean);

    const text = textParts.join('. ');

    if (text.length < 20) {
      console.log('[Embedding] Skipping entity with insufficient text:', entity.name);
      return false;
    }

    // Generate embedding
    console.log(`[Embedding] Generating for: ${entity.name}`);
    const embedding = await generateEmbedding(text);

    // Save to database
    const { error: updateError } = await supabase
      .from('entities')
      .update({ embedding })
      .eq('id', entityId);

    if (updateError) {
      console.error('[Embedding] Failed to save:', updateError);
      return false;
    }

    console.log(`[Embedding] ✓ Embedded: ${entity.name}`);
    return true;
  } catch (error) {
    console.error('[Embedding] Error:', error);
    return false;
  }
}

/**
 * Batch embed all entities in a campaign that don't have embeddings
 */
export async function embedCampaignEntities(
  campaignId: string,
  options?: { limit?: number; forceRegenerate?: boolean }
): Promise<{ total: number; success: number; failed: number }> {
  const supabase = await createClient();
  const limit = options?.limit || 100;

  // Get entities needing embeddings
  let query = supabase
    .from('entities')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .limit(limit);

  if (!options?.forceRegenerate) {
    query = query.is('embedding', null);
  }

  const { data: entities, error } = await query;

  if (error || !entities) {
    console.error('[Embedding] Failed to fetch entities:', error);
    return { total: 0, success: 0, failed: 0 };
  }

  console.log(`[Embedding] Processing ${entities.length} entities for campaign ${campaignId}`);

  let success = 0;
  let failed = 0;

  for (const entity of entities) {
    const result = await embedEntity(entity.id);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate limit: avoid hitting OpenAI limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[Embedding] Complete: ${success} success, ${failed} failed`);
  return { total: entities.length, success, failed };
}
