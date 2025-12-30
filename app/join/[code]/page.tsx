import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CharacterSelector } from '@/components/portal/CharacterSelector';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Validate join code
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, description')
    .eq('join_code', code.toUpperCase())
    .single();

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-display text-white mb-2">Invalid Code</h1>
          <p className="text-slate-400">This campaign code doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?redirect=/join/${code}`);
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('campaign_members')
    .select('id, character_entity_id')
    .eq('campaign_id', campaign.id)
    .eq('user_id', user.id)
    .single();

  if (existingMember?.character_entity_id) {
    // Already claimed a character - go to portal
    redirect(`/portal/${campaign.id}`);
  }

  // Get unclaimed player characters
  const { data: claimedIds } = await supabase
    .from('campaign_members')
    .select('character_entity_id')
    .eq('campaign_id', campaign.id)
    .not('character_entity_id', 'is', null);

  const claimedIdList = claimedIds?.map(m => m.character_entity_id).filter(Boolean) || [];

  let query = supabase
    .from('entities')
    .select('id, name, summary, description, image_url, attributes')
    .eq('campaign_id', campaign.id)
    .eq('entity_type', 'player')
    .is('deleted_at', null)
    .order('name');

  if (claimedIdList.length > 0) {
    query = query.not('id', 'in', `(${claimedIdList.join(',')})`);
  }

  const { data: availableCharacters } = await query;

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Campaign Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-display text-white mb-2">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-slate-400">{campaign.description}</p>
          )}
        </div>

        {/* Character Selection */}
        <CharacterSelector
          campaignId={campaign.id}
          characters={availableCharacters || []}
          userId={user.id}
          existingMemberId={existingMember?.id}
        />
      </div>
    </div>
  );
}
