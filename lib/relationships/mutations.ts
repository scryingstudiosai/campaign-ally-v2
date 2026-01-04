import { createClient } from '@/lib/supabase/server';
import { DEFAULT_RELATIONSHIP_TYPES } from './types';

interface RelationshipData {
  campaign_id: string;
  source_entity_id: string;
  target_entity_id: string;
  category: string;
  type_key?: string | null;
  descriptor?: string | null;
  description?: string | null;
  strength: number;
  volatility: number;
  state?: string;
  visibility: 'public' | 'dm_only';
}

/**
 * Upsert a relationship with automatic reciprocity handling.
 * If the relationship type is directed and has a reverse_key,
 * automatically creates/updates the reverse relationship.
 */
export async function upsertRelationship(
  data: RelationshipData,
  existingId?: string
): Promise<{ success: boolean; id?: string; reverseId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // 1. Upsert the forward relationship
    let forwardResult;

    const relationshipPayload = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      // Update existing
      const { data: updated, error } = await supabase
        .from('entity_relationships')
        .update(relationshipPayload)
        .eq('id', existingId)
        .select('id')
        .single();

      if (error) throw error;
      forwardResult = updated;
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .from('entity_relationships')
        .insert(relationshipPayload)
        .select('id')
        .single();

      if (error) throw error;
      forwardResult = inserted;
    }

    // 2. Check if we need to create a reverse relationship
    let reverseId: string | undefined;

    if (data.type_key) {
      // Look up the relationship type
      const { data: relType } = await supabase
        .from('relationship_types')
        .select('key, directed, reverse_key')
        .eq('campaign_id', data.campaign_id)
        .eq('key', data.type_key)
        .single();

      if (relType?.directed && relType.reverse_key) {
        // Create/update the reverse relationship
        const reversePayload: RelationshipData = {
          campaign_id: data.campaign_id,
          source_entity_id: data.target_entity_id, // Swapped!
          target_entity_id: data.source_entity_id, // Swapped!
          category: data.category,
          type_key: relType.reverse_key,
          descriptor: null, // Let the reverse type define its own descriptor
          description: data.description, // Share the "why"
          strength: data.strength,
          volatility: data.volatility,
          state: data.state || 'active',
          visibility: data.visibility,
        };

        // Check if reverse already exists
        const { data: existingReverse } = await supabase
          .from('entity_relationships')
          .select('id')
          .eq('campaign_id', data.campaign_id)
          .eq('source_entity_id', data.target_entity_id)
          .eq('target_entity_id', data.source_entity_id)
          .eq('type_key', relType.reverse_key)
          .single();

        if (existingReverse) {
          // Update existing reverse
          const { data: updatedReverse } = await supabase
            .from('entity_relationships')
            .update({
              ...reversePayload,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingReverse.id)
            .select('id')
            .single();

          reverseId = updatedReverse?.id;
        } else {
          // Insert new reverse
          const { data: insertedReverse } = await supabase
            .from('entity_relationships')
            .insert(reversePayload)
            .select('id')
            .single();

          reverseId = insertedReverse?.id;
        }

        console.log(`[Relationships] Created/updated reverse relationship: ${relType.reverse_key}`);
      }
    }

    return {
      success: true,
      id: forwardResult?.id,
      reverseId,
    };
  } catch (error) {
    console.error('[Relationships] Upsert failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a relationship and its reverse (if directed).
 */
export async function deleteRelationship(
  relationshipId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get the relationship first
    const { data: rel } = await supabase
      .from('entity_relationships')
      .select('source_entity_id, target_entity_id, type_key')
      .eq('id', relationshipId)
      .single();

    if (!rel) {
      return { success: false, error: 'Relationship not found' };
    }

    // Delete the forward relationship
    await supabase.from('entity_relationships').delete().eq('id', relationshipId);

    // If directed with reverse_key, delete the reverse too
    if (rel.type_key) {
      const { data: relType } = await supabase
        .from('relationship_types')
        .select('directed, reverse_key')
        .eq('campaign_id', campaignId)
        .eq('key', rel.type_key)
        .single();

      if (relType?.directed && relType.reverse_key) {
        await supabase
          .from('entity_relationships')
          .delete()
          .eq('campaign_id', campaignId)
          .eq('source_entity_id', rel.target_entity_id)
          .eq('target_entity_id', rel.source_entity_id)
          .eq('type_key', relType.reverse_key);

        console.log(`[Relationships] Deleted reverse relationship: ${relType.reverse_key}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Relationships] Delete failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Seed default relationship types for a campaign.
 */
export async function seedRelationshipTypes(campaignId: string): Promise<void> {
  const supabase = await createClient();

  // Check if types already exist
  const { count } = await supabase
    .from('relationship_types')
    .select('id', { count: 'exact' })
    .eq('campaign_id', campaignId);

  if (count && count > 0) {
    console.log(`[RelationshipTypes] Campaign ${campaignId} already has ${count} types`);
    return;
  }

  // Insert default types
  const typesToInsert = DEFAULT_RELATIONSHIP_TYPES.map((type) => ({
    ...type,
    campaign_id: campaignId,
    is_system: true,
  }));

  const { error } = await supabase.from('relationship_types').insert(typesToInsert);

  if (error) {
    console.error('[RelationshipTypes] Failed to seed:', error);
    return;
  }

  console.log(`[RelationshipTypes] Seeded ${typesToInsert.length} types for campaign ${campaignId}`);
}
