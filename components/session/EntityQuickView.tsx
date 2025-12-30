'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink, Heart, Shield, Swords, Users,
  MapPin, Package, Skull, Flag, Scroll, Play, Plus,
  Footprints, Sparkles
} from 'lucide-react';
import { EntityVisibilityToggle } from '@/components/entity/EntityVisibilityToggle';
import Link from 'next/link';

interface EntityQuickViewProps {
  entity: EntityData | null;
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  isCombatActive?: boolean;
  onAddToCombat?: (entity: EntityData) => void;
}

interface EntityData {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  mechanics?: {
    hp?: number;
    hp_max?: number;
    hp_current?: number;
    ac?: number;
    cr?: string;
    speed?: { walk?: number } | number;
    abilities?: Record<string, number>;
    actions?: Array<{ name: string; desc?: string; description?: string; attack_bonus?: number }>;
    legendary_actions?: Array<{ name: string; desc?: string; description?: string }>;
    creatures?: Array<{ name: string; count?: number; hp?: number; ac?: number }>;
    difficulty?: string;
    [key: string]: unknown;
  };
  soul?: {
    read_aloud?: string;
    [key: string]: unknown;
  };
  brain?: {
    motivation?: string;
    purpose?: string;
    tactics?: string;
    secrets?: string;
    [key: string]: unknown;
  };
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  npc: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/20' },
  player: { icon: Users, color: 'text-green-400', bg: 'bg-green-900/20' },
  creature: { icon: Skull, color: 'text-red-400', bg: 'bg-red-900/20' },
  location: { icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  item: { icon: Package, color: 'text-amber-400', bg: 'bg-amber-900/20' },
  faction: { icon: Flag, color: 'text-purple-400', bg: 'bg-purple-900/20' },
  quest: { icon: Scroll, color: 'text-teal-400', bg: 'bg-teal-900/20' },
  encounter: { icon: Swords, color: 'text-orange-400', bg: 'bg-orange-900/20' },
};

export function EntityQuickView({
  entity,
  isOpen,
  onClose,
  campaignId,
  isCombatActive,
  onAddToCombat
}: EntityQuickViewProps) {
  if (!entity) return null;

  const config = TYPE_CONFIG[entity.entity_type] || TYPE_CONFIG.npc;
  const Icon = config.icon;

  const mechanics = entity.mechanics || {};
  const soul = entity.soul || {};
  const brain = entity.brain || {};

  const handleAddToCombat = () => {
    onAddToCombat?.(entity);
    onClose();
  };

  const handleRunEncounter = () => {
    window.dispatchEvent(new CustomEvent('run-encounter', {
      detail: { encounterId: entity.id, encounterName: entity.name }
    }));
    onClose();
  };

  // Get ability modifier
  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className={`p-4 ${config.bg} border-b border-slate-700`}>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <span className="truncate">{entity.name}</span>
            </DialogTitle>
            {/* Visibility Toggle for revealable entities */}
            {['npc', 'location', 'faction', 'item'].includes(entity.entity_type) && (
              <EntityVisibilityToggle
                entityId={entity.id}
                campaignId={campaignId}
                entityName={entity.name}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-slate-600 text-xs">
              {entity.entity_type}
            </Badge>
            {entity.sub_type && (
              <Badge variant="outline" className="border-slate-600 text-xs">
                {entity.sub_type}
              </Badge>
            )}
            {mechanics.cr && (
              <Badge className="bg-red-900/50 text-red-300 text-xs">
                CR {mechanics.cr}
              </Badge>
            )}
            {mechanics.difficulty && (
              <Badge className="bg-orange-900/50 text-orange-300 text-xs">
                {mechanics.difficulty}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 py-4">
            {/* Summary */}
            {entity.summary && (
              <p className="text-slate-300">{entity.summary}</p>
            )}

            {/* Quick Stats (for creatures/NPCs) */}
            {(mechanics.hp || mechanics.hp_max || mechanics.ac) && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                {(mechanics.hp || mechanics.hp_max) && (
                  <div className="flex items-center gap-1 text-sm">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-white font-medium">{mechanics.hp_max || mechanics.hp}</span>
                    <span className="text-slate-500">HP</span>
                  </div>
                )}
                {mechanics.ac && (
                  <div className="flex items-center gap-1 text-sm">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">{mechanics.ac}</span>
                    <span className="text-slate-500">AC</span>
                  </div>
                )}
                {mechanics.speed && (
                  <div className="flex items-center gap-1 text-sm">
                    <Footprints className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium">
                      {typeof mechanics.speed === 'object' ? mechanics.speed.walk : mechanics.speed}
                    </span>
                    <span className="text-slate-500">ft</span>
                  </div>
                )}
              </div>
            )}

            {/* Ability Scores */}
            {mechanics.abilities && (
              <div className="grid grid-cols-6 gap-1">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ability => {
                  const score = mechanics.abilities?.[ability] || 10;
                  return (
                    <div key={ability} className="text-center p-2 bg-slate-800 rounded">
                      <p className="text-xs text-slate-500 uppercase">{ability}</p>
                      <p className="font-bold text-white">{score}</p>
                      <p className="text-xs text-slate-400">{getMod(score)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Encounter Creatures */}
            {entity.entity_type === 'encounter' && mechanics.creatures && mechanics.creatures.length > 0 && (
              <div>
                <p className="text-xs text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Skull className="w-3 h-3" />
                  Creatures
                </p>
                <div className="space-y-1">
                  {mechanics.creatures.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                      <span className="text-slate-300">
                        {c.count && c.count > 1 ? `${c.count}× ` : ''}{c.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {c.hp && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            {c.hp}
                          </span>
                        )}
                        {c.ac && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            {c.ac}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Read Aloud */}
            {soul.read_aloud && (
              <div className="bg-teal-900/20 border-l-4 border-teal-500 p-3 rounded-r">
                <p className="text-xs text-teal-400 mb-1">📖 Read Aloud</p>
                <p className="italic text-slate-300 text-sm">{soul.read_aloud}</p>
              </div>
            )}

            {/* Motivation/Purpose */}
            {(brain.motivation || brain.purpose) && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {entity.entity_type === 'location' ? 'Purpose' : 'Motivation'}
                </p>
                <p className="text-slate-400 text-sm">{brain.motivation || brain.purpose}</p>
              </div>
            )}

            {/* Tactics */}
            {brain.tactics && (
              <div className="bg-amber-900/20 border border-amber-900/30 p-3 rounded">
                <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">⚔️ Combat Tactics</p>
                <p className="text-slate-400 text-sm">{brain.tactics}</p>
              </div>
            )}

            {/* Secrets */}
            {brain.secrets && (
              <div className="bg-purple-900/20 border border-purple-800/30 p-3 rounded">
                <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">🔒 Secret (DM Only)</p>
                <p className="text-slate-400 text-sm">{brain.secrets}</p>
              </div>
            )}

            {/* Actions Preview */}
            {mechanics.actions && mechanics.actions.length > 0 && (
              <div>
                <p className="text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Swords className="w-3 h-3" />
                  Actions
                </p>
                <div className="space-y-2">
                  {mechanics.actions.slice(0, 4).map((action, i) => (
                    <div key={i} className="p-2 bg-red-900/20 border border-red-900/30 rounded">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-red-300 text-sm">{action.name}</p>
                        {action.attack_bonus !== undefined && (
                          <Badge variant="outline" className="text-xs border-red-700 text-red-400">
                            +{action.attack_bonus} to hit
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {action.desc || action.description}
                      </p>
                    </div>
                  ))}
                  {mechanics.actions.length > 4 && (
                    <p className="text-xs text-slate-500 text-center">
                      +{mechanics.actions.length - 4} more actions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Legendary Actions */}
            {mechanics.legendary_actions && mechanics.legendary_actions.length > 0 && (
              <div>
                <p className="text-xs text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Legendary Actions
                </p>
                <div className="space-y-2">
                  {mechanics.legendary_actions.map((action, i) => (
                    <div key={i} className="p-2 bg-purple-900/20 border border-purple-900/30 rounded">
                      <p className="font-medium text-purple-300 text-sm">{action.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {action.desc || action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex gap-2">
            {/* Run Encounter */}
            {entity.entity_type === 'encounter' && (
              <Button
                onClick={handleRunEncounter}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Encounter
              </Button>
            )}

            {/* Add to Combat */}
            {isCombatActive && ['npc', 'creature', 'player'].includes(entity.entity_type) && (
              <Button
                onClick={handleAddToCombat}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Combat
              </Button>
            )}
          </div>

          {/* View Full Details */}
          <Link
            href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}
            target="_blank"
            className="block"
          >
            <Button variant="outline" className="w-full border-slate-600">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
