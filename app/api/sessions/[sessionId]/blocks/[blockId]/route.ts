import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch single block
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const supabase = await createClient();

    const { data: block, error } = await supabase
      .from('playbook_blocks')
      .select('*')
      .eq('id', blockId)
      .single();

    if (error) throw error;

    return NextResponse.json(block);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update block
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'active' && !body.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (body.status === 'completed' && !body.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data: block, error } = await supabase
      .from('playbook_blocks')
      .update(updates)
      .eq('id', blockId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(block);
  } catch (error: any) {
    console.error('Update block error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; blockId: string }> }
) {
  try {
    const { blockId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('playbook_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
