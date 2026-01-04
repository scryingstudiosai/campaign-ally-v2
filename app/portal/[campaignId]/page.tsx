import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { CharacterSheet } from '@/components/portal/CharacterSheet';

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default async function CharacterPage({ params }: Props) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get membership with character
  // Note: entity_type is aliased as 'type' for the CharacterSheet component
  const { data: membership, error: membershipError } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      character:entities!character_entity_id (
        id,
        name,
        type:entity_type,
        sub_type,
        description,
        soul,
        mechanics,
        brain,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  // Debug logging for portal redirect issue
  if (membershipError) {
    console.error('Character Page - membership error:', membershipError.message);
  }

  // Get campaign info
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, image_url')
    .eq('id', campaignId)
    .single();

  if (!membership) {
    redirect('/portal');
  }

  // Fetch world anchors (relationships) for the character
  let worldAnchors: Array<{
    id: string;
    relationship_type: string;
    surface_description: string | null;
    target: {
      id: string;
      name: string;
      entity_type: string;
      image_url: string | null;
    } | null;
  }> = [];

  if (membership.character_entity_id) {
    const { data: relationships } = await supabase
      .from('relationships')
      .select(`
        id,
        relationship_type,
        surface_description,
        target:entities!target_id (
          id,
          name,
          entity_type,
          image_url
        )
      `)
      .eq('source_id', membership.character_entity_id)
      .eq('visibility', 'public')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (relationships) {
      worldAnchors = relationships.map(r => ({
        id: r.id,
        relationship_type: r.relationship_type,
        surface_description: r.surface_description,
        target: Array.isArray(r.target) ? r.target[0] : r.target,
      }));
    }
  }

  // Spectator view
  if (membership.role === 'spectator' || !membership.character) {
    return (
      <div className="p-4 text-center">
        <div className="py-12">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-display text-white mb-2">
            {membership.role === 'spectator' ? 'Spectator Mode' : 'No Character'}
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            {membership.role === 'spectator'
              ? "You're watching this campaign as a spectator. Check out the World and Journal tabs to explore!"
              : "You haven't claimed a character in this campaign yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CharacterSheet
      campaignId={campaignId}
      userId={user.id}
      campaign={campaign}
      character={membership.character as {
        id: string;
        name: string;
        type: string;
        sub_type: string | null;
        description: string | null;
        soul: Record<string, unknown> | null;
        mechanics: Record<string, unknown> | null;
        brain: Record<string, unknown> | null;
        image_url: string | null;
      }}
      membershipId={membership.id}
      worldAnchors={worldAnchors}
    />
  );
}
