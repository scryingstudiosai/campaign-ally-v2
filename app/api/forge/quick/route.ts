import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';

interface QuickForgeRequest {
  campaignId: string;
  entityType: 'npc' | 'creature' | 'location' | 'item' | 'encounter';
  prompt: string;
}

const TYPE_PROMPTS: Record<string, string> = {
  npc: `You are a D&D 5e NPC generator. Create a memorable NPC based on the user's prompt.
Return JSON with:
{
  "name": "Full name",
  "sub_type": "Role/occupation",
  "summary": "2-3 sentence description for quick reference",
  "appearance": "Physical description",
  "personality": "Key personality traits",
  "motivation": "What drives them",
  "secret": "A hidden truth",
  "voice": "Speech patterns and mannerisms",
  "mechanics": {
    "ac": 10,
    "hp": 10,
    "abilities": { "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10 }
  },
  "tags": ["tag1", "tag2"]
}`,

  creature: `You are a D&D 5e creature generator. Create a unique creature based on the user's prompt.
Return JSON with:
{
  "name": "Creature name",
  "sub_type": "Creature type (e.g., beast, monstrosity, undead)",
  "summary": "2-3 sentence description for quick reference",
  "description": "Full description and behavior",
  "tactics": "How it fights",
  "lair": "Where it lives",
  "mechanics": {
    "cr": "1",
    "ac": 12,
    "hp": 22,
    "speed": { "walk": 30 },
    "abilities": { "str": 14, "dex": 12, "con": 13, "int": 3, "wis": 12, "cha": 6 },
    "attacks": [{ "name": "Bite", "bonus": 4, "damage": "1d8+2 piercing" }]
  },
  "tags": ["tag1", "tag2"]
}`,

  location: `You are a D&D 5e location generator. Create an interesting location based on the user's prompt.
Return JSON with:
{
  "name": "Location name",
  "sub_type": "Location type (e.g., tavern, dungeon, forest)",
  "summary": "2-3 sentence description for quick reference",
  "description": "Full description - sights, sounds, smells",
  "features": ["Notable feature 1", "Notable feature 2"],
  "npcs": ["NPC that might be here"],
  "secrets": ["Hidden thing about this place"],
  "hooks": ["Adventure hook related to this location"],
  "tags": ["tag1", "tag2"]
}`,

  item: `You are a D&D 5e magic item generator. Create an interesting item based on the user's prompt.
Return JSON with:
{
  "name": "Item name",
  "sub_type": "Item type (e.g., weapon, armor, wondrous item)",
  "summary": "2-3 sentence description for quick reference",
  "description": "Full description and appearance",
  "rarity": "common|uncommon|rare|very rare|legendary",
  "requires_attunement": false,
  "mechanics": {
    "properties": "Mechanical properties and effects",
    "charges": null,
    "value_gp": 100
  },
  "history": "Brief history or origin",
  "quirk": "An interesting quirk or side effect",
  "tags": ["tag1", "tag2"]
}`,

  encounter: `You are a D&D 5e encounter generator. Create a combat encounter based on the user's prompt.
Return JSON with:
{
  "name": "Encounter name/title",
  "sub_type": "encounter",
  "summary": "2-3 sentence description for quick reference",
  "description": "Setup and context for the encounter",
  "difficulty": "easy|medium|hard|deadly",
  "enemies": [
    { "name": "Enemy name", "count": 2, "cr": "1/2", "notes": "Tactical notes" }
  ],
  "terrain": "Battlefield description and features",
  "tactics": "How enemies behave in combat",
  "treasure": ["Loot from this encounter"],
  "complications": ["Possible twists or complications"],
  "tags": ["tag1", "tag2"]
}`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, entityType, prompt } = body as QuickForgeRequest;

    if (!campaignId || !entityType || !prompt) {
      return NextResponse.json(
        { error: 'Campaign ID, entity type, and prompt are required' },
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

    const systemPrompt = TYPE_PROMPTS[entityType];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      );
    }

    // Call OpenAI
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${entityType} based on this description: ${prompt}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const generatedData = JSON.parse(responseContent);

    // Save to database
    const entityData = {
      campaign_id: campaignId,
      user_id: user.id,
      entity_type: entityType,
      name: generatedData.name,
      sub_type: generatedData.sub_type || entityType,
      summary: generatedData.summary,
      description: generatedData.description || generatedData.appearance || '',
      mechanics: generatedData.mechanics || null,
      tags: generatedData.tags || [],
      facts: [],
      metadata: {
        generated_at: new Date().toISOString(),
        prompt: prompt,
        ...generatedData,
      },
    };

    const { data: entity, error: insertError } = await supabase
      .from('entities')
      .insert(entityData)
      .select('id, name, summary, entity_type, sub_type')
      .single();

    if (insertError) {
      console.error('Failed to save entity:', insertError);
      throw new Error('Failed to save generated entity');
    }

    // Track generation
    await supabase.from('generations').insert({
      user_id: user.id,
      campaign_id: campaignId,
      forge_type: entityType,
      input_summary: `Quick Forge: ${prompt.substring(0, 100)}`,
      tokens_used: completion.usage?.total_tokens || 0,
      was_saved: true,
    });

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      entity_type: entity.entity_type,
      sub_type: entity.sub_type,
    });
  } catch (error) {
    console.error('Quick forge error:', error);
    return NextResponse.json(
      { error: 'Failed to forge entity. Please try again.' },
      { status: 500 }
    );
  }
}
