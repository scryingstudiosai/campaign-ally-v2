import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

interface RouteParams {
  params: Promise<{ id: string; playerId: string }>;
}

interface BulkItem {
  name: string;
  quantity?: number;
  notes?: string;
}

// Helper to find SRD item match
async function findSrdItemMatch(
  supabase: SupabaseClient,
  itemName: string
): Promise<{ id: string; name: string } | null> {
  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('srd_items')
    .select('id, name')
    .ilike('name', itemName)
    .limit(1)
    .single();

  if (exactMatch) return exactMatch;

  // Try fuzzy match - remove common prefixes/suffixes
  const simplifiedName = itemName
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical notes like "(1 day)"
    .replace(/\s*\d+\s*(feet|foot|ft)\s*/gi, '') // Remove measurements
    .trim();

  if (simplifiedName !== itemName) {
    const { data: fuzzyMatch } = await supabase
      .from('srd_items')
      .select('id, name')
      .ilike('name', `%${simplifiedName}%`)
      .limit(1)
      .single();

    if (fuzzyMatch) return fuzzyMatch;
  }

  return null;
}

// POST - Bulk add items to player inventory
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId, playerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Verify player exists
  const { data: player, error: playerError } = await supabase
    .from('entities')
    .select('id, name')
    .eq('id', playerId)
    .eq('campaign_id', campaignId)
    .eq('entity_type', 'player')
    .is('deleted_at', null)
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Parse request body
  const body = await req.json();
  const { items } = body as { items: BulkItem[] };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array required' }, { status: 400 });
  }

  // Get max sort order for this player
  const { data: maxSort } = await supabase
    .from('inventory_instances')
    .select('sort_order')
    .eq('owner_type', 'player')
    .eq('owner_id', playerId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  let sortOrder = (maxSort?.sort_order ?? 0) + 1;

  // Process each item
  const results = {
    added: 0,
    srdMatches: 0,
    customItems: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    if (!item.name?.trim()) continue;

    try {
      // Skip currency (handled separately)
      const nameLower = item.name.toLowerCase();
      if (
        nameLower.includes('gold piece') ||
        nameLower.includes('silver piece') ||
        nameLower.includes('copper piece')
      ) {
        continue;
      }

      // Try to find SRD match
      const srdItem = await findSrdItemMatch(supabase, item.name);

      if (srdItem) {
        // Check if already exists for stacking
        const { data: existing } = await supabase
          .from('inventory_instances')
          .select('id, quantity')
          .eq('srd_item_id', srdItem.id)
          .eq('owner_type', 'player')
          .eq('owner_id', playerId)
          .single();

        if (existing) {
          // Stack
          await supabase
            .from('inventory_instances')
            .update({ quantity: existing.quantity + (item.quantity || 1) })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase.from('inventory_instances').insert({
            campaign_id: campaignId,
            srd_item_id: srdItem.id,
            owner_type: 'player',
            owner_id: playerId,
            quantity: item.quantity || 1,
            acquired_from: `Character creation`,
            notes: item.notes || null,
            sort_order: sortOrder++,
            is_identified: true,
          });
        }
        results.srdMatches++;
        results.added++;
      } else {
        // Create custom item stub entity and link to inventory
        const { data: customEntity, error: entityError } = await supabase
          .from('entities')
          .insert({
            campaign_id: campaignId,
            name: item.name,
            entity_type: 'item',
            sub_type: 'gear',
            forge_status: 'stub',
            summary: item.notes || 'Starting equipment',
            attributes: {
              is_stub: true,
              needs_review: false, // Starting gear doesn't need review
            },
          })
          .select('id')
          .single();

        if (entityError || !customEntity) {
          results.errors.push(`Failed to create item: ${item.name}`);
          continue;
        }

        // Add to inventory
        await supabase.from('inventory_instances').insert({
          campaign_id: campaignId,
          custom_entity_id: customEntity.id,
          owner_type: 'player',
          owner_id: playerId,
          quantity: item.quantity || 1,
          acquired_from: `Character creation`,
          notes: item.notes || null,
          sort_order: sortOrder++,
          is_identified: true,
        });

        results.customItems++;
        results.added++;
      }
    } catch (error) {
      results.errors.push(
        `Error processing ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return NextResponse.json({
    success: true,
    results,
    message: `Added ${results.added} items (${results.srdMatches} SRD, ${results.customItems} custom)`,
  });
}
