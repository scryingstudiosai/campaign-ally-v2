import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PortalNav } from '@/components/portal/PortalNav';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  console.log('Portal Layout - campaignId:', campaignId);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Portal Layout - user:', user?.id || 'NO USER');

  if (!user) {
    console.log('Portal Layout - No user, redirecting to login');
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

  console.log('Portal Layout - membership:', membership);
  console.log('Portal Layout - membershipError:', membershipError);

  if (membershipError || !membership) {
    console.log('Portal Layout - No membership, redirecting to home');
    // Not a member - redirect to join or home
    redirect('/');
  }

  // Handle Supabase joined table types
  const campaignData = membership.campaigns as unknown;
  const campaign = (Array.isArray(campaignData) ? campaignData[0] : campaignData) as { id: string; name: string };

  const characterData = membership.entities as unknown;
  const character = characterData
    ? (Array.isArray(characterData) ? characterData[0] : characterData) as { id: string; name: string; image_url: string | null }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Character avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
              {character?.image_url ? (
                <img
                  src={character.image_url}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-lg font-display">
                  {character?.name?.[0] || '?'}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-white font-display truncate">
                {character?.name || 'Spectator'}
              </h1>
              <p className="text-xs text-slate-500 truncate">{campaign.name}</p>
            </div>
          </div>

          {/* Role badge */}
          {membership.role === 'spectator' && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              Spectator
            </span>
          )}
        </div>
      </header>

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
