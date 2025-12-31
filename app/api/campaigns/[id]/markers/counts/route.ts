import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get marker counts per location for a campaign
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId } = await params;
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

  // Get marker counts grouped by parent_location_id
  const { data: markers, error } = await supabase
    .from('map_markers')
    .select('parent_location_id')
    .eq('campaign_id', campaignId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count markers per location
  const counts: Record<string, number> = {};
  markers?.forEach((marker) => {
    const locId = marker.parent_location_id;
    counts[locId] = (counts[locId] || 0) + 1;
  });

  return NextResponse.json(counts);
}
