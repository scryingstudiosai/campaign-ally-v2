import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch discovered entities by type
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const type = searchParams.get('type'); // 'npc' | 'location' | 'faction' | null for all

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  // Fetch discoveries with entity data
  const query = supabase
    .from('player_discoveries')
    .select(`
      id,
      discovered_at,
      personal_notes,
      is_favorite,
      entity:entities!entity_id (
        id,
        name,
        type,
        sub_type,
        description,
        soul,
        mechanics,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('discovered_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by type if specified (JS filter is fine for <500 discoveries)
  let filtered = data || [];
  if (type) {
    filtered = filtered.filter(d => (d.entity as Record<string, unknown>)?.type === type);
  }

  return NextResponse.json(filtered);
}

// PATCH - Update discovery (notes, favorite)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, personalNotes, isFavorite } = body;

  if (!id) {
    return NextResponse.json({ error: 'Discovery ID required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (personalNotes !== undefined) updates.personal_notes = personalNotes;
  if (isFavorite !== undefined) updates.is_favorite = isFavorite;

  const { data, error } = await supabase
    .from('player_discoveries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
