import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedEntity, embedCampaignEntities } from '@/lib/ai/embedding';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entityId, campaignId, batchAll, forceRegenerate } = body;

    // Batch embed all entities in a campaign
    if (batchAll && campaignId) {
      // Verify user owns this campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      const result = await embedCampaignEntities(campaignId, {
        limit: 100,
        forceRegenerate,
      });

      return NextResponse.json({
        success: true,
        message: `Embedded ${result.success} entities`,
        ...result,
      });
    }

    // Embed single entity
    if (entityId) {
      // Verify user has access to this entity's campaign
      const { data: entity } = await supabase
        .from('entities')
        .select('campaign_id')
        .eq('id', entityId)
        .single();

      if (!entity) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', entity.campaign_id)
        .eq('user_id', user.id)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const success = await embedEntity(entityId);

      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Missing entityId or campaignId' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[Embeddings API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
