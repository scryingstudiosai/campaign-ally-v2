'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { DraggableEntity } from './DraggableEntity';
import { Search, Users, MapPin, Package, Skull, Flag, Sword, ChevronDown, ChevronRight } from 'lucide-react';

interface LibraryPanelProps {
  campaignId: string;
}

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
}

const typeLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  npc: { label: 'NPCs', icon: Users },
  location: { label: 'Locations', icon: MapPin },
  item: { label: 'Items', icon: Package },
  creature: { label: 'Creatures', icon: Skull },
  faction: { label: 'Factions', icon: Flag },
  quest: { label: 'Quests', icon: Sword },
};

export function LibraryPanel({ campaignId }: LibraryPanelProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['npc', 'location']));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch entities
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await fetch(`/api/entities?campaignId=${campaignId}`);
        if (response.ok) {
          const data = await response.json();
          setEntities(data);
        }
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      }
      setIsLoading(false);
    };
    fetchEntities();
  }, [campaignId]);

  // Filter entities by search
  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by type
  const groupedEntities = filteredEntities.reduce((acc, entity) => {
    const type = entity.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        Entity Library
      </h3>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search entities..."
          className="pl-8 h-8 bg-slate-800 border-slate-700 text-sm"
        />
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
        ) : Object.keys(groupedEntities).length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            {searchQuery ? 'No matching entities' : 'No entities yet'}
          </p>
        ) : (
          Object.entries(typeLabels).map(([type, { label, icon: Icon }]) => {
            const typeEntities = groupedEntities[type] || [];
            if (typeEntities.length === 0) return null;

            const isExpanded = expandedTypes.has(type);

            return (
              <div key={type}>
                <button
                  onClick={() => toggleType(type)}
                  className="flex items-center gap-2 w-full p-2 rounded hover:bg-slate-800/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-xs text-slate-500 ml-auto">{typeEntities.length}</span>
                </button>

                {isExpanded && (
                  <div className="ml-4 space-y-1 mt-1">
                    {typeEntities.map((entity) => (
                      <DraggableEntity key={entity.id} entity={entity} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-600 mt-2 text-center">
        Drag entities into your notes
      </p>
    </div>
  );
}
