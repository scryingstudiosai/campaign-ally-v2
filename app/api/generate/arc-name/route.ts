import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai';

interface ArcNameRequest {
  concept: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ArcNameRequest = await request.json();
    const { concept } = body;

    if (!concept) {
      return NextResponse.json({ error: 'Concept is required' }, { status: 400 });
    }

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap for this simple task
      messages: [
        {
          role: 'system',
          content: `You are a fantasy story arc naming expert. Generate a compelling saga/arc name based on the quest concept provided.

Rules:
- Use epic, memorable naming patterns like: "The [Noun] of [Noun]", "The [Adjective] [Noun]", "[Noun]'s [Noun]"
- Keep it 2-5 words
- Make it evocative and hint at the larger story
- Avoid generic names like "The Adventure" or "The Quest"

Examples:
- "The Dragon's Conspiracy"
- "Shadows Over Thornhaven"
- "The Shattered Crown"
- "Blood of the Ancients"
- "The Whispered Prophecy"

Return ONLY the arc name, nothing else. No quotes, no punctuation at the end.`,
        },
        {
          role: 'user',
          content: `Quest concept: ${concept}`,
        },
      ],
      max_tokens: 50,
      temperature: 0.9, // Creative variance
    });

    const arcName = completion.choices[0]?.message?.content?.trim() || 'The Untold Saga';

    return NextResponse.json({ arcName });
  } catch (error) {
    console.error('[Arc Name API] Error:', error);
    return NextResponse.json({ arcName: 'The Untold Saga' });
  }
}
