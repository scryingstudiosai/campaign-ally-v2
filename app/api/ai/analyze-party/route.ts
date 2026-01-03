import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CharacterEntity {
  name: string;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
}

interface CampaignMember {
  entities: CharacterEntity | null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaignId } = await req.json();

    // Verify user owns the campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all player characters
    const { data: members } = await supabase
      .from('campaign_members')
      .select(`
        entities:character_entity_id (
          name,
          soul,
          mechanics
        )
      `)
      .eq('campaign_id', campaignId)
      .not('character_entity_id', 'is', null);

    const characters = (members as CampaignMember[] | null)?.map(m => m.entities).filter(Boolean) || [];

    if (characters.length === 0) {
      return NextResponse.json({ error: 'No characters to analyze' }, { status: 400 });
    }

    // Build character summary for AI
    const charSummary = characters.map(char => {
      if (!char) return '';
      const soul = (char.soul || {}) as Record<string, unknown>;
      const mechanics = (char.mechanics || {}) as Record<string, unknown>;
      const abilities = (mechanics.abilities || soul.abilities || {}) as Record<string, number>;
      const hitPoints = mechanics.hit_points as { maximum?: number } | null;
      const savingThrows = mechanics.saving_throws as string[] | null;
      const skills = mechanics.skills as Record<string, unknown> | null;

      return `
${char.name}:
- Class: ${soul.class || 'Unknown'}
- Level: ${soul.level || mechanics.level || '?'}
- AC: ${mechanics.armor_class || soul.ac || '?'}
- HP: ${hitPoints?.maximum || soul.hp || '?'}
- Abilities: STR ${abilities.strength || abilities.str || '?'}, DEX ${abilities.dexterity || abilities.dex || '?'}, CON ${abilities.constitution || abilities.con || '?'}, INT ${abilities.intelligence || abilities.int || '?'}, WIS ${abilities.wisdom || abilities.wis || '?'}, CHA ${abilities.charisma || abilities.cha || '?'}
- Saving Throw Proficiencies: ${savingThrows?.join(', ') || 'Unknown'}
- Skills: ${skills ? Object.keys(skills).join(', ') : 'Unknown'}
- Spellcaster: ${mechanics.spellcasting ? 'Yes' : 'No'}
`;
    }).join('\n');

    const prompt = `Analyze this D&D 5e party and provide tactical insights.

PARTY COMPOSITION:
${charSummary}

Provide your analysis in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "tags": ["Party Archetype Tag 1", "Tag 2"]
}

GUIDELINES:
- Strengths: What this party excels at (e.g., "High Burst Damage", "Strong Healing", "Excellent Crowd Control")
- Weaknesses: Tactical vulnerabilities (e.g., "Low Wisdom Saves", "No Ranged Options", "No Flight/Climbing", "Weak to Magic")
- Tags: 1-3 word archetypes (e.g., "Glass Cannon", "Tank Heavy", "Social Party", "Stealth Squad")

Be specific and actionable. A DM should read this and know what monsters/situations to challenge or avoid.

Return ONLY the JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    let analysis;

    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 });
    }

    // Save to campaign
    const profile = {
      ...analysis,
      analyzed_at: new Date().toISOString(),
    };

    await supabase
      .from('campaigns')
      .update({ party_tactical_profile: profile })
      .eq('id', campaignId);

    return NextResponse.json({ profile });

  } catch (error: unknown) {
    console.error('Analyze party error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
