'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, UserMinus, UserPlus, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

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
}

export default function SwitchCharacterPage() {
  const params = useParams();
  const campaignId = params?.campaignId as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [unclaimedCharacters, setUnclaimedCharacters] = useState<Character[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Get current membership and character
    const { data: membershipData } = await supabase
      .from('campaign_members')
      .select(`
        id,
        character_entity_id,
        character:entities!character_entity_id (
          id,
          name,
          image_url,
          soul,
          mechanics
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (membershipData) {
      setMembership({
        id: membershipData.id,
        character_entity_id: membershipData.character_entity_id,
      });

      const charData = membershipData.character as unknown;
      if (charData) {
        const char = Array.isArray(charData) ? charData[0] : charData;
        setCurrentCharacter(char as Character);
      } else {
        setCurrentCharacter(null);
      }
    }

    // Get all claimed character IDs in this campaign
    const { data: claimedMembers } = await supabase
      .from('campaign_members')
      .select('character_entity_id')
      .eq('campaign_id', campaignId)
      .not('character_entity_id', 'is', null);

    const claimedIds = claimedMembers?.map(m => m.character_entity_id).filter(Boolean) || [];

    // Get player entities that are not claimed
    let query = supabase
      .from('entities')
      .select('id, name, image_url, soul, mechanics')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'player')
      .is('deleted_at', null)
      .order('name');

    if (claimedIds.length > 0) {
      query = query.not('id', 'in', `(${claimedIds.join(',')})`);
    }

    const { data: unclaimed } = await query;
    setUnclaimedCharacters((unclaimed || []) as Character[]);
    setLoading(false);
  }

  const handleUnlink = async () => {
    if (!membership) return;
    setUnlinking(true);

    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_entity_id: null })
        .eq('id', membership.id);

      if (error) throw error;

      toast.success('Character unlinked');
      setCurrentCharacter(null);
      setMembership({ ...membership, character_entity_id: null });
      loadData(); // Refresh to show unclaimed characters
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to unlink character';
      toast.error(message);
    } finally {
      setUnlinking(false);
    }
  };

  const handleClaimCharacter = async (characterId: string) => {
    if (!membership) return;
    setClaiming(characterId);

    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_entity_id: characterId })
        .eq('id', membership.id);

      if (error) throw error;

      toast.success('Character claimed!');
      router.push(`/portal/${campaignId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to claim character';
      toast.error(message);
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/portal/${campaignId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </Link>
        <h1 className="text-2xl font-bold text-white">Switch Character</h1>
        <p className="text-slate-400 mt-1">Change which character you are playing</p>
      </div>

      {/* Current Character */}
      {currentCharacter && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Current Character</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {currentCharacter.image_url ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700">
                  <Image
                    src={currentCharacter.image_url}
                    alt={currentCharacter.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-slate-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-white">{currentCharacter.name}</h3>
                <p className="text-sm text-slate-400">
                  {(currentCharacter.soul as Record<string, unknown>)?.race as string}{' '}
                  {(currentCharacter.soul as Record<string, unknown>)?.class as string}
                  {(currentCharacter.mechanics as Record<string, unknown>)?.level &&
                    ` - Level ${(currentCharacter.mechanics as Record<string, unknown>)?.level}`}
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-4 text-amber-400 border-amber-900 hover:bg-amber-900/20"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unlink Character
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Unlink Character?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect you from {currentCharacter.name}. The character will
                    remain in the campaign and can be claimed again by you or another player.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 border-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="bg-amber-600 hover:bg-amber-500"
                  >
                    {unlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* No Character - Show Options */}
      {!currentCharacter && (
        <>
          {/* Create New */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <Link href={`/portal/${campaignId}/create-character`}>
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
            </CardContent>
          </Card>

          {/* Claim Existing */}
          {unclaimedCharacters.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Available Characters</CardTitle>
                <CardDescription>Characters created by the DM that you can claim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {unclaimedCharacters.map((char) => (
                  <Button
                    key={char.id}
                    variant="outline"
                    className="w-full h-auto py-3 justify-start border-slate-700 hover:bg-slate-800"
                    onClick={() => handleClaimCharacter(char.id)}
                    disabled={claiming !== null}
                  >
                    {claiming === char.id ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    ) : (
                      <div className="flex items-center gap-3 w-full">
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
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {unclaimedCharacters.length === 0 && (
            <p className="text-center text-slate-500 text-sm">
              No unclaimed characters available. Create a new one above!
            </p>
          )}
        </>
      )}
    </div>
  );
}
