import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, entityId } = await req.json();

    if (!campaignId || !entityId) {
      return NextResponse.json({ error: 'Campaign ID and Entity ID required' }, { status: 400 });
    }

    // Get membership
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('id, character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a campaign member' }, { status: 403 });
    }

    // Check if character is a player entity in this campaign
    const { data: entity } = await supabase
      .from('entities')
      .select('id, entity_type, campaign_id')
      .eq('id', entityId)
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'player')
      .is('deleted_at', null)
      .single();

    if (!entity) {
      return NextResponse.json({ error: 'Character not found or not a player character' }, { status: 404 });
    }

    // Check if character is already claimed by someone else
    const { data: existingClaim } = await supabase
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('character_entity_id', entityId)
      .neq('user_id', user.id)
      .single();

    if (existingClaim) {
      return NextResponse.json({ error: 'Character is already claimed by another player' }, { status: 409 });
    }

    // Update membership with character
    const { error: updateError } = await supabase
      .from('campaign_members')
      .update({ character_entity_id: entityId })
      .eq('id', membership.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Claim character error:', error);
    const message = error instanceof Error ? error.message : 'Failed to claim character';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
