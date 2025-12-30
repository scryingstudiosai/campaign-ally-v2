import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorldView } from '@/components/portal/WorldView';

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default async function WorldPage({ params }: Props) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all discoveries for this player
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
        type,
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

  return (
    <WorldView
      campaignId={campaignId}
      userId={user.id}
      initialDiscoveries={discoveries || []}
    />
  );
}
