import { createClient } from '@/lib/supabase/client';

/**
 * Syncs player HP changes from combat to their entity record.
 * Updates both flat (hp_current) and nested (hp.current) structures for compatibility.
 */
export async function syncPlayerHP(
  entityId: string,
  currentHP: number,
  maxHP?: number
): Promise<boolean> {
  const supabase = createClient();

  try {
    // Get current entity data
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('mechanics')
      .eq('id', entityId)
      .single();

    if (fetchError) {
      console.error('[CombatSync] Failed to fetch entity:', fetchError);
      return false;
    }

    const currentMechanics = (entity?.mechanics || {}) as Record<string, unknown>;

    // Update both flat and nested HP structures for compatibility
    const updatedMechanics = {
      ...currentMechanics,
      // Flat structure (used by useCombat)
      hp_current: currentHP,
      ...(maxHP !== undefined && { hp_max: maxHP }),
      // Nested structure (used by portal)
      hp: {
        ...((currentMechanics.hp as Record<string, unknown>) || {}),
        current: currentHP,
        ...(maxHP !== undefined && { max: maxHP }),
      },
    };

    // Update entity
    const { error: updateError } = await supabase
      .from('entities')
      .update({ mechanics: updatedMechanics })
      .eq('id', entityId);

    if (updateError) {
      console.error('[CombatSync] Failed to update entity HP:', updateError);
      return false;
    }

    console.log(`[CombatSync] Synced HP for entity ${entityId}: ${currentHP}/${maxHP ?? '?'}`);
    return true;
  } catch (error) {
    console.error('[CombatSync] Error syncing player HP:', error);
    return false;
  }
}

/**
 * Syncs multiple player stats to their entity record.
 */
export async function syncPlayerStats(
  entityId: string,
  stats: {
    current_hp?: number;
    max_hp?: number;
    armor_class?: number;
    level?: number;
    temp_hp?: number;
  }
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('mechanics')
      .eq('id', entityId)
      .single();

    if (fetchError) {
      console.error('[CombatSync] Failed to fetch entity:', fetchError);
      return false;
    }

    const currentMechanics = (entity?.mechanics || {}) as Record<string, unknown>;
    const currentHp = (currentMechanics.hp || {}) as Record<string, unknown>;

    // Build updated mechanics
    const updatedMechanics: Record<string, unknown> = { ...currentMechanics };

    // Update flat structure
    if (stats.current_hp !== undefined) {
      updatedMechanics.hp_current = stats.current_hp;
    }
    if (stats.max_hp !== undefined) {
      updatedMechanics.hp_max = stats.max_hp;
    }
    if (stats.armor_class !== undefined) {
      updatedMechanics.ac = stats.armor_class;
    }
    if (stats.level !== undefined) {
      updatedMechanics.level = stats.level;
    }
    if (stats.temp_hp !== undefined) {
      updatedMechanics.temp_hp = stats.temp_hp;
    }

    // Update nested HP structure
    updatedMechanics.hp = {
      ...currentHp,
      ...(stats.current_hp !== undefined && { current: stats.current_hp }),
      ...(stats.max_hp !== undefined && { max: stats.max_hp }),
    };

    const { error: updateError } = await supabase
      .from('entities')
      .update({ mechanics: updatedMechanics })
      .eq('id', entityId);

    if (updateError) {
      console.error('[CombatSync] Failed to update entity stats:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CombatSync] Error syncing player stats:', error);
    return false;
  }
}

/**
 * Batch sync all player HP at end of combat.
 */
export async function syncAllPlayerHP(
  players: Array<{
    entityId?: string;
    hp: number;
    maxHp: number;
    name: string;
  }>
): Promise<void> {
  const syncPromises = players
    .filter((p) => p.entityId)
    .map((player) =>
      syncPlayerHP(player.entityId!, player.hp, player.maxHp)
        .then((success) => {
          if (success) {
            console.log(`[CombatSync] Synced ${player.name}: ${player.hp}/${player.maxHp}`);
          }
        })
        .catch((error) => {
          console.error(`[CombatSync] Failed to sync ${player.name}:`, error);
        })
    );

  await Promise.all(syncPromises);
}
