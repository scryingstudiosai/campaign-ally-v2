'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserPlus, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface Character {
  id: string;
  name: string;
  image_url: string | null;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
}

interface Membership {
  id: string;
  character_entity_id: string | null;
  character_entity: Character | null;
}

export default function JoinCampaignPage() {
  // Get params safely - useParams returns an object, not a promise
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [unclaimedCharacters, setUnclaimedCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (!code) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }

    loadInvite();
  }, [code]);

  async function loadInvite() {
    try {
      const supabase = createClient();

      // Check auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // First try campaign_invites table
      const { data: invite, error: inviteError } = await supabase
        .from('campaign_invites')
        .select(`
          *,
          campaigns (
            id,
            name,
            description,
            image_url
          )
        `)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      let campaignData: Campaign | null = null;

      if (!inviteError && invite) {
        // Check expiration
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          setError('This invite has expired');
          setLoading(false);
          return;
        }

        // Check max uses
        if (invite.max_uses && invite.use_count >= invite.max_uses) {
          setError('This invite has reached its maximum uses');
          setLoading(false);
          return;
        }

        // Handle joined table types
        const campaignResult = invite.campaigns as unknown;
        campaignData = (Array.isArray(campaignResult) ? campaignResult[0] : campaignResult) as Campaign;
      } else {
        // Fallback to legacy join_code on campaigns table
        const { data: legacyCampaign, error: legacyError } = await supabase
          .from('campaigns')
          .select('id, name, description, image_url')
          .eq('join_code', code.toUpperCase())
          .is('deleted_at', null)
          .single();

        if (legacyError || !legacyCampaign) {
          console.log('Invite lookup failed:', { code, inviteError, legacyError });
          setError('Invalid or expired invite code');
          setLoading(false);
          return;
        }

        campaignData = legacyCampaign;
      }

      if (!campaignData) {
        setError('Campaign not found');
        setLoading(false);
        return;
      }

      setCampaign(campaignData);

      // If logged in, check existing membership
      if (authUser) {
        const { data: existingMembership } = await supabase
          .from('campaign_members')
          .select(`
            id,
            character_entity_id,
            character_entity:entities!character_entity_id (id, name, image_url, soul, mechanics)
          `)
          .eq('campaign_id', campaignData.id)
          .eq('user_id', authUser.id)
          .single();

        if (existingMembership) {
          const charData = existingMembership.character_entity as unknown;
          const charObj = charData
            ? (Array.isArray(charData) ? charData[0] : charData) as Character
            : null;

          setMembership({
            id: existingMembership.id,
            character_entity_id: existingMembership.character_entity_id,
            character_entity: charObj,
          });
        }

        // Get unclaimed characters
        const { data: claimedMembers } = await supabase
          .from('campaign_members')
          .select('character_entity_id')
          .eq('campaign_id', campaignData.id)
          .not('character_entity_id', 'is', null);

        const claimedIds = claimedMembers?.map(m => m.character_entity_id).filter(Boolean) || [];

        let query = supabase
          .from('entities')
          .select('id, name, image_url, soul, mechanics')
          .eq('campaign_id', campaignData.id)
          .eq('entity_type', 'player')
          .is('deleted_at', null)
          .order('name');

        if (claimedIds.length > 0) {
          query = query.not('id', 'in', `(${claimedIds.join(',')})`);
        }

        const { data: unclaimed } = await query;
        setUnclaimedCharacters((unclaimed || []) as Character[]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Failed to load invite');
      setLoading(false);
    }
  }

  const handleJoin = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    if (!campaign) {
      toast.error('Campaign not found');
      return;
    }

    setJoining(true);
    try {
      const supabase = createClient();

      // Create membership
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          role: 'player',
        });

      if (memberError) {
        if (memberError.code === '23505') {
          // Already a member - just reload to show character selection
          window.location.reload();
          return;
        }
        throw memberError;
      }

      // Try to increment invite use count (may not exist for legacy codes)
      await supabase
        .from('campaign_invites')
        .update({ use_count: (await supabase.from('campaign_invites').select('use_count').eq('code', code.toUpperCase()).single()).data?.use_count + 1 || 1 })
        .eq('code', code.toUpperCase());

      toast.success(`Joined ${campaign.name}!`);

      // Reload to show character options
      window.location.reload();

    } catch (err) {
      console.error('Join error:', err);
      const message = err instanceof Error ? err.message : 'Failed to join campaign';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  const handleClaimCharacter = async (characterId: string) => {
    if (!user || !campaign) return;

    try {
      const supabase = createClient();

      // Update membership with character
      const { error: memberError } = await supabase
        .from('campaign_members')
        .update({ character_entity_id: characterId })
        .eq('campaign_id', campaign.id)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      toast.success('Character claimed!');
      router.push(`/portal/${campaign.id}`);

    } catch (err) {
      console.error('Claim error:', err);
      const message = err instanceof Error ? err.message : 'Failed to claim character';
      toast.error(message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already a member with character - show enter button
  if (membership?.character_entity_id && membership.character_entity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome Back!</CardTitle>
            <CardDescription>
              You're playing as {membership.character_entity.name} in {campaign?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href={`/portal/${campaign?.id}`}>
              <Button className="bg-teal-600 hover:bg-teal-500">
                Enter Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Member but no character yet - show character selection
  if (membership && !membership.character_entity_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="max-w-lg w-full bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-teal-400" />
            </div>
            <CardTitle className="text-white">Choose Your Character</CardTitle>
            <CardDescription>
              You've joined {campaign?.name}! Now select or create your character.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create New Character */}
            <Link href={`/portal/${campaign?.id}/create-character`}>
              <Button className="w-full h-auto py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create New Character</div>
                    <div className="text-xs text-teal-200/70">Use the Player Forge</div>
                  </div>
                </div>
              </Button>
            </Link>

            {/* Claim Existing Character */}
            {unclaimedCharacters.length > 0 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-3 text-sm text-slate-500">
                      or claim existing
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {unclaimedCharacters.map((char) => (
                    <Button
                      key={char.id}
                      variant="outline"
                      className="w-full h-auto py-3 justify-start border-slate-700 hover:bg-slate-800"
                      onClick={() => handleClaimCharacter(char.id)}
                    >
                      <div className="flex items-center gap-3">
                        {char.image_url ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                            <Image
                              src={char.image_url}
                              alt={char.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <div className="text-left">
                          <div className="font-medium">{char.name}</div>
                          <div className="text-xs text-slate-500">
                            {(char.soul as Record<string, unknown>)?.race as string}{' '}
                            {(char.soul as Record<string, unknown>)?.class as string}
                            {(char.mechanics as Record<string, unknown>)?.level &&
                              ` - Level ${(char.mechanics as Record<string, unknown>)?.level}`}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Skip for now */}
            <div className="text-center pt-2">
              <Link
                href={`/portal/${campaign?.id}`}
                className="text-sm text-slate-500 hover:text-slate-300"
              >
                Skip for now
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not yet joined - show join card
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          {campaign?.image_url ? (
            <div className="relative w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden border border-slate-700">
              <Image
                src={campaign.image_url}
                alt={campaign.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-teal-400" />
            </div>
          )}
          <CardTitle className="text-2xl text-white">{campaign?.name || 'Campaign'}</CardTitle>
          {campaign?.description && (
            <CardDescription className="mt-2">
              {campaign.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-400">
            You've been invited to join this campaign as a player!
          </p>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-500"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : user ? (
              'Join Campaign'
            ) : (
              'Sign In to Join'
            )}
          </Button>

          {!user && (
            <p className="text-center text-xs text-slate-500">
              You'll need to create an account or sign in to join.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
