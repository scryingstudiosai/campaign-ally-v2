import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { srdEntity, campaignId, srdType } = await request.json();

    if (!srdEntity || !campaignId || !srdType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient(); // MUST await in App Router

    // Base entity data that applies to all types
    let entityData: Record<string, unknown> = {
      campaign_id: campaignId,
      name: srdEntity.name,
      source_forge: 'srd',
      forge_status: 'complete',
      status: 'active',
      attributes: {
        is_srd: true,
        srd_slug: srdEntity.slug,
        srd_source: srdEntity.source || 'open5e',
      },
    };

    // --- ITEM MAPPING ---
    if (srdType === 'item') {
      // Keep the FULL description with markdown intact (tables, etc.)
      const fullDescription = srdEntity.description || '';

      entityData = {
        ...entityData,
        entity_type: 'item',
        sub_type: srdEntity.item_type || srdEntity.category || 'item',

        // Store the full description WITH markdown
        description: fullDescription,
        summary: `${srdEntity.rarity || 'Common'} ${srdEntity.item_type || 'item'}`,
        dm_slug: srdEntity.slug,

        // Soul - narrative/flavor
        soul: {
          origin: 'D&D 5e SRD',
          appearance: srdEntity.appearance || null,
        },

        // Mechanics - ALL the game stats, conditionally included
        mechanics: {
          item_type: srdEntity.item_type,
          category: srdEntity.category,
          rarity: srdEntity.rarity,
          requires_attunement: srdEntity.requires_attunement || false,
          attunement_requirements: srdEntity.attunement_requirements || null,
          value_gp: srdEntity.value_gp,
          weight: srdEntity.weight,
          // Only include damage for weapons (when present)
          ...(srdEntity.mechanics?.damage && { damage: srdEntity.mechanics.damage }),
          ...(srdEntity.mechanics?.damage_type && { damage_type: srdEntity.mechanics.damage_type }),
          ...(srdEntity.mechanics?.properties && { properties: srdEntity.mechanics.properties }),
          // Only include AC for armor (when present and not null)
          ...(srdEntity.mechanics?.ac != null && { ac: srdEntity.mechanics.ac }),
          ...(srdEntity.mechanics?.ac_bonus != null && { ac_bonus: srdEntity.mechanics.ac_bonus }),
          ...(srdEntity.mechanics?.stealth_disadvantage && { stealth_disadvantage: srdEntity.mechanics.stealth_disadvantage }),
          ...(srdEntity.mechanics?.str_minimum != null && { str_minimum: srdEntity.mechanics.str_minimum }),
          // Other mechanics (charges, effect, recharge)
          ...(srdEntity.mechanics?.charges != null && { charges: srdEntity.mechanics.charges }),
          ...(srdEntity.mechanics?.recharge && { recharge: srdEntity.mechanics.recharge }),
          ...(srdEntity.mechanics?.effect && { effect: srdEntity.mechanics.effect }),
        },
      };
    }

    // --- CREATURE MAPPING ---
    else if (srdType === 'creature') {
      entityData = {
        ...entityData,
        entity_type: 'npc',
        sub_type: 'monster',
        description: srdEntity.description || `A standard ${srdEntity.name}.`,
        dm_slug: srdEntity.slug,
        mechanics: {
          cr: srdEntity.cr,
          hp: srdEntity.hp,
          ac: srdEntity.ac,
          stats: srdEntity.stats,
          actions: srdEntity.actions,
          alignment: srdEntity.alignment,
          creature_type: srdEntity.creature_type,
        },
        soul: {
          biography: srdEntity.description,
          personality: 'Standard monster behavior.',
        },
      };
    }

    // --- SPELL MAPPING ---
    else if (srdType === 'spell') {
      entityData = {
        ...entityData,
        entity_type: 'item',
        sub_type: 'spell',
        description: srdEntity.description,
        public_notes: `${srdEntity.level}-level ${srdEntity.school} spell.`,
        mechanics: {
          level: srdEntity.level,
          school: srdEntity.school,
          casting_time: srdEntity.casting_time,
          range: srdEntity.range,
          components: srdEntity.components,
          duration: srdEntity.duration,
          classes: srdEntity.classes,
        },
      };
    }

    const { data, error } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single();

    if (error) {
      console.error('Failed to save SRD entity:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('SRD Add-to-Memory Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
