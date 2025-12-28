import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { creatureIndex: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creatureIndex = params.creatureIndex;

    const response = await fetch(
      `https://www.dnd5eapi.co/api/monsters/${creatureIndex}`
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
    }

    const monster = await response.json();

    // Return the full monster data - don't filter anything out
    return NextResponse.json(monster);
  } catch (error: any) {
    console.error('SRD creature detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
