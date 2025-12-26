'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Skull,
  Brain,
  Wrench,
  Coins,
  Heart,
  Shield,
  Activity,
  Eye,
  Languages,
  Swords,
  Sparkles,
  Volume2,
  MapPin,
  Users,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import type { ScanResult, Discovery } from '@/types/forge';
import type {
  CreatureBrain,
  CreatureSoul,
  CreatureMechanics,
  CreatureTreasure,
} from '@/types/living-entity';

export interface GeneratedCreature {
  name: string;
  sub_type: string;
  soul: CreatureSoul;
  brain: CreatureBrain;
  mechanics: CreatureMechanics;
  treasure: CreatureTreasure;
  facts: Array<{
    content: string;
    category: string;
    visibility: string;
  }>;
  read_aloud: string;
  dm_slug: string;
  tags: string[];
  srd_base?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CreatureOutputCardProps {
  data: GeneratedCreature;
  scanResult?: ScanResult | null;
  campaignId: string;
  onDiscoveryAction?: (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ) => void;
  onManualDiscovery?: (text: string, type: string) => void;
  onLinkExisting?: (entityId: string) => void;
  existingEntities?: Array<{ id: string; name: string; type: string }>;
}

// Helper to format array or string fields
const formatListField = (field: string[] | string | undefined): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.join(', ');
};

