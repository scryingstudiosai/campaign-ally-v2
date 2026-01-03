'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Faction {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface ReputationMatrixProps {
  campaignId: string;
  factions: Faction[];
  reputation: Record<string, string>;
  onUpdate: () => void;
}

const STANDINGS = [
  { value: 'nemesis', label: 'Nemesis', color: 'bg-red-900 text-red-300' },
  { value: 'hostile', label: 'Hostile', color: 'bg-red-800 text-red-300' },
  { value: 'unfriendly', label: 'Unfriendly', color: 'bg-orange-800 text-orange-300' },
  { value: 'neutral', label: 'Neutral', color: 'bg-zinc-700 text-zinc-300' },
  { value: 'friendly', label: 'Friendly', color: 'bg-emerald-800 text-emerald-300' },
  { value: 'allied', label: 'Allied', color: 'bg-emerald-700 text-emerald-300' },
];

export function ReputationMatrix({ campaignId, factions, reputation, onUpdate }: ReputationMatrixProps) {

  const updateReputation = async (factionId: string, standing: string) => {
    const supabase = createClient();

    const newReputation = {
      ...reputation,
      [factionId]: standing,
    };

    const { error } = await supabase
      .from('campaigns')
      .update({ party_reputation: newReputation })
      .eq('id', campaignId);

    if (error) {
      toast.error('Failed to update reputation');
      return;
    }

    onUpdate();
  };

  const getStanding = (factionId: string) => {
    return reputation[factionId] || 'neutral';
  };

  const getStandingInfo = (standing: string) => {
    return STANDINGS.find(s => s.value === standing) || STANDINGS[3];
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-400" />
          Faction Reputation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {factions.length === 0 ? (
          <div className="text-center py-6 text-zinc-500">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No factions in campaign</p>
            <p className="text-sm">Create factions in the Forge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {factions.map((faction) => {
              const current = getStanding(faction.id);
              const standingInfo = getStandingInfo(current);

              return (
                <div key={faction.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {faction.image_url ? (
                      <img
                        src={faction.image_url}
                        alt={faction.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-zinc-500" />
                      </div>
                    )}
                    <span className="text-white font-medium">{faction.name}</span>
                  </div>

                  <select
                    value={current}
                    onChange={(e) => updateReputation(faction.id, e.target.value)}
                    className={`px-3 py-1 rounded text-sm cursor-pointer ${standingInfo.color}`}
                  >
                    {STANDINGS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-zinc-800">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
