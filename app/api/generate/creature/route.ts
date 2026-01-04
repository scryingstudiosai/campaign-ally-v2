import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';
import {
  fetchEntityContext,
  formatEntityContextForPrompt,
  fetchCampaignContext,
} from '@/lib/forge/context-fetcher';
import {
  buildCreatureSystemPrompt,
  buildCreatureUserPrompt,
  type CreatureInput,
} from '@/lib/forge/prompts/creature-prompts';
import type { SrdCreature } from '@/types/srd';
import type {
  CreatureBrain,
  CreatureSoul,
  CreatureMechanics,
  CreatureTreasure,
} from '@/types/living-entity';

export interface GeneratedCreature {
  name: string;
  sub_type: string;

  soul: CreatureSoul;
  brain: CreatureBrain;
  mechanics: CreatureMechanics;
  treasure: CreatureTreasure;

  facts: Array<{
    content: string;
    category: string;
    visibility: string;
  }>;

  read_aloud: string;
  dm_slug: string;
  tags: string[];

  // Reference to SRD base if variant
  srd_base?: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, inputs } = body as { campaignId: string; inputs: CreatureInput };

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch campaign context (codex) for world consistency
    const campaignContext = await fetchCampaignContext(campaignId);

    // Fetch context for referenced entities
    let entityContext = '';
    if (inputs.referencedEntityIds && inputs.referencedEntityIds.length > 0) {
      const contextEntities = await fetchEntityContext(inputs.referencedEntityIds);
      entityContext = formatEntityContextForPrompt(contextEntities);
    }

    // KEY: Fetch full SRD creature data if base is selected
    let srdContext: SrdCreature | null = null;
    if (inputs.basedOnSrdSlug) {
      const { data: srdCreature } = await supabase
        .from('srd_creatures')
        .select('*')
        .eq('slug', inputs.basedOnSrdSlug)
        .single();

      if (srdCreature) {
        srdContext = srdCreature as SrdCreature;
      }
    }

    // Build codex data for prompt
    const codexData = campaignContext
      ? {
          setting: campaignContext,
          tone: undefined,
          themes: undefined,
        }
      : null;

    // Build prompts WITH SRD data injection
    const systemPrompt = buildCreatureSystemPrompt(codexData, srdContext, entityContext);
    const userPrompt = buildCreatureUserPrompt(inputs);

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const creatureData: GeneratedCreature = JSON.parse(responseContent);

    // Add SRD reference if based on one
    if (srdContext) {
      creatureData.srd_base = {
        id: srdContext.id,
        name: srdContext.name,
        slug: srdContext.slug,
      };
    }

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'creature',
      input_summary: `${inputs.name || creatureData.name} (CR ${inputs.challengeRating || creatureData.mechanics?.cr || '?'})`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    });

    if (genError) {
      console.error('Failed to track generation:', genError);
    }

    return NextResponse.json({
      creature: creatureData,
    });
  } catch (error) {
    console.error('Creature generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate creature. Please try again.' },
      { status: 500 }
    );
  }
}
