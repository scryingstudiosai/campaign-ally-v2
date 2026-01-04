import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertRelationship, deleteRelationship } from '@/lib/relationships/mutations';

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
    const {
      campaignId,
      sourceEntityId,
      targetEntityId,
      category,
      typeKey,
      descriptor,
      description,
      strength,
      volatility,
      state,
      visibility,
    } = body;

    // Verify user has access to campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const result = await upsertRelationship({
      campaign_id: campaignId,
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      category,
      type_key: typeKey,
      descriptor,
      description,
      strength,
      volatility,
      state: state || 'active',
      visibility,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      id: result.id,
      reverseId: result.reverseId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing relationship ID' }, { status: 400 });
    }

    const result = await upsertRelationship(
      {
        campaign_id: data.campaignId,
        source_entity_id: data.sourceEntityId,
        target_entity_id: data.targetEntityId,
        category: data.category,
        type_key: data.typeKey,
        descriptor: data.descriptor,
        description: data.description,
        strength: data.strength,
        volatility: data.volatility,
        state: data.state || 'active',
        visibility: data.visibility,
      },
      id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      id: result.id,
      reverseId: result.reverseId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const campaignId = searchParams.get('campaignId');

    if (!id || !campaignId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const result = await deleteRelationship(id, campaignId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
