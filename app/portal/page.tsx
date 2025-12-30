import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sword, Shield, Users, MessageSquare } from 'lucide-react';

export default async function PlayerPortalDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get all campaigns user has joined as a member
  const { data: memberships } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      campaign:campaigns!campaign_id (
        id,
        name,
        description,
        image_url,
        user_id
      ),
      character:entities!character_entity_id (
        id,
        name,
        sub_type,
        image_url
      )
    `)
    .eq('user_id', user.id);

  // Filter to campaigns where user is NOT the DM (player only view)
  const playerMemberships = memberships?.filter(m =>
    m.campaign && (m.campaign as { user_id: string }).user_id !== user.id
  ) || [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-teal-400" />
            <h1 className="text-xl font-display text-white">Player Portal</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            DM Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Empty State */}
        {playerMemberships.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-display text-white mb-2">No Campaigns Yet</h2>
            <p className="text-slate-400 mb-6">
              Ask your DM for a join link to enter a campaign.
            </p>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-slate-500">
                Join links look like:<br />
                <code className="text-teal-400">campaign-ally.com/join/GAME-1234</code>
              </p>
            </div>
          </div>
        )}

        {/* Campaign List */}
        {playerMemberships.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display text-white mb-4">Your Adventures</h2>

            {playerMemberships.map((membership) => {
              const campaign = membership.campaign as { id: string; name: string; description: string | null; image_url: string | null } | null;
              const character = membership.character as { id: string; name: string; sub_type: string | null; image_url: string | null } | null;
              if (!campaign) return null;

              return (
                <Link
                  key={membership.id}
                  href={`/portal/${campaign.id}`}
                  className="block p-4 rounded-xl bg-slate-900/50 border border-white/10 hover:bg-slate-800/50 hover:border-teal-500/30 transition-all group"
                >
                  <div className="flex gap-4">
                    {/* Character/Campaign Image */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                      {character?.image_url ? (
                        <img
                          src={character.image_url}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sword className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Campaign Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-white text-lg group-hover:text-teal-400 transition-colors">
                        {campaign.name}
                      </h3>

                      {character ? (
                        <p className="text-teal-400 text-sm">
                          Playing as {character.name}
                          {character.sub_type && ` • ${character.sub_type}`}
                        </p>
                      ) : (
                        <p className="text-amber-400 text-sm">
                          No character claimed yet
                        </p>
                      )}

                      {campaign.description && (
                        <p className="text-slate-500 text-sm mt-1 truncate">
                          {campaign.description}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center text-slate-500 group-hover:text-teal-400 transition-colors">
                      →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Join Code Hint */}
        <div className="mt-8 p-4 rounded-xl border border-dashed border-white/10 text-center">
          <p className="text-slate-500 text-sm">
            Have a join code? Go to{' '}
            <code className="text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded">/join/YOUR-CODE</code>
          </p>
        </div>
      </main>
    </div>
  );
}
