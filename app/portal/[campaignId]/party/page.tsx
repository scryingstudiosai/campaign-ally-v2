'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, Coins, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PartyMember {
  id: string;
  character_entity_id: string;
  entities: {
    id: string;
    name: string;
    image_url: string | null;
    soul: Record<string, unknown> | null;
  } | null;
}

interface StashItem {
  id: string;
  quantity: number;
  custom_name: string | null;
  srd_item: { id: string; name: string; item_type: string; rarity: string } | null;
  custom_item: { id: string; name: string; image_url: string | null } | null;
}

export default function PlayerPartyPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const supabase = createClient();

  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [partyStash, setPartyStash] = useState<StashItem[]>([]);
  const [partyGold, setPartyGold] = useState(0);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [takeAmount, setTakeAmount] = useState<number | ''>('');
  const [takingGold, setTakingGold] = useState(false);

  const loadPartyData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get my character
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    setMyCharacterId(membership?.character_entity_id || null);

    // Get all party members
    const { data: members } = await supabase
      .from('campaign_members')
      .select(`
        id,
        character_entity_id,
        entities:character_entity_id (
          id,
          name,
          image_url,
          soul
        )
      `)
      .eq('campaign_id', campaignId)
      .not('character_entity_id', 'is', null);

    // Filter and normalize members
    const validMembers = (members || []).filter(m => m.entities) as PartyMember[];
    setPartyMembers(validMembers);

    // Get party stash
    const { data: stash } = await supabase
      .from('inventory_instances')
      .select(`
        id, quantity, custom_name,
        srd_item:srd_items!srd_item_id (id, name, item_type, rarity),
        custom_item:entities!custom_entity_id (id, name, image_url)
      `)
      .eq('campaign_id', campaignId)
      .eq('owner_type', 'party');

    // Normalize stash items
    const normalizedStash: StashItem[] = (stash || []).map(item => ({
      ...item,
      custom_name: item.custom_name || null,
      srd_item: Array.isArray(item.srd_item) ? item.srd_item[0] || null : item.srd_item,
      custom_item: Array.isArray(item.custom_item) ? item.custom_item[0] || null : item.custom_item,
    }));

    setPartyStash(normalizedStash);

    // Get party gold from campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('party_gold')
      .eq('id', campaignId)
      .single();

    setPartyGold(campaign?.party_gold || 0);
    setLoading(false);
  }, [campaignId, supabase]);

  useEffect(() => {
    loadPartyData();
  }, [loadPartyData]);

  // Realtime subscription for party stash changes
  useEffect(() => {
    const channel = supabase
      .channel(`party-stash-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_instances',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('[Party] Inventory change:', payload);
          // Refresh when party stash items change
          const newRecord = payload.new as Record<string, unknown> | null;
          const oldRecord = payload.old as Record<string, unknown> | null;

          if (
            newRecord?.owner_type === 'party' ||
            oldRecord?.owner_type === 'party' ||
            newRecord?.owner_id === myCharacterId
          ) {
            loadPartyData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, supabase, myCharacterId, loadPartyData]);

  const claimItem = async (itemId: string, itemName: string) => {
    if (!myCharacterId) {
      toast.error('No character linked');
      return;
    }

    setClaiming(itemId);

    try {
      const res = await fetch('/api/portal/inventory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          characterId: myCharacterId,
          campaignId,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to claim item');
      }

      toast.success(`Claimed ${itemName}!`);
      loadPartyData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim item');
    } finally {
      setClaiming(null);
    }
  };

  const takeGold = async () => {
    const amount = typeof takeAmount === 'number' ? takeAmount : 0;
    if (amount <= 0 || amount > partyGold) {
      toast.error('Invalid amount');
      return;
    }

    setTakingGold(true);
    try {
      const response = await fetch('/api/portal/party/take-gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, amount }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to take gold');
      }

      toast.success(`Took ${amount} gp!`);
      setTakeAmount('');
      loadPartyData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to take gold');
    } finally {
      setTakingGold(false);
    }
  };

  const getItemName = (item: StashItem): string => {
    // Check SRD item first (has full descriptions)
    if (item.srd_item?.name) return item.srd_item.name;
    // Check custom entity
    if (item.custom_item?.name) return item.custom_item.name;
    // Check custom_name field (for loot items without SRD match)
    if (item.custom_name) return item.custom_name;
    // Fallback
    return 'Unknown Item';
  };

  const getRarityColor = (rarity: string | undefined): string => {
    switch (rarity?.toLowerCase()) {
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'very rare': return 'text-purple-400';
      case 'legendary': return 'text-orange-400';
      case 'artifact': return 'text-red-400';
      default: return 'text-slate-400';
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
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-teal-400" />
        <h1 className="text-xl font-bold text-white">Party</h1>
      </div>

      {/* Party Treasury */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-400" />
            Party Treasury
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold text-amber-400">
            {partyGold} gp
          </div>

          {partyGold > 0 && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={takeAmount}
                onChange={(e) => setTakeAmount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-24 bg-slate-800 border-slate-700"
                min={1}
                max={partyGold}
              />
              <Button
                onClick={takeGold}
                disabled={takingGold || !takeAmount || takeAmount <= 0 || takeAmount > partyGold || !myCharacterId}
                className="bg-amber-600 hover:bg-amber-500"
              >
                {takingGold ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Take Gold'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Party Stash */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-400" />
            Party Stash
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partyStash.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items in party stash</p>
              <p className="text-sm">Loot from encounters will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {partyStash.map((item) => {
                const itemName = getItemName(item);
                const rarity = item.srd_item?.rarity;
                const itemType = item.srd_item?.item_type || 'Item';

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${getRarityColor(rarity)}`}>
                        {itemName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.quantity > 1 && `x${item.quantity} · `}
                        {itemType}
                        {rarity && rarity !== 'common' && ` · ${rarity}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => claimItem(item.id, itemName)}
                      disabled={claiming === item.id || !myCharacterId}
                      className="bg-teal-600 hover:bg-teal-500 ml-3"
                    >
                      {claiming === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Claim'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Party Members */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-400" />
            Party Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partyMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No party members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partyMembers.map((member) => {
                const char = member.entities;
                if (!char) return null;

                const isMe = member.character_entity_id === myCharacterId;
                const soul = char.soul as Record<string, unknown> | null;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-4 p-3 bg-slate-800 rounded-lg ${
                      isMe ? 'ring-1 ring-teal-500' : ''
                    }`}
                  >
                    {char.image_url ? (
                      <img
                        src={char.image_url}
                        alt={char.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        <Users className="h-6 w-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {char.name}
                        {isMe && <span className="ml-2 text-xs text-teal-400">(You)</span>}
                      </p>
                      <p className="text-sm text-slate-400">
                        {soul?.race as string} {soul?.class as string}
                        {soul?.level && ` ${soul.level}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
