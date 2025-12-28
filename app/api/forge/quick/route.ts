import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPTS: Record<string, string> = {
  npc: `You are a D&D 5e NPC generator. Create a detailed NPC.
Return valid JSON only:
{
  "name": "NPC Name",
  "summary": "One sentence description",
  "sub_type": "Role/occupation",
  "soul": {
    "read_aloud": "2-3 sentences when players meet them",
    "personality": "Traits",
    "appearance": "Physical description",
    "voice": "How they speak"
  },
  "brain": {
    "motivation": "What they want",
    "secrets": "Hidden info",
    "tactics": "Conflict behavior"
  },
  "mechanics": {
    "hp": 10,
    "ac": 10,
    "cr": "0",
    "abilities": { "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10 }
  }
}`,

  creature: `You are a D&D 5e creature generator. Create a monster/creature.
Return valid JSON only:
{
  "name": "Creature Name",
  "summary": "One sentence description",
  "sub_type": "beast/monstrosity/undead/etc",
  "soul": {
    "read_aloud": "Description when encountered",
    "appearance": "Physical details",
    "behavior": "How it acts"
  },
  "brain": {
    "motivation": "What drives it",
    "tactics": "Combat behavior",
    "lair": "Where it lives"
  },
  "mechanics": {
    "hp": 15,
    "ac": 12,
    "cr": "1",
    "size": "medium",
    "type": "beast",
    "speed": { "walk": 30 },
    "abilities": { "str": 12, "dex": 14, "con": 12, "int": 4, "wis": 10, "cha": 6 },
    "actions": [
      {
        "name": "Bite",
        "desc": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.",
        "attack_bonus": 4
      }
    ]
  }
}`,

  location: `You are a D&D 5e location generator.
Return valid JSON only:
{
  "name": "Location Name",
  "summary": "One sentence description",
  "sub_type": "tavern/dungeon/forest/etc",
  "soul": {
    "read_aloud": "2-3 evocative sentences",
    "sights": ["Visual 1", "Visual 2"],
    "sounds": ["Sound 1"],
    "smells": ["Smell 1"]
  },
  "brain": {
    "purpose": "What it's used for",
    "secrets": "Hidden info",
    "history": "Brief background"
  },
  "mechanics": {
    "hazards": [],
    "treasure": []
  }
}`,

  item: `You are a D&D 5e magic item generator.
Return valid JSON only:
{
  "name": "Item Name",
  "summary": "One sentence description",
  "sub_type": "weapon/armor/wondrous/etc",
  "soul": {
    "read_aloud": "Description when examined",
    "appearance": "Physical details",
    "history": "How it was created"
  },
  "brain": {
    "purpose": "What it does",
    "secrets": "Hidden properties"
  },
  "mechanics": {
    "rarity": "uncommon",
    "attunement": false,
    "type": "weapon",
    "properties": "Game mechanics"
  }
}`,

  encounter: `You are a D&D 5e encounter designer.
CRITICAL: Each creature MUST have a "count" field.
Return valid JSON only:
{
  "name": "Encounter Name",
  "summary": "Brief scenario description",
  "sub_type": "encounter",
  "soul": {
    "read_aloud": "Combat start description",
    "setup": "Tactical setup",
    "terrain": "Environmental features"
  },
  "brain": {
    "tactics": "How enemies fight",
    "morale": "When they flee",
    "complications": "What could go wrong"
  },
  "mechanics": {
    "difficulty": "medium",
    "xp": 200,
    "creatures": [
      { "name": "Goblin", "count": 3, "hp": 7, "ac": 15 }
    ],
    "rewards": {
      "gold": 25,
      "items": ["Item 1"]
    }
  }
}`,
};

export async function POST(request: NextRequest) {
  console.log('=== Quick Forge API Called ===');

  try {
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { campaignId, entityType, prompt } = body;

    console.log('Request:', { campaignId, entityType, prompt: prompt?.substring(0, 50) });

    if (!campaignId || !entityType || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, entityType, prompt' },
        { status: 400 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[entityType];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown entity type: ${entityType}` },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    console.log('Generating for campaign:', campaign.name);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Campaign: ${campaign.name}\n\nCreate: ${prompt}` },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    console.log('OpenAI response received');

    if (!content) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    let generated;
    try {
      generated = JSON.parse(content);
      console.log('Generated:', generated.name);
    } catch {
      console.error('JSON parse error:', content);
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });
    }

    // Insert into database with correct entity schema
    const { data: entity, error: insertError } = await supabase
      .from('entities')
      .insert({
        campaign_id: campaignId,
        entity_type: entityType,
        name: generated.name,
        sub_type: generated.sub_type || entityType,
        summary: generated.summary,
        soul: generated.soul,
        brain: generated.brain,
        mechanics: generated.mechanics,
        status: 'active',
        forge_status: 'complete',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('Created entity:', entity.id);

    // Track generation (optional - don't fail if this errors)
    try {
      await supabase.from('generations').insert({
        user_id: user.id,
        campaign_id: campaignId,
        forge_type: entityType,
        input_summary: `Quick Forge: ${prompt.substring(0, 100)}`,
        tokens_used: completion.usage?.total_tokens || 0,
        was_saved: true,
      });
    } catch (genError) {
      console.error('Failed to track generation:', genError);
    }

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      entity_type: entity.entity_type,
      sub_type: entity.sub_type,
    });
  } catch (error) {
    console.error('Quick Forge Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate' },
      { status: 500 }
    );
  }
}
