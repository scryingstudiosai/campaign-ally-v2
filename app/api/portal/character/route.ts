import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch player's character
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  // Get campaign membership with character
  const { data: membership, error: memberError } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      character:entities!character_entity_id (
        id,
        name,
        type,
        sub_type,
        description,
        soul,
        mechanics,
        brain,
        resources,
        image_url,
        created_at,
        updated_at
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    return NextResponse.json({ error: 'Not a member of this campaign' }, { status: 403 });
  }

  return NextResponse.json({
    membership,
    character: membership.character,
  });
}

// PATCH - Update character (player-editable fields only)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { campaignId, characterId, updates } = body;

  if (!campaignId || !characterId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify this is the player's character
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.character_entity_id !== characterId) {
    return NextResponse.json({ error: 'Not your character' }, { status: 403 });
  }

  // Build safe update object (only allow certain fields)
  const safeUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Allow updating soul (backstory, personality, goals - player flavor)
  if (updates.soul) {
    const { data: existing } = await supabase
      .from('entities')
      .select('soul')
      .eq('id', characterId)
      .single();

    const existingSoul = (existing?.soul || {}) as Record<string, unknown>;

    safeUpdates.soul = {
      ...existingSoul,
      backstory: updates.soul.backstory ?? existingSoul.backstory,
      personality: updates.soul.personality ?? existingSoul.personality,
      goals: updates.soul.goals ?? existingSoul.goals,
      bonds: updates.soul.bonds ?? existingSoul.bonds,
      flaws: updates.soul.flaws ?? existingSoul.flaws,
      ideals: updates.soul.ideals ?? existingSoul.ideals,
      notes: updates.soul.notes ?? existingSoul.notes,
    };
  }

  // Allow updating mechanics (Current HP, Temp HP, conditions - tracked in play)
  // NOTE: Max HP, AC, Level are NOT editable by players
  if (updates.mechanics) {
    const { data: existing } = await supabase
      .from('entities')
      .select('mechanics')
      .eq('id', characterId)
      .single();

    const existingMechanics = (existing?.mechanics || {}) as Record<string, unknown>;

    safeUpdates.mechanics = {
      ...existingMechanics,
      // FLUX values - player can edit
      current_hp: updates.mechanics.current_hp ?? existingMechanics.current_hp,
      temp_hp: updates.mechanics.temp_hp ?? existingMechanics.temp_hp,
      conditions: updates.mechanics.conditions ?? existingMechanics.conditions,
      death_saves: updates.mechanics.death_saves ?? existingMechanics.death_saves,
      spell_slots_used: updates.mechanics.spell_slots_used ?? existingMechanics.spell_slots_used,
      resources_used: updates.mechanics.resources_used ?? existingMechanics.resources_used,
      notes: updates.mechanics.notes ?? existingMechanics.notes,
      // CORE values preserved from existing - player cannot change
      // max_hp, ac, level, ability_scores, etc. stay as-is
    };
  }

  // Allow updating resources (inspiration - player can spend it)
  if (updates.resources) {
    const { data: existing } = await supabase
      .from('entities')
      .select('resources')
      .eq('id', characterId)
      .single();

    const existingResources = (existing?.resources || {}) as Record<string, unknown>;

    safeUpdates.resources = {
      ...existingResources,
      // Players can only SPEND inspiration (set to false), not grant it
      inspiration: updates.resources.inspiration === false ? false : existingResources.inspiration,
    };
  }

  // Allow updating description
  if (updates.description !== undefined) {
    safeUpdates.description = updates.description;
  }

  const { data, error } = await supabase
    .from('entities')
    .update(safeUpdates)
    .eq('id', characterId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
