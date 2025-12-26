import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';
import { fetchEntityContext, formatEntityContextForPrompt, fetchCampaignContext } from '@/lib/forge/context-fetcher';
import { buildQuestSystemPrompt, buildQuestUserPrompt, QuestInput } from '@/lib/forge/prompts/quest-prompts';
import type {
  QuestSubType,
  QuestSoul,
  QuestBrain,
  QuestObjective,
  QuestRewards,
  QuestChain,
  QuestMechanics,
  QuestEncounterSeed,
  QuestNpcSeed,
} from '@/types/living-entity';

interface QuestInputRequest {
  name?: string;
  questType: QuestSubType;
  concept: string;
  questGiverId?: string;
  questGiverName?: string;
  locationId?: string;
  locationName?: string;
  factionId?: string;
  factionName?: string;
  level?: string;
  parentQuestId?: string;
  parentQuestName?: string;
  referencedEntityIds?: string[];
}

interface GeneratedQuest {
  name: string;
  sub_type: QuestSubType;
  soul: QuestSoul;
  brain: QuestBrain;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  chain: QuestChain;
  mechanics: QuestMechanics;
  encounters: QuestEncounterSeed[];
  npcs: QuestNpcSeed[];
  read_aloud: string;
  dm_slug: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, inputs } = body as { campaignId: string; inputs: QuestInputRequest };

    if (!campaignId || !inputs?.concept) {
      return NextResponse.json(
        { error: 'Campaign ID and concept are required' },
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

    // Fetch campaign context (codex)
    const campaignContext = await fetchCampaignContext(campaignId);

    // Build referenced entity list
    const referencedIds: string[] = [...(inputs.referencedEntityIds || [])];
    if (inputs.questGiverId) referencedIds.push(inputs.questGiverId);
    if (inputs.locationId) referencedIds.push(inputs.locationId);
    if (inputs.factionId) referencedIds.push(inputs.factionId);

    // Fetch context for referenced entities
    let entityContext = '';
    if (referencedIds.length > 0) {
      const contextEntities = await fetchEntityContext(referencedIds);
      entityContext = formatEntityContextForPrompt(contextEntities);
    }

    // Fetch parent quest if this is a sequel
    let parentQuest: { name: string; summary?: string } | undefined;
    if (inputs.parentQuestId) {
      const { data: parent } = await supabase
        .from('entities')
        .select('id, name, summary, dm_slug')
        .eq('id', inputs.parentQuestId)
        .single();

      if (parent) {
        parentQuest = {
          name: parent.name,
          summary: parent.summary || parent.dm_slug,
        };
      }
    } else if (inputs.parentQuestName) {
      parentQuest = { name: inputs.parentQuestName };
    }

    // Build prompts
    const systemPrompt = buildQuestSystemPrompt(campaignContext, entityContext, parentQuest);

    const questInput: QuestInput = {
      name: inputs.name,
      questType: inputs.questType || 'side',
      concept: inputs.concept,
      questGiver: inputs.questGiverId
        ? { id: inputs.questGiverId, name: inputs.questGiverName || 'Unknown' }
        : undefined,
      location: inputs.locationId
        ? { id: inputs.locationId, name: inputs.locationName || 'Unknown' }
        : undefined,
      faction: inputs.factionId
        ? { id: inputs.factionId, name: inputs.factionName || 'Unknown' }
        : undefined,
      level: inputs.level,
      parentQuest: parentQuest ? { id: inputs.parentQuestId || '', name: parentQuest.name, summary: parentQuest.summary } : undefined,
      referencedEntityIds: inputs.referencedEntityIds,
    };

    const userPrompt = buildQuestUserPrompt(questInput);

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const generatedQuest: GeneratedQuest = JSON.parse(responseContent);

    // Track generation in database (for analytics)
    const { error: genError } = await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: 'quest',
      input_summary: `Type: ${inputs.questType}${inputs.name ? `, Name: ${inputs.name}` : ''}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: false,
    });

    if (genError) {
      console.error('Failed to track generation:', genError);
    }

    return NextResponse.json({
      quest: generatedQuest,
    });
  } catch (error) {
    console.error('Quest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quest. Please try again.' },
      { status: 500 }
    );
  }
}
