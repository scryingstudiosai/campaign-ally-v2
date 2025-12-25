import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH - Update inventory item (use, attune, equip, change quantity, reorder, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_instances')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Remove from inventory (consumed, sold, destroyed)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inventory_instances')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Failed to delete inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
