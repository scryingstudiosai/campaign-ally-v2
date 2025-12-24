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
      const cleanDescription = srdEntity.description
        ?.replace(/\|/g, ' ')
        ?.replace(/\s+/g, ' ')
        ?.trim() || '';

      entityData = {
        ...entityData,
        entity_type: 'item',
        sub_type: srdEntity.item_type || 'wondrous item',
        description: cleanDescription,
        public_notes: `A ${srdEntity.rarity || 'common'} ${srdEntity.item_type || 'item'}.`,
        dm_slug: srdEntity.slug,
        soul: {
          origin: `Standard ${srdEntity.item_type || 'item'} from the D&D 5e SRD`,
          rarity: srdEntity.rarity,
          description: cleanDescription,
        },
        mechanics: {
          item_type: srdEntity.item_type,
          rarity: srdEntity.rarity,
          requires_attunement: srdEntity.requires_attunement,
          attunement_requirements: srdEntity.attunement_requirements,
          value_gp: srdEntity.value_gp,
          weight: srdEntity.weight,
          ...(srdEntity.mechanics || {}),
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
