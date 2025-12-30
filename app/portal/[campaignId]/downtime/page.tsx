import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DowntimeView } from '@/components/portal/DowntimeView';

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default async function DowntimePage({ params }: Props) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get membership with character
  const { data: membership } = await supabase
    .from('campaign_members')
    .select(`
      id,
      character_entity_id,
      character:entities!character_entity_id (
        id,
        name,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  // Get campaign state
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, current_state, downtime_days_available')
    .eq('id', campaignId)
    .single();

  // Get downtime logs
  const { data: logs } = await supabase
    .from('downtime_logs')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!membership) {
    redirect('/portal');
  }

  const character = membership.character as { id: string; name: string; image_url: string | null } | null;

  return (
    <DowntimeView
      campaignId={campaignId}
      userId={user.id}
      campaign={campaign}
      character={character}
      initialLogs={logs || []}
    />
  );
}
