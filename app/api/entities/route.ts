import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/entities?campaignId=X&entityType=npc
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get('campaignId');
  const entityType = searchParams.get('entityType');

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  }

  const supabase = await createClient();

  let query = supabase
    .from('entities')
    .select('id, name, entity_type, sub_type')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .order('name');

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch entities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
