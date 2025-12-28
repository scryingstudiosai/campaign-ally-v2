'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Users, MapPin, Package, Skull, Flag, Sword } from 'lucide-react';
import Link from 'next/link';

interface EntityQuickViewProps {
  entityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

interface EntityData {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  description?: string;
  soul?: {
    read_aloud?: string;
    vivid_description?: string;
  };
  brain?: {
    motivation?: string;
    desire?: string;
    fear?: string;
  };
  mechanics?: {
    hp_max?: number;
    hp?: number;
    ac?: number;
    cr?: string;
  };
  read_aloud?: string;
  dm_slug?: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  npc: Users,
  player: Users,
  location: MapPin,
  item: Package,
  creature: Skull,
  faction: Flag,
  quest: Sword,
};

export function EntityQuickView({ entityId, isOpen, onClose, campaignId }: EntityQuickViewProps) {
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId && isOpen) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/entities/${entityId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch entity');
          return res.json();
        })
        .then(data => {
          setEntity(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch entity:', err);
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [entityId, isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setEntity(null);
      setError(null);
    }
  }, [isOpen]);

  const Icon = entity ? TYPE_ICONS[entity.entity_type] || Users : Users;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
            <Button variant="ghost" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : entity ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span>{entity.name}</span>
                </div>
                <Link
                  href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}
                  target="_blank"
                >
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Full View
                  </Button>
                </Link>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Entity Type Badge */}
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 capitalize">
                  {entity.entity_type}
                </span>
                {entity.sub_type && (
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 capitalize">
                    {entity.sub_type}
                  </span>
                )}
              </div>

              {/* DM Slug */}
              {entity.dm_slug && (
                <p className="text-sm text-slate-300 italic">{entity.dm_slug}</p>
              )}

              {/* Summary */}
              {entity.summary && (
                <p className="text-slate-300">{entity.summary}</p>
              )}

              {/* Read Aloud */}
              {(entity.read_aloud || entity.soul?.read_aloud) && (
                <div className="bg-slate-800/50 border-l-4 border-teal-500 p-4 rounded-r">
                  <p className="text-xs text-teal-400 mb-2">Read Aloud</p>
                  <p className="italic text-slate-300">
                    {entity.read_aloud || entity.soul?.read_aloud}
                  </p>
                </div>
              )}

              {/* Brain - Motivation/Desire */}
              {entity.brain && (entity.brain.motivation || entity.brain.desire) && (
                <div className="bg-slate-800/50 p-3 rounded">
                  <p className="text-xs text-amber-400 mb-1">Motivation</p>
                  <p className="text-slate-300">
                    {entity.brain.motivation || entity.brain.desire}
                  </p>
                </div>
              )}

              {/* Brain - Fear */}
              {entity.brain?.fear && (
                <div className="bg-slate-800/50 p-3 rounded">
                  <p className="text-xs text-red-400 mb-1">Fear</p>
                  <p className="text-slate-300">{entity.brain.fear}</p>
                </div>
              )}

              {/* Mechanics preview */}
              {entity.mechanics && (entity.mechanics.hp_max || entity.mechanics.ac || entity.mechanics.cr) && (
                <div className="bg-slate-800/50 p-3 rounded">
                  <p className="text-xs text-blue-400 mb-2">Quick Stats</p>
                  <div className="flex gap-4 text-sm text-slate-400">
                    {entity.mechanics.hp_max && (
                      <span>HP: {entity.mechanics.hp_max}</span>
                    )}
                    {entity.mechanics.ac && (
                      <span>AC: {entity.mechanics.ac}</span>
                    )}
                    {entity.mechanics.cr && (
                      <span>CR: {entity.mechanics.cr}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {entity.description && !entity.summary && (
                <div className="text-slate-400 text-sm">
                  {entity.description}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-center py-8">Entity not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
