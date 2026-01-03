import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalNav } from '@/components/portal/PortalNav';
import { PortalHeader } from '@/components/portal/PortalHeader';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get campaign membership
  const { data: membership, error: membershipError } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      campaigns (
        id,
        name
      ),
      entities:character_entity_id (
        id,
        name,
        image_url
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    // Not a member - redirect to join or home
    redirect('/');
  }

  // Check if user has their own campaigns (is a DM)
  const { data: dmCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .limit(1);

  const hasDMCampaigns = (dmCampaigns?.length || 0) > 0;

  // Handle Supabase joined table types
  const campaignData = membership.campaigns as unknown;
  const campaign = (Array.isArray(campaignData) ? campaignData[0] : campaignData) as { id: string; name: string };

  const characterData = membership.entities as unknown;
  const character = characterData
    ? (Array.isArray(characterData) ? characterData[0] : characterData) as { id: string; name: string; image_url: string | null }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-16">
      {/* Top bar with user menu */}
      <PortalHeader
        campaign={campaign}
        character={character}
        user={{ id: user.id, email: user.email }}
        isSpectator={membership.role === 'spectator'}
        hasDMCampaigns={hasDMCampaigns}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <PortalNav
        campaignId={campaignId}
        userId={user.id}
        isSpectator={membership.role === 'spectator'}
      />
    </div>
  );
}
