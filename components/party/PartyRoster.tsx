'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Users, Zap, Star, Skull } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CharacterEntity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
  resources: Record<string, unknown> | null;
}

interface PartyMember {
  id: string;
  entities: CharacterEntity | null;
}

interface PartyRosterProps {
  members: PartyMember[];
  campaignId: string;
  onUpdate: () => void;
}

export function PartyRoster({ members, campaignId, onUpdate }: PartyRosterProps) {

  const updateResource = async (entityId: string, field: string, value: unknown) => {
    const supabase = createClient();

    // Get current resources
    const { data: entity } = await supabase
      .from('entities')
      .select('resources')
      .eq('id', entityId)
      .single();

    const currentResources = (entity?.resources || {}) as Record<string, unknown>;
    const newResources = {
      ...currentResources,
      [field]: value,
    };

    const { error } = await supabase
      .from('entities')
      .update({ resources: newResources })
      .eq('id', entityId);

    if (error) {
      toast.error('Failed to update');
      return;
    }

    onUpdate();
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-400" />
          Party Roster
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-6 text-zinc-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No party members yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => {
              const char = member.entities;
              if (!char) return null;

              const soul = (char.soul || {}) as Record<string, unknown>;
              const mechanics = (char.mechanics || {}) as Record<string, unknown>;
              const resources = (char.resources || {}) as Record<string, unknown>;
              const mechanicsHp = mechanics.hp as { max?: number; current?: number } | null;

              // Correct paths for level (used for hit dice max)
              const level = (soul.level as number) || 1;

              // Correct paths for AC - soul.armor_class is the primary location
              const ac = (soul.armor_class as number) || '?';

              // Correct paths for HP - soul.max_hp/current_hp or mechanics.hp.max/current
              const maxHp = (soul.max_hp as number) || mechanicsHp?.max || (mechanics.hp_max as number) || '?';
              const currentHp = (soul.current_hp as number) || mechanicsHp?.current || (mechanics.hp_current as number) || maxHp;

              // Resources
              const currentHD = (resources.hit_dice_current as number) ?? level;
              const exhaustion = (resources.exhaustion as number) || 0;
              const inspiration = (resources.inspiration as boolean) || false;

              return (
                <div
                  key={member.id}
                  className="p-4 bg-zinc-800 rounded-lg flex items-start gap-4"
                >
                  {/* Avatar */}
                  {char.image_url ? (
                    <img
                      src={char.image_url}
                      alt={char.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                      <Users className="h-8 w-8 text-zinc-500" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-medium text-white">{char.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {soul.race as string} {soul.class as string} {(soul.level as number) || (mechanics.level as number)}
                      </p>
                    </div>

                    {/* Resources Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Hit Dice */}
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span className="text-xs text-zinc-500">HD:</span>
                        <Input
                          type="number"
                          value={currentHD}
                          onChange={(e) => updateResource(char.id, 'hit_dice_current', parseInt(e.target.value) || 0)}
                          className="w-12 h-6 text-xs bg-zinc-700 border-zinc-600 p-1"
                          min={0}
                          max={level}
                        />
                        <span className="text-xs text-zinc-500">/ {level}</span>
                      </div>

                      {/* Exhaustion */}
                      <div className="flex items-center gap-2">
                        <Skull className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-zinc-500">Exhaust:</span>
                        <Input
                          type="number"
                          value={exhaustion}
                          onChange={(e) => updateResource(char.id, 'exhaustion', parseInt(e.target.value) || 0)}
                          className="w-12 h-6 text-xs bg-zinc-700 border-zinc-600 p-1"
                          min={0}
                          max={6}
                        />
                      </div>

                      {/* Inspiration */}
                      <div className="flex items-center gap-2">
                        <Star className={`h-4 w-4 ${inspiration ? 'text-yellow-400' : 'text-zinc-600'}`} />
                        <span className="text-xs text-zinc-500">Inspiration</span>
                        <Switch
                          checked={inspiration}
                          onCheckedChange={(v) => updateResource(char.id, 'inspiration', v)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">AC {ac}</div>
                    <div className="text-sm text-red-400">
                      HP {currentHp}/{maxHp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
