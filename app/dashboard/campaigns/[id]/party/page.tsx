'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Package, Shield,
  RefreshCw, Loader2, Coins, Plus, Pencil, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { TacticalProfile } from '@/components/party/TacticalProfile';
import { ReputationMatrix } from '@/components/party/ReputationMatrix';
import { PartyRoster } from '@/components/party/PartyRoster';
import { PartyCheatSheet } from '@/components/party/PartyCheatSheet';
import { InventoryList } from '@/components/inventory/InventoryList';
import { AddItemDialog } from '@/components/party/AddItemDialog';

interface Campaign {
  id: string;
  name: string;
  party_gold?: number;
  party_reputation?: Record<string, string>;
  party_tactical_profile?: {
    strengths?: string[];
    weaknesses?: string[];
    tags?: string[];
    analyzed_at?: string;
  };
}

interface PartyMember {
  id: string;
  user_id: string;
  character_entity_id: string;
  entities: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    soul: Record<string, unknown> | null;
    mechanics: Record<string, unknown> | null;
    resources: Record<string, unknown> | null;
    deleted_at: string | null;
  } | null;
}

interface Faction {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export default function PartyCommandCenter() {
  const params = useParams();
  const campaignId = params.id as string;
  const supabase = createClient();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [editingGold, setEditingGold] = useState(false);
  const [goldValue, setGoldValue] = useState(0);

  useEffect(() => {
    loadPartyData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const loadPartyData = async () => {
    setLoading(true);

    // Load campaign with party data
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('id, name, party_gold, party_reputation, party_tactical_profile')
      .eq('id', campaignId)
      .single();

    setCampaign(campaignData);

    // Load all player characters with full data
    const { data: members } = await supabase
      .from('campaign_members')
      .select(`
        id,
        user_id,
        character_entity_id,
        entities:character_entity_id (
          id,
          name,
          description,
          image_url,
          soul,
          mechanics,
          resources,
          deleted_at
        )
      `)
      .eq('campaign_id', campaignId)
      .not('character_entity_id', 'is', null);

    // Filter out members with missing or deleted entities
    const validMembers = (members || []).filter(m =>
      m.entities && !m.entities.deleted_at
    ) as PartyMember[];
    setPartyMembers(validMembers);

    // Load factions for reputation matrix
    const { data: factionData } = await supabase
      .from('entities')
      .select('id, name, description, image_url')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'faction')
      .is('deleted_at', null);

    setFactions((factionData || []) as Faction[]);
    setGoldValue(campaignData?.party_gold || 0);
    setLoading(false);
  };

  const saveGold = async () => {
    const { error } = await supabase
      .from('campaigns')
      .update({ party_gold: goldValue })
      .eq('id', campaignId);

    if (!error) {
      toast.success('Party gold updated');
      setEditingGold(false);
      loadPartyData();
    } else {
      toast.error('Failed to update gold');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-teal-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Party Command Center</h1>
            <p className="text-zinc-400">Macro-management dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/campaigns/${campaignId}/invite`}>
            <Button className="bg-teal-600 hover:bg-teal-500">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Player
            </Button>
          </Link>
          <Button variant="outline" onClick={loadPartyData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Row: Cheat Sheet */}
      <PartyCheatSheet members={partyMembers} />

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tactical Profile + Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tactical Profile */}
          <TacticalProfile
            campaignId={campaignId}
            profile={campaign?.party_tactical_profile}
            members={partyMembers}
            onUpdate={loadPartyData}
          />

          {/* Party Roster */}
          <PartyRoster
            members={partyMembers}
            campaignId={campaignId}
            onUpdate={loadPartyData}
          />
        </div>

        {/* Right Column: Group Assets */}
        <div className="space-y-6">
          <Tabs defaultValue="treasury" className="w-full">
            <TabsList className="bg-zinc-800 w-full">
              <TabsTrigger value="treasury" className="flex-1">
                <Coins className="h-4 w-4 mr-1" />
                Treasury
              </TabsTrigger>
              <TabsTrigger value="reputation" className="flex-1">
                <Shield className="h-4 w-4 mr-1" />
                Reputation
              </TabsTrigger>
            </TabsList>

            {/* Treasury Tab */}
            <TabsContent value="treasury" className="mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-400" />
                    Party Stash
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowAddItemDialog(true)}
                    className="bg-teal-600 hover:bg-teal-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Party Gold */}
                  <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg mb-4">
                    <span className="text-zinc-400">Party Treasury</span>
                    {editingGold ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={goldValue}
                          onChange={(e) => setGoldValue(parseInt(e.target.value) || 0)}
                          className="w-28 h-8 bg-zinc-700 border-zinc-600"
                        />
                        <span className="text-zinc-400">gp</span>
                        <Button size="sm" onClick={saveGold} className="bg-teal-600 hover:bg-teal-500 h-8">
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => {
                            setEditingGold(false);
                            setGoldValue(campaign?.party_gold || 0);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
                        onClick={() => setEditingGold(true)}
                      >
                        <span className="text-xl font-bold text-amber-400">
                          {campaign?.party_gold || 0} gp
                        </span>
                        <Pencil className="h-4 w-4 text-zinc-500" />
                      </div>
                    )}
                  </div>

                  {/* Party Inventory */}
                  <InventoryList
                    campaignId={campaignId}
                    ownerId={campaignId}
                    ownerType="party"
                    refreshKey={inventoryRefreshKey}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reputation Tab */}
            <TabsContent value="reputation" className="mt-4">
              <ReputationMatrix
                campaignId={campaignId}
                factions={factions}
                reputation={campaign?.party_reputation || {}}
                onUpdate={loadPartyData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Item Dialog */}
      <AddItemDialog
        open={showAddItemDialog}
        onOpenChange={setShowAddItemDialog}
        campaignId={campaignId}
        onItemAdded={() => setInventoryRefreshKey(k => k + 1)}
      />
    </div>
  );
}
