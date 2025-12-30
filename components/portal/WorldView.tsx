'use client';

import { useState } from 'react';
import { Globe, MapPin, Users, Shield, Star, Search, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Entity {
  id: string;
  name: string;
  type: string;
  sub_type: string | null;
  description: string | null;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
  image_url: string | null;
}

interface Discovery {
  id: string;
  discovered_at: string;
  personal_notes: string | null;
  is_favorite: boolean;
  entity: Entity;
}

interface Props {
  campaignId: string;
  userId: string;
  initialDiscoveries: Discovery[];
}

type EntityType = 'all' | 'location' | 'npc' | 'faction';

const typeConfig = {
  location: { icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Locations' },
  npc: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'NPCs' },
  faction: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Factions' },
};

export function WorldView({ initialDiscoveries }: Props) {
  const [discoveries, setDiscoveries] = useState<Discovery[]>(initialDiscoveries);
  const [activeType, setActiveType] = useState<EntityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  // Filter discoveries
  const filteredDiscoveries = discoveries.filter(d => {
    const matchesType = activeType === 'all' || d.entity.type === activeType;
    const matchesSearch = !searchQuery ||
      d.entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.entity.sub_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Count by type
  const counts = {
    all: discoveries.length,
    location: discoveries.filter(d => d.entity.type === 'location').length,
    npc: discoveries.filter(d => d.entity.type === 'npc').length,
    faction: discoveries.filter(d => d.entity.type === 'faction').length,
  };

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const res = await fetch('/api/portal/world', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFavorite: !currentFavorite }),
    });

    if (res.ok) {
      setDiscoveries(prev => {
        const updated = prev.map(d => d.id === id ? { ...d, is_favorite: !currentFavorite } : d);
        return updated.sort((a, b) => {
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
        });
      });
    }
  };

  const handleSaveNotes = async (id: string) => {
    const res = await fetch('/api/portal/world', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, personalNotes: notesValue }),
    });

    if (res.ok) {
      setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, personal_notes: notesValue } : d));
      setEditingNotesId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/10 px-4 py-4">
        <h1 className="text-xl font-display text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-400" />
          World
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Places, people, and factions you've discovered
        </p>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discoveries..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex border-b border-white/10 px-2">
        <button
          onClick={() => setActiveType('all')}
          className={cn(
            "flex-1 py-3 text-xs font-medium transition-colors",
            activeType === 'all'
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          All ({counts.all})
        </button>
        {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1",
                activeType === type
                  ? `${config.color} border-b-2 border-current`
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Icon className="w-3 h-3" />
              {counts[type]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredDiscoveries.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {searchQuery ? 'No matches found' : 'Nothing discovered yet'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? 'Try a different search' : 'Explore the world to uncover its secrets'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDiscoveries.map((discovery) => {
              const entity = discovery.entity;
              const config = typeConfig[entity.type as keyof typeof typeConfig];
              const TypeIcon = config?.icon || Globe;
              const isExpanded = expandedId === discovery.id;
              const isEditingNotes = editingNotesId === discovery.id;

              // Extract display info from soul
              const soul = entity.soul as Record<string, unknown> | null;
              const description = (soul?.description as string) || (soul?.appearance as string) || entity.description;
              const personality = soul?.personality as string | undefined;
              const goals = (soul?.goals as string) || (soul?.public_goals as string);

              return (
                <div
                  key={discovery.id}
                  className={cn(
                    "bg-slate-900/50 border rounded-xl overflow-hidden transition-colors",
                    discovery.is_favorite ? "border-amber-500/30" : "border-white/10"
                  )}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : discovery.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    {/* Image or Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                      config?.bg || "bg-slate-800"
                    )}>
                      {entity.image_url ? (
                        <img
                          src={entity.image_url}
                          alt={entity.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <TypeIcon className={cn("w-6 h-6", config?.color || "text-slate-400")} />
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        {discovery.is_favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        <h3 className="text-white font-medium truncate">{entity.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={config?.color}>{entity.sub_type || entity.type}</span>
                        <span>•</span>
                        <span>Found {formatDate(discovery.discovered_at)}</span>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-slate-500 transition-transform flex-shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                      {/* Description */}
                      {description && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Description</h4>
                          <p className="text-slate-300 text-sm">{description}</p>
                        </div>
                      )}

                      {/* Personality (for NPCs) */}
                      {personality && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Personality</h4>
                          <p className="text-slate-300 text-sm">{personality}</p>
                        </div>
                      )}

                      {/* Goals (for factions) */}
                      {goals && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Known Goals</h4>
                          <p className="text-slate-300 text-sm">{goals}</p>
                        </div>
                      )}

                      {/* Personal Notes */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Your Notes
                        </h4>

                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              rows={3}
                              placeholder="Add your own notes..."
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1 text-sm text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotes(discovery.id)}
                                className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setNotesValue(discovery.personal_notes || '');
                              setEditingNotesId(discovery.id);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 border border-white/5 text-sm hover:border-teal-500/30 transition-colors"
                          >
                            {discovery.personal_notes ? (
                              <p className="text-slate-300 whitespace-pre-wrap">{discovery.personal_notes}</p>
                            ) : (
                              <p className="text-slate-500 italic">Click to add notes...</p>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Favorite Toggle */}
                      <div className="pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleToggleFavorite(discovery.id, discovery.is_favorite)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                            discovery.is_favorite
                              ? "bg-amber-500/10 text-amber-400"
                              : "text-slate-400 hover:text-amber-400 hover:bg-white/5"
                          )}
                        >
                          <Star className={cn("w-4 h-4", discovery.is_favorite && "fill-amber-400")} />
                          {discovery.is_favorite ? 'Favorited' : 'Add to Favorites'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
