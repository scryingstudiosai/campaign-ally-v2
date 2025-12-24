import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List inventory for an owner
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get('campaignId');
  const ownerType = searchParams.get('ownerType');
  const ownerId = searchParams.get('ownerId');

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from('inventory_instances')
    .select(`
      *,
      srd_item:srd_items(id, name, item_type, rarity, description, value_gp, weight, mechanics),
      custom_entity:entities(id, name, sub_type, description, mechanics)
    `)
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (ownerType && ownerId) {
    query = query.eq('owner_type', ownerType).eq('owner_id', ownerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Add item to inventory
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    campaign_id,
    srd_item_id,
    custom_entity_id,
    owner_type,
    owner_id,
    quantity = 1,
    acquired_from,
    notes,
  } = body;

  // Validation
  if (!campaign_id || !owner_type || !owner_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!srd_item_id && !custom_entity_id) {
    return NextResponse.json({ error: 'Must specify srd_item_id or custom_entity_id' }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if stackable item already exists for this owner (SRD items only)
  if (srd_item_id) {
    const { data: existing } = await supabase
      .from('inventory_instances')
      .select('id, quantity')
      .eq('campaign_id', campaign_id)
      .eq('srd_item_id', srd_item_id)
      .eq('owner_type', owner_type)
      .eq('owner_id', owner_id)
      .single();

    // Stack if exists
    if (existing) {
      const { data, error } = await supabase
        .from('inventory_instances')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ...data, stacked: true });
    }
  }

  // Get max sort_order for this owner to append at end
  const { data: maxSort } = await supabase
    .from('inventory_instances')
    .select('sort_order')
    .eq('owner_type', owner_type)
    .eq('owner_id', owner_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxSort?.sort_order ?? 0) + 1;

  // Create new instance
  const { data, error } = await supabase
    .from('inventory_instances')
    .insert({
      campaign_id,
      srd_item_id: srd_item_id || null,
      custom_entity_id: custom_entity_id || null,
      owner_type,
      owner_id,
      quantity,
      acquired_from,
      notes,
      sort_order: newSortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add to inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
