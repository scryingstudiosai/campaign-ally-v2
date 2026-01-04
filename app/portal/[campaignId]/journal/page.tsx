import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JournalView } from '@/components/portal/JournalView';

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default async function JournalPage({ params }: Props) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch journal entries
  const { data: entries } = await supabase
    .from('player_journal_entries')
    .select(`
      *,
      session:sessions (
        id,
        name,
        session_number,
        session_date
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // Fetch tracked quests
  const { data: trackedQuests } = await supabase
    .from('player_quest_tracking')
    .select(`
      *,
      quest:entities!quest_id (
        id,
        name,
        sub_type,
        description,
        soul,
        mechanics,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Fetch available sessions for linking
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, session_number, session_date')
    .eq('campaign_id', campaignId)
    .order('session_number', { ascending: false });

  return (
    <JournalView
      campaignId={campaignId}
      userId={user.id}
      initialEntries={entries || []}
      initialQuests={trackedQuests || []}
      sessions={sessions || []}
    />
  );
}