// Helper to format ability modifier
const formatMod = (score?: number): string => {
  if (score === undefined) return '+0';
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Format speeds
const formatSpeeds = (speeds?: CreatureMechanics['speeds']): string => {
  if (!speeds) return 'Unknown';
  return Object.entries(speeds)
    .filter(([, value]) => value && typeof value === 'number')
    .map(([type, value]) => (type === 'walk' ? `${value} ft.` : `${type} ${value} ft.`))
    .join(', ');
};

export function CreatureOutputCard({
  data,
  scanResult,
  campaignId,
  onDiscoveryAction,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: CreatureOutputCardProps): JSX.Element {
  const { mechanics, soul, brain, treasure } = data;

  return (
    <div className="space-y-4">
      {/* Header with name and CR */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Skull className="w-6 h-6 text-rose-400" />
          <h2 className="text-2xl font-bold text-slate-100">{data.name}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-red-700 text-red-400">
            CR {mechanics?.cr || '?'}
          </Badge>
          <Badge variant="outline" className="border-slate-600 capitalize">
            {mechanics?.size} {mechanics?.type}
          </Badge>
          {data.srd_base && (
            <Badge variant="outline" className="border-teal-600 text-teal-400">
              Based on: {data.srd_base.name}
            </Badge>
          )}
        </div>
      </div>

      {/* DM Slug */}
      <p className="text-sm text-slate-400 italic">{data.dm_slug}</p>

      {/* Read Aloud */}
      <Card className="p-4 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-2">
          <Volume2 className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
          <p className="text-slate-200 italic">{data.read_aloud}</p>
        </div>
      </Card>

      {/* Tabbed content */}
      <Tabs defaultValue="mechanics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="mechanics" className="flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="soul" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Soul</span>
          </TabsTrigger>
          <TabsTrigger value="brain" className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Brain</span>
          </TabsTrigger>
          <TabsTrigger value="treasure" className="flex items-center gap-1">
            <Coins className="w-4 h-4" />
            <span className="hidden sm:inline">Loot</span>
          </TabsTrigger>
        </TabsList>

        {/* MECHANICS TAB - Full Stat Block */}
        <TabsContent value="mechanics" className="mt-4 space-y-4">
          {/* Core Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">AC</span>
              <span className="text-slate-200 font-medium">{mechanics?.ac || '—'}</span>
              {mechanics?.ac_type && (
                <span className="text-slate-500 text-xs">({mechanics.ac_type})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-slate-400">HP</span>
              <span className="text-slate-200 font-medium">{mechanics?.hp || '—'}</span>
              {mechanics?.hit_dice && (
                <span className="text-slate-500 text-xs">({mechanics.hit_dice})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-slate-400">Speed</span>
              <span className="text-slate-200 text-xs">{formatSpeeds(mechanics?.speeds)}</span>
            </div>
          </div>

          {/* Ability Scores */}
          {mechanics?.abilities && (
            <div className="grid grid-cols-6 gap-2 text-center py-2 bg-slate-800/50 rounded">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
                <div key={stat} className="space-y-0.5">
                  <span className="text-xs text-slate-500 uppercase">{stat}</span>
                  <div className="text-slate-200 font-medium">
                    {mechanics.abilities?.[stat] ?? '—'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatMod(mechanics.abilities?.[stat])}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saving Throws & Skills */}
          {(mechanics?.saving_throws?.length || mechanics?.skills?.length) && (
            <div className="space-y-1 text-sm">
              {mechanics.saving_throws && mechanics.saving_throws.length > 0 && (
                <div>
                  <span className="text-slate-500">Saving Throws: </span>
                  <span className="text-slate-300">
                    {mechanics.saving_throws
                      .map((st) => `${st.ability} +${st.modifier}`)
                      .join(', ')}
                  </span>
                </div>
              )}
              {mechanics.skills && mechanics.skills.length > 0 && (
                <div>
                  <span className="text-slate-500">Skills: </span>
                  <span className="text-slate-300">
                    {mechanics.skills.map((sk) => `${sk.name} +${sk.modifier}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Defenses */}
          {(mechanics?.damage_resistances?.length ||
            mechanics?.damage_immunities?.length ||
            mechanics?.damage_vulnerabilities?.length ||
            mechanics?.condition_immunities?.length) && (
            <div className="space-y-1 text-sm">
              {mechanics.damage_vulnerabilities && mechanics.damage_vulnerabilities.length > 0 && (
                <div>
                  <span className="text-slate-500">Vulnerabilities: </span>
                  <span className="text-red-400">
                    {formatListField(mechanics.damage_vulnerabilities)}
                  </span>
                </div>
              )}
              {mechanics.damage_resistances && mechanics.damage_resistances.length > 0 && (
                <div>
                  <span className="text-slate-500">Resistances: </span>
                  <span className="text-slate-300">
                    {formatListField(mechanics.damage_resistances)}
                  </span>
                </div>
              )}
              {mechanics.damage_immunities && mechanics.damage_immunities.length > 0 && (
                <div>
                  <span className="text-slate-500">Immunities: </span>
                  <span className="text-slate-300">
                    {formatListField(mechanics.damage_immunities)}
                  </span>
                </div>
              )}
              {mechanics.condition_immunities && mechanics.condition_immunities.length > 0 && (
                <div>
                  <span className="text-slate-500">Condition Immunities: </span>
                  <span className="text-slate-300">
                    {formatListField(mechanics.condition_immunities)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Senses & Languages */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {mechanics?.senses && (
              <div>
                <span className="flex items-center gap-1 text-slate-500 mb-1">
                  <Eye className="w-3 h-3" /> Senses
                </span>
                <span className="text-slate-300 text-xs">
                  {Object.entries(mechanics.senses)
                    .filter(([, v]) => v)
                    .map(([k, v]) =>
                      k === 'passive_perception' ? `passive Perception ${v}` : `${k} ${v} ft.`
                    )
                    .join(', ')}
                </span>
              </div>
            )}
            {mechanics?.languages && mechanics.languages.length > 0 && (
              <div>
                <span className="flex items-center gap-1 text-slate-500 mb-1">
                  <Languages className="w-3 h-3" /> Languages
                </span>
                <span className="text-slate-300 text-xs">
                  {formatListField(mechanics.languages)}
                </span>
              </div>
            )}
          </div>

          {/* Special Abilities */}
          {mechanics?.special_abilities && mechanics.special_abilities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <span className="text-slate-500 text-xs uppercase">Traits</span>
              {mechanics.special_abilities.map((ability, i) => (
                <div key={i} className="text-sm">
                  <span className="text-amber-400 font-medium">{ability.name}. </span>
                  <span className="text-slate-300">{ability.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {mechanics?.actions && mechanics.actions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <span className="flex items-center gap-1 text-slate-500 text-xs uppercase">
                <Swords className="w-3 h-3" /> Actions
              </span>
              {mechanics.actions.map((action, i) => (
                <div key={i} className="text-sm">
                  <span className="text-red-400 font-medium">{action.name}. </span>
                  <span className="text-slate-300">{action.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bonus Actions */}
          {mechanics?.bonus_actions && mechanics.bonus_actions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <span className="text-slate-500 text-xs uppercase">Bonus Actions</span>
              {mechanics.bonus_actions.map((action, i) => (
                <div key={i} className="text-sm">
                  <span className="text-orange-400 font-medium">{action.name}. </span>
                  <span className="text-slate-300">{action.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {mechanics?.reactions && mechanics.reactions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <span className="text-slate-500 text-xs uppercase">Reactions</span>
              {mechanics.reactions.map((reaction, i) => (
                <div key={i} className="text-sm">
                  <span className="text-purple-400 font-medium">{reaction.name}. </span>
                  <span className="text-slate-300">{reaction.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Legendary Actions */}
          {mechanics?.legendary_actions_list && mechanics.legendary_actions_list.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-amber-500/30">
              <span className="text-amber-400 text-xs uppercase">Legendary Actions</span>
              <p className="text-xs text-slate-400">
                The creature can take 3 legendary actions, choosing from the options below. Only
                one legendary action can be used at a time and only at the end of another
                creature&apos;s turn. The creature regains spent legendary actions at the start of
                its turn.
              </p>
              {mechanics.legendary_actions_list.map((action, i) => (
                <div key={i} className="text-sm">
                  <span className="text-amber-400 font-medium">
                    {action.name}
                    {action.cost && action.cost > 1 && ` (Costs ${action.cost} Actions)`}.{' '}
                  </span>
                  <span className="text-slate-300">{action.description}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SOUL TAB - Player-facing flavor */}
        <TabsContent value="soul" className="mt-4 space-y-4">
          {/* Vivid Description */}
          {soul?.vivid_description && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-slate-200 italic">{soul.vivid_description}</p>
            </div>
          )}

          {/* Distinctive Features */}
          {soul?.distinctive_features && soul.distinctive_features.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                <Eye className="w-4 h-4" /> Distinctive Features
              </h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                {soul.distinctive_features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Behavior & Ecology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {soul?.behavior && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Behavior</h4>
                <p className="text-slate-300 text-sm">{soul.behavior}</p>
              </div>
            )}
            {soul?.ecology && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Ecology</h4>
                <p className="text-slate-300 text-sm">{soul.ecology}</p>
              </div>
            )}
          </div>

          {/* Habitat & Social */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {soul?.habitat && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Habitat
                </h4>
                <p className="text-slate-300 text-sm">{soul.habitat}</p>
              </div>
            )}
            {soul?.social_structure && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Social Structure
                </h4>
                <p className="text-slate-300 text-sm capitalize">{soul.social_structure}</p>
              </div>
            )}
          </div>

          {/* Sounds & Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {soul?.sounds && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Sounds
                </h4>
                <p className="text-slate-300 text-sm">{soul.sounds}</p>
              </div>
            )}
            {soul?.signs_of_presence && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">
                  Signs of Presence
                </h4>
                <p className="text-slate-300 text-sm">{soul.signs_of_presence}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* BRAIN TAB - DM-only tactical info */}
        <TabsContent value="brain" className="mt-4 space-y-4">
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <Brain className="w-3 h-3" /> DM Eyes Only - Tactical Information
          </p>

          {/* Tactics */}
          {brain?.tactics && (
            <div className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <h4 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-1">
                <Swords className="w-4 h-4" /> Combat Tactics
              </h4>
              <p className="text-slate-300 text-sm">{brain.tactics}</p>
            </div>
          )}

          {/* Weaknesses & Motivations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brain?.weaknesses && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-red-400 uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Weaknesses
                </h4>
                <p className="text-slate-300 text-sm">{brain.weaknesses}</p>
              </div>
            )}
            {brain?.motivations && (
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Motivations</h4>
                <p className="text-slate-300 text-sm">{brain.motivations}</p>
              </div>
            )}
          </div>

          {/* Lair Description */}
          {brain?.lair_description && (
            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
              <h4 className="text-sm font-medium text-amber-400 mb-2">Lair</h4>
              <p className="text-slate-300 text-sm">{brain.lair_description}</p>
            </div>
          )}

          {/* Lair Actions */}
          {brain?.lair_actions && brain.lair_actions.length > 0 && (
            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
              <h4 className="text-sm font-medium text-amber-400 mb-2">Lair Actions</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                {brain.lair_actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regional Effects */}
          {brain?.regional_effects && brain.regional_effects.length > 0 && (
            <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <h4 className="text-sm font-medium text-purple-400 mb-2">Regional Effects</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                {brain.regional_effects.map((effect, i) => (
                  <li key={i}>{effect}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Plot Hooks */}
          {brain?.plot_hooks && brain.plot_hooks.length > 0 && (
            <div className="p-3 bg-teal-500/5 rounded-lg border border-teal-500/20">
              <h4 className="text-sm font-medium text-teal-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Plot Hooks
              </h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                {brain.plot_hooks.map((hook, i) => (
                  <li key={i}>{hook}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Secret */}
          {brain?.secret && (
            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
              <h4 className="text-sm font-medium text-red-400 mb-2">Secret</h4>
              <p className="text-slate-300 text-sm">{brain.secret}</p>
            </div>
          )}
        </TabsContent>

        {/* TREASURE TAB */}
        <TabsContent value="treasure" className="mt-4 space-y-4">
          {treasure?.treasure_description && (
            <p className="text-slate-300">{treasure.treasure_description}</p>
          )}

          {treasure?.treasure_items && treasure.treasure_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Loot Items
              </h4>
              <div className="space-y-2">
                {treasure.treasure_items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700"
                  >
                    <span className="text-slate-200">{item}</span>
                    <Badge variant="outline" className="text-xs text-teal-400 border-teal-500/30">
                      + Inventory
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                These items will be added to the creature&apos;s inventory when saved
              </p>
            </div>
          )}

          {(!treasure?.treasure_items || treasure.treasure_items.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No treasure defined for this creature</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-4 border-t border-slate-700">
          {data.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs text-slate-400">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
