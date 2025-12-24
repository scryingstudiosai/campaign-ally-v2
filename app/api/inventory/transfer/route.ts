import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Transfer item to new owner
export async function POST(request: NextRequest) {
  const { instance_id, new_owner_type, new_owner_id, quantity } = await request.json();

  if (!instance_id || !new_owner_type || !new_owner_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current instance
  const { data: current, error: fetchError } = await supabase
    .from('inventory_instances')
    .select('*')
    .eq('id', instance_id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const transferQty = quantity || current.quantity;

  // Get max sort_order for new owner
  const { data: maxSort } = await supabase
    .from('inventory_instances')
    .select('sort_order')
    .eq('owner_type', new_owner_type)
    .eq('owner_id', new_owner_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxSort?.sort_order ?? 0) + 1;

  // Partial transfer (split stack)
  if (transferQty < current.quantity) {
    // Reduce original stack
    await supabase
      .from('inventory_instances')
      .update({ quantity: current.quantity - transferQty })
      .eq('id', instance_id);

    // Check if recipient already has this item (for stacking)
    if (current.srd_item_id) {
      const { data: existingStack } = await supabase
        .from('inventory_instances')
        .select('id, quantity')
        .eq('srd_item_id', current.srd_item_id)
        .eq('owner_type', new_owner_type)
        .eq('owner_id', new_owner_id)
        .single();

      if (existingStack) {
        // Add to existing stack
        const { data: updated, error: updateError } = await supabase
          .from('inventory_instances')
          .update({ quantity: existingStack.quantity + transferQty })
          .eq('id', existingStack.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        return NextResponse.json({ transferred: updated, remaining: current.quantity - transferQty, stacked: true });
      }
    }

    // Create new stack for recipient
    const { data: newInstance, error: createError } = await supabase
      .from('inventory_instances')
      .insert({
        campaign_id: current.campaign_id,
        srd_item_id: current.srd_item_id,
        custom_entity_id: current.custom_entity_id,
        owner_type: new_owner_type,
        owner_id: new_owner_id,
        quantity: transferQty,
        is_identified: current.is_identified,
        acquired_from: `Transferred from previous owner`,
        sort_order: newSortOrder,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ transferred: newInstance, remaining: current.quantity - transferQty });
  }

  // Full transfer - check for stacking first
  if (current.srd_item_id) {
    const { data: existingStack } = await supabase
      .from('inventory_instances')
      .select('id, quantity')
      .eq('srd_item_id', current.srd_item_id)
      .eq('owner_type', new_owner_type)
      .eq('owner_id', new_owner_id)
      .single();

    if (existingStack) {
      // Add to existing stack and delete original
      const { data: updated, error: updateError } = await supabase
        .from('inventory_instances')
        .update({ quantity: existingStack.quantity + current.quantity })
        .eq('id', existingStack.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Delete the original
      await supabase
        .from('inventory_instances')
        .delete()
        .eq('id', instance_id);

      return NextResponse.json({ transferred: updated, stacked: true });
    }
  }

  // Full transfer - move the item
  const { data, error } = await supabase
    .from('inventory_instances')
    .update({
      owner_type: new_owner_type,
      owner_id: new_owner_id,
      is_equipped: false, // Unequip on transfer
      is_attuned: false, // Break attunement on transfer
      sort_order: newSortOrder,
    })
    .eq('id', instance_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
