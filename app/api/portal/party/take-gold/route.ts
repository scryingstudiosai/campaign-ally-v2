import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, amount } = await req.json();

    if (!campaignId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify user is a member of this campaign
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!membership?.character_entity_id) {
      return NextResponse.json({ error: 'No character linked to this campaign' }, { status: 400 });
    }

    // Get current party gold
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('party_gold')
      .eq('id', campaignId)
      .single();

    if (!campaign || (campaign.party_gold || 0) < amount) {
      return NextResponse.json({ error: 'Not enough gold in treasury' }, { status: 400 });
    }

    // Deduct from party treasury
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ party_gold: (campaign.party_gold || 0) - amount })
      .eq('id', campaignId);

    if (updateError) {
      console.error('[TakeGold] Failed to update treasury:', updateError);
      return NextResponse.json({ error: 'Failed to update treasury' }, { status: 500 });
    }

    // Get player's character to add gold to their soul.gold
    const { data: character } = await supabase
      .from('entities')
      .select('soul')
      .eq('id', membership.character_entity_id)
      .single();

    const soul = (character?.soul || {}) as Record<string, unknown>;
    const currentGold = (soul.gold as number) || 0;

    // Update character's gold
    const { error: charError } = await supabase
      .from('entities')
      .update({
        soul: {
          ...soul,
          gold: currentGold + amount,
        },
      })
      .eq('id', membership.character_entity_id);

    if (charError) {
      console.error('[TakeGold] Failed to update character gold:', charError);
      // Don't fail - treasury was already deducted
    }

    console.log(`[TakeGold] ${user.id} took ${amount} gp from party treasury`);

    return NextResponse.json({
      success: true,
      newPartyGold: (campaign.party_gold || 0) - amount,
      newPlayerGold: currentGold + amount,
    });
  } catch (error) {
    console.error('[TakeGold] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to take gold' },
      { status: 500 }
    );
  }
}
