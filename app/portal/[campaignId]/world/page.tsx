import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorldView } from '@/components/portal/WorldView';

interface Props {
  params: Promise<{ campaignId: string }>;
}

interface RelationshipTarget {
  id: string;
  name: string;
  entity_type: string;
  sub_type: string | null;
  description: string | null;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
  image_url: string | null;
}

interface Relationship {
  id: string;
  relationship_type: string;
  surface_description: string | null;
  created_at: string;
  target: RelationshipTarget | RelationshipTarget[] | null;
}

interface Discovery {
  id: string;
  discovered_at: string;
  personal_notes: string | null;
  is_favorite: boolean;
  entity: {
    id: string;
    name: string;
    type: string;
    sub_type: string | null;
    description: string | null;
    soul: Record<string, unknown> | null;
    mechanics: Record<string, unknown> | null;
    image_url: string | null;
  };
}

export default async function WorldPage({ params }: Props) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get membership and character
  const { data: membership } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  // Initialize discoveries array
  let allDiscoveries: Discovery[] = [];

  // 1. Fetch World Anchors from relationships table (primary source)
  if (membership?.character_entity_id) {
    const { data: relationships } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        surface_description,
        created_at,
        target:entities!target_id (
          id,
          name,
          entity_type,
          sub_type,
          description,
          soul,
          mechanics,
          image_url
        )
      `)
      .eq('source_id', membership.character_entity_id)
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (relationships) {
      // Convert relationships to discovery format
      const relationshipDiscoveries = relationships
        .filter((r: Relationship) => r.target)
        .map((r: Relationship) => {
          // Handle array vs single object from Supabase join
          const targetEntity = Array.isArray(r.target) ? r.target[0] : r.target;
          if (!targetEntity) return null;

          return {
            id: `rel-${r.id}`,
            discovered_at: r.created_at,
            personal_notes: r.surface_description,
            is_favorite: false,
            entity: {
              id: targetEntity.id,
              name: targetEntity.name,
              type: targetEntity.entity_type,
              sub_type: targetEntity.sub_type || formatRelationshipType(r.relationship_type),
              description: targetEntity.description,
              soul: targetEntity.soul,
              mechanics: targetEntity.mechanics,
              image_url: targetEntity.image_url,
            },
          } as Discovery;
        })
        .filter((d): d is Discovery => d !== null);

      allDiscoveries = [...allDiscoveries, ...relationshipDiscoveries];
    }
  }

  // 2. Also fetch from player_discoveries table (for DM-revealed discoveries)
  const { data: discoveries } = await supabase
    .from('player_discoveries')
    .select(`
      id,
      discovered_at,
      personal_notes,
      is_favorite,
      entity:entities!entity_id (
        id,
        name,
        type:entity_type,
        sub_type,
        description,
        soul,
        mechanics,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('discovered_at', { ascending: false });

  if (discoveries) {
    // Convert and add, avoiding duplicates
    const existingEntityIds = new Set(allDiscoveries.map(d => d.entity.id));

    interface PlayerDiscoveryEntity {
      id: string;
      name: string;
      type: string;
      sub_type: string | null;
      description: string | null;
      soul: Record<string, unknown> | null;
      mechanics: Record<string, unknown> | null;
      image_url: string | null;
    }

    interface PlayerDiscovery {
      id: string;
      discovered_at: string;
      personal_notes: string | null;
      is_favorite: boolean;
      entity: PlayerDiscoveryEntity | PlayerDiscoveryEntity[] | null;
    }

    const playerDiscoveries = discoveries
      .filter((d: PlayerDiscovery) => d.entity)
      .map((d: PlayerDiscovery) => {
        const entity = Array.isArray(d.entity) ? d.entity[0] : d.entity;
        if (!entity) return null;

        return {
          id: d.id,
          discovered_at: d.discovered_at,
          personal_notes: d.personal_notes,
          is_favorite: d.is_favorite,
          entity: {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            sub_type: entity.sub_type,
            description: entity.description,
            soul: entity.soul,
            mechanics: entity.mechanics,
            image_url: entity.image_url,
          },
        } as Discovery;
      })
      .filter((d): d is Discovery => d !== null)
      .filter(d => !existingEntityIds.has(d.entity.id));

    allDiscoveries = [...allDiscoveries, ...playerDiscoveries];
  }

  // Sort: favorites first, then by date
  allDiscoveries.sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
  });

  return (
    <WorldView
      campaignId={campaignId}
      userId={user.id}
      initialDiscoveries={allDiscoveries}
    />
  );
}

function formatRelationshipType(type: string): string {
  const typeLabels: Record<string, string> = {
    'lives_in': 'Home',
    'member_of': 'Member',
    'knows': 'Acquaintance',
    'friend_of': 'Friend',
    'enemy_of': 'Enemy',
    'works_at': 'Works here',
    'born_in': 'Birthplace',
  };
  return typeLabels[type] || type.replace(/_/g, ' ');
}
