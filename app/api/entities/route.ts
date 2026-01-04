import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedEntity } from '@/lib/ai/embedding';

// POST /api/entities - Create a new entity
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support two formats:
    // 1. Direct entity creation: { campaignId, entity: { name, entity_type, ... } }
    // 2. Forged entity: { campaignId, forgeType, output }
    const { campaignId, entity, forgeType, output } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    let entityData: Record<string, unknown>;

    if (entity) {
      // Direct entity creation
      entityData = {
        campaign_id: campaignId,
        name: entity.name || 'Unnamed',
        entity_type: entity.entity_type || 'npc',
        sub_type: entity.sub_type,
        summary: entity.summary,
        status: entity.status || 'active',
        forge_status: entity.forge_status || 'stub',
        brain: entity.brain,
        soul: entity.soul,
        mechanics: entity.mechanics,
        attributes: entity.attributes,
      };
    } else if (forgeType && output) {
      // Forged entity - transform from forge output to entity format
      entityData = {
        campaign_id: campaignId,
        name: output.name || 'Unnamed',
        entity_type: forgeType,
        sub_type: output.sub_type,
        summary: output.dm_slug || output.dmSlug || output.summary,
        status: 'active',
        forge_status: 'complete',
        brain: output.brain || {
          desire: output.motivation,
          fear: output.secret,
        },
        soul: output.soul || {
          read_aloud: output.read_aloud,
          appearance: output.appearance,
          personality: output.personality,
          voice: output.voiceAndMannerisms,
        },
        mechanics: output.mechanics || {
          ac: output.combatStats?.armorClass,
          hp: output.combatStats?.hitPoints,
          loot: output.loot,
          tags: output.tags,
        },
      };
    } else {
      return NextResponse.json(
        { error: 'Either entity or (forgeType + output) is required' },
        { status: 400 }
      );
    }

    // Insert the entity
    const { data: newEntity, error: insertError } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert entity:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger embedding generation (fire and forget - don't block response)
    if (newEntity?.id) {
      embedEntity(newEntity.id).catch((err) =>
        console.error('[Entity] Embedding generation failed:', err)
      );
    }

    return NextResponse.json(newEntity);
  } catch (error) {
    console.error('Entity creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}

// GET /api/entities?campaignId=X&entityType=npc
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get('campaignId');
  const entityType = searchParams.get('entityType') || searchParams.get('type'); // Support both params

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Select full entity data including mechanics for combat
  let query = supabase
    .from('entities')
    .select('id, name, entity_type, sub_type, summary, mechanics, brain, soul')
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
