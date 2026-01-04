import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export interface AtlasMap {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  source_type: 'ai_generated' | 'uploaded' | 'external_url';
  map_type: 'world' | 'region' | 'city' | 'dungeon' | 'building' | 'encounter' | 'other';
  style: string | null;
  linked_entity_id: string | null;
  poi_data: POIData[];
  metadata: Record<string, unknown>;
  is_primary: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  linked_entity?: {
    id: string;
    name: string;
    entity_type: string;
  } | null;
}

export interface POIData {
  id: string;
  x_percent: number;
  y_percent: number;
  label: string;
  description?: string;
  linked_entity_id?: string;
  color?: string;
  icon?: string;
}

// GET - Fetch all maps for a campaign
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Get optional filters from query params
  const { searchParams } = new URL(req.url);
  const mapType = searchParams.get('type');
  const linkedEntityId = searchParams.get('entity');

  // Fetch maps
  let query = supabase
    .from('atlas_maps')
    .select(`
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type
      )
    `)
    .eq('campaign_id', campaignId);

  if (mapType) {
    query = query.eq('map_type', mapType);
  }

  if (linkedEntityId) {
    query = query.eq('linked_entity_id', linkedEntityId);
  }

  const { data: maps, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(maps);
}

// POST - Create new map
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: campaignId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found or not authorized' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    description,
    imageUrl,
    thumbnailUrl,
    sourceType,
    mapType,
    style,
    linkedEntityId,
    poiData,
    metadata,
    isPrimary,
    isPublic,
  } = body;

  if (!name || !sourceType || !mapType) {
    return NextResponse.json(
      { error: 'Missing required fields: name, sourceType, mapType' },
      { status: 400 }
    );
  }

  // If setting as primary, unset other primary maps for the same entity
  if (isPrimary && linkedEntityId) {
    await supabase
      .from('atlas_maps')
      .update({ is_primary: false })
      .eq('campaign_id', campaignId)
      .eq('linked_entity_id', linkedEntityId)
      .eq('is_primary', true);
  }

  const { data: map, error } = await supabase
    .from('atlas_maps')
    .insert({
      campaign_id: campaignId,
      name,
      description: description || null,
      image_url: imageUrl || null,
      thumbnail_url: thumbnailUrl || null,
      source_type: sourceType,
      map_type: mapType,
      style: style || null,
      linked_entity_id: linkedEntityId || null,
      poi_data: poiData || [],
      metadata: metadata || {},
      is_primary: isPrimary || false,
      is_public: isPublic || false,
    })
    .select(`
      *,
      linked_entity:entities!linked_entity_id(
        id,
        name,
        entity_type
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(map, { status: 201 });
}
