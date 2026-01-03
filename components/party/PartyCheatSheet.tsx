'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Eye, Footprints, Languages, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CharacterEntity {
  id: string;
  name: string;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
}

interface PartyMember {
  entities: CharacterEntity | null;
}

interface PartyCheatSheetProps {
  members: PartyMember[];
}

export function PartyCheatSheet({ members }: PartyCheatSheetProps) {
  // Calculate party stats
  const characters = members.map(m => m.entities).filter(Boolean) as CharacterEntity[];

  // Helper to calculate passive perception from WIS
  const getPassivePerception = (char: CharacterEntity): number => {
    const soul = char.soul as Record<string, unknown> | null;
    const abilityScores = soul?.ability_scores as Record<string, number> | null;
    const wis = abilityScores?.wis || 10;
    const wisMod = Math.floor((wis - 10) / 2);
    // Base passive perception is 10 + WIS modifier
    return 10 + wisMod;
  };

  // Passive Perception leader
  const perceptionLeader = characters.reduce<CharacterEntity | null>((best, char) => {
    const pp = getPassivePerception(char);
    if (!best) return char;
    const bestPP = getPassivePerception(best);
    return pp > bestPP ? char : best;
  }, null);

  // Average stealth (Dex mod approximation)
  const avgStealth = Math.round(
    characters.reduce((sum, char) => {
      const soul = char.soul as Record<string, unknown> | null;
      const abilityScores = soul?.ability_scores as Record<string, number> | null;
      const dex = abilityScores?.dex || 10;
      return sum + Math.floor((dex - 10) / 2);
    }, 0) / (characters.length || 1)
  );

  // Collect all languages
  const allLanguages = new Set<string>();
  characters.forEach(char => {
    const soul = char.soul as Record<string, unknown> | null;
    const langs = soul?.languages as string[] | string | null;
    if (Array.isArray(langs)) {
      langs.forEach(l => allLanguages.add(l));
    } else if (typeof langs === 'string') {
      langs.split(',').forEach(l => allLanguages.add(l.trim()));
    }
  });

  // Average AC - soul.armor_class is the correct path
  const avgAC = Math.round(
    characters.reduce((sum, char) => {
      const soul = char.soul as Record<string, unknown> | null;
      return sum + ((soul?.armor_class as number) || 10);
    }, 0) / (characters.length || 1)
  );

  // Total HP - soul.max_hp is the correct path
  const totalHP = characters.reduce((sum, char) => {
    const soul = char.soul as Record<string, unknown> | null;
    const mechanics = char.mechanics as Record<string, unknown> | null;
    const mechanicsHp = mechanics?.hp as { max?: number } | null;
    return sum + ((soul?.max_hp as number) || mechanicsHp?.max || 0);
  }, 0);

  // Get perception value for leader display
  const getPerceptionValue = (char: CharacterEntity | null): string => {
    if (!char) return '?';
    return String(getPassivePerception(char));
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Perception Leader */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <Eye className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-xs text-zinc-500">Perception Leader</p>
              <p className="font-medium text-white">
                {perceptionLeader?.name || 'N/A'}
                <span className="text-purple-400 ml-1">
                  ({getPerceptionValue(perceptionLeader)})
                </span>
              </p>
            </div>
          </div>

          {/* Group Stealth */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <Footprints className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs text-zinc-500">Group Stealth</p>
              <p className="font-medium text-white">
                {avgStealth >= 0 ? '+' : ''}{avgStealth} avg
              </p>
            </div>
          </div>

          {/* Average AC */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">Average AC</p>
              <p className="font-medium text-white">{avgAC}</p>
            </div>
          </div>

          {/* Total HP */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <Zap className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-xs text-zinc-500">Total HP Pool</p>
              <p className="font-medium text-white">{totalHP}</p>
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg col-span-2 md:col-span-1">
            <Languages className="h-5 w-5 text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">Languages</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(allLanguages).slice(0, 4).map(lang => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
                {allLanguages.size > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{allLanguages.size - 4}
                  </Badge>
                )}
                {allLanguages.size === 0 && (
                  <span className="text-xs text-zinc-500">None known</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
