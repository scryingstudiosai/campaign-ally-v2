import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
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

    if (!membership.character_entity_id) {
      return NextResponse.json({ error: 'No character to unlink' }, { status: 400 });
    }

    // Remove character link from membership
    const { error: updateError } = await supabase
      .from('campaign_members')
      .update({ character_entity_id: null })
      .eq('id', membership.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Unlink character error:', error);
    const message = error instanceof Error ? error.message : 'Failed to unlink character';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
