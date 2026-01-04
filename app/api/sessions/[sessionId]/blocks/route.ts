import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all blocks for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    const { data: blocks, error } = await supabase
      .from('playbook_blocks')
      .select('*')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(blocks || []);
  } catch (error: any) {
    console.error('Fetch blocks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new block
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Get max sort_order for this session
    const { data: existing } = await supabase
      .from('playbook_blocks')
      .select('sort_order')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0
      ? existing[0].sort_order + 1
      : 0;

    const { data: block, error } = await supabase
      .from('playbook_blocks')
      .insert({
        session_id: sessionId,
        block_type: body.block_type,
        title: body.title,
        content: body.content || {},
        sort_order: body.sort_order ?? nextOrder,
        parent_id: body.parent_id || null,
        status: body.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(block);
  } catch (error: any) {
    console.error('Create block error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Reorder blocks
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { blocks } = await request.json();

    // Update sort_order for each block
    for (let i = 0; i < blocks.length; i++) {
      const { error } = await supabase
        .from('playbook_blocks')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', blocks[i].id)
        .eq('session_id', sessionId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reorder blocks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
