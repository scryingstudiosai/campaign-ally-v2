import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface LootItem {
  srd_item_slug?: string;
  custom_name?: string;
  quantity: number;
}

interface DistributeLootRequest {
  campaignId: string;
  encounterId: string;
  encounterName: string;
  items: LootItem[];
  gold?: number;
  xp?: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: DistributeLootRequest = await request.json();
  const { campaignId, encounterId, encounterName, items, gold, xp } = body;

  if (!campaignId || ((items.length === 0) && !gold)) {
    return NextResponse.json({ error: 'Missing campaignId or items/gold' }, { status: 400 });
  }

  // Verify user has access to this campaign (must be DM)
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, user_id')
    .eq('id', campaignId)
    .single();

  if (!campaign || campaign.user_id !== user.id) {
    return NextResponse.json({ error: 'Only DM can distribute loot' }, { status: 403 });
  }

  const insertedItems: string[] = [];
  const errors: string[] = [];

  // Add each item to party inventory
  for (const item of items) {
    try {
      // Try to find SRD item if we have a slug
      let srdItemId: string | null = null;
      if (item.srd_item_slug) {
        const { data: srdItem } = await supabase
          .from('srd_items')
          .select('id')
          .eq('slug', item.srd_item_slug)
          .single();

        if (srdItem) {
          srdItemId = srdItem.id;
        }
      }

      // Insert into inventory_instances with owner_type = 'party'
      const { error: insertError } = await supabase
        .from('inventory_instances')
        .insert({
          campaign_id: campaignId,
          srd_item_id: srdItemId,
          custom_name: item.custom_name || null,
          owner_type: 'party',
          owner_id: campaignId, // Use campaign ID as owner for party loot
          quantity: item.quantity || 1,
          is_equipped: false,
          source_type: 'loot',
          source_entity_id: encounterId,
          source_description: `Loot from ${encounterName}`,
          status: 'approved',
        });

      if (insertError) {
        errors.push(`Failed to add ${item.custom_name || item.srd_item_slug}: ${insertError.message}`);
      } else {
        insertedItems.push(item.custom_name || item.srd_item_slug || 'item');
      }
    } catch (err) {
      errors.push(`Error adding item: ${String(err)}`);
    }
  }

  // Log XP if provided (could be stored in session or broadcast to players)
  if (xp && xp > 0) {
    console.log(`[Loot Distribution] ${xp} XP awarded from ${encounterName}`);
    // TODO: Add XP to player characters or party pool
  }

  // Add gold to party treasury
  let goldAdded = 0;
  if (gold && gold > 0) {
    // Get current party gold
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('party_gold')
      .eq('id', campaignId)
      .single();

    const currentGold = currentCampaign?.party_gold || 0;
    const newTotal = currentGold + gold;

    // Update party gold
    const { error: goldError } = await supabase
      .from('campaigns')
      .update({ party_gold: newTotal })
      .eq('id', campaignId);

    if (goldError) {
      errors.push(`Failed to add gold: ${goldError.message}`);
    } else {
      goldAdded = gold;
      console.log(`[Loot Distribution] Added ${gold} gp to party treasury (new total: ${newTotal} gp)`);
    }
  }

  return NextResponse.json({
    success: true,
    itemsAdded: insertedItems.length,
    items: insertedItems,
    goldAdded,
    xp: xp || 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
