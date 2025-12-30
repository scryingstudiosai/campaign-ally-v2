import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChatView } from '@/components/portal/ChatView';

interface MessagesPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get membership with character
  const { data: membership } = await supabase
    .from('campaign_members')
    .select(`
      id, role, character_entity_id,
      character:entities!character_entity_id (name)
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/dashboard');

  // Get campaign for DM ID
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('user_id')
    .eq('id', campaignId)
    .single();

  const isDM = campaign?.user_id === user.id;
  const character = membership.character as { name: string } | null;
  const senderName = isDM ? 'Dungeon Master' : (character?.name || 'Adventurer');

  return (
    <ChatView
      campaignId={campaignId}
      userId={user.id}
      senderName={senderName}
      dmUserId={campaign?.user_id}
    />
  );
}
