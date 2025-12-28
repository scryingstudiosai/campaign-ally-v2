import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache the creatures list in memory
let cachedCreatures: any[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    // Return cached data if available and fresh
    if (cachedCreatures && Date.now() - cacheTime < CACHE_DURATION) {
      const filtered = query
        ? cachedCreatures.filter(c => c.name.toLowerCase().includes(query))
        : cachedCreatures;
      return NextResponse.json(filtered.slice(0, 50));
    }

    // Fetch from D&D 5e API
    const response = await fetch('https://www.dnd5eapi.co/api/monsters');
    if (!response.ok) throw new Error('Failed to fetch from SRD API');

    const data = await response.json();

    // Fetch basic stats for all monsters in parallel (batched)
    const batchSize = 20;
    const allMonsters: any[] = [];

    for (let i = 0; i < data.results.length; i += batchSize) {
      const batch = data.results.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (monster: any) => {
          try {
            const detailRes = await fetch(`https://www.dnd5eapi.co${monster.url}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              return {
                index: detail.index,
                name: detail.name,
                challenge_rating: detail.challenge_rating,
                type: detail.type,
                size: detail.size,
                hit_points: detail.hit_points,
                armor_class: detail.armor_class?.[0]?.value || 10,
              };
            }
          } catch {
            return null;
          }
          return null;
        })
      );
      allMonsters.push(...batchResults.filter(Boolean));
    }

    cachedCreatures = allMonsters;
    cacheTime = Date.now();

    const filtered = query
      ? allMonsters.filter(c => c.name.toLowerCase().includes(query))
      : allMonsters;

    return NextResponse.json(filtered.slice(0, 50));
  } catch (error: any) {
    console.error('SRD creatures error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
