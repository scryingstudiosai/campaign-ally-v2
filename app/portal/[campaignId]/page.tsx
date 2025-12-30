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
  const { data: membership } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      character:entities!character_entity_id (
        id,
        name,
        type,
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

  // Get campaign info
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, image_url')
    .eq('id', campaignId)
    .single();

  if (!membership) {
    redirect('/portal');
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
    />
  );
}
