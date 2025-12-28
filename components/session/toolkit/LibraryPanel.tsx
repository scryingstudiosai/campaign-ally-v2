'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DraggableEntity } from './DraggableEntity';
import { DraggableObjective } from './DraggableObjective';
import {
  Search, Users, MapPin, Package, Skull, Flag, Sword,
  ChevronDown, ChevronRight, Loader2, Swords
} from 'lucide-react';

interface LibraryPanelProps {
  campaignId: string;
  isCombatActive?: boolean;
  onAddToCombat?: (entity: Entity) => void;
}

interface QuestObjective {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

export interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  mechanics?: {
    objectives?: QuestObjective[];
    abilities?: { str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number };
    hp?: number;
    hp_max?: number;
    hp_current?: number;
    ac?: number;
    cr?: string;
    speed?: { walk?: number } | number;
    actions?: Array<{ name: string; desc?: string; description?: string; attack_bonus?: number; damage?: unknown[] }>;
    special_abilities?: Array<{ name: string; desc?: string; description?: string }>;
    legendary_actions?: Array<{ name: string; desc?: string; description?: string }>;
    saving_throws?: Record<string, number> | Array<{ name: string; value: number }>;
    skills?: Record<string, number>;
    damage_resistances?: string[];
    damage_immunities?: string[];
    condition_immunities?: string[];
    senses?: Record<string, number | string> | string;
    [key: string]: unknown;
  };
  brain?: {
    objectives?: QuestObjective[];
    tactics?: string;
    [key: string]: unknown;
  };
  soul?: Record<string, unknown>;
  attributes?: {
    objectives?: QuestObjective[];
  };
}

const typeLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  npc: { label: 'NPCs', icon: Users },
  location: { label: 'Locations', icon: MapPin },
  item: { label: 'Items', icon: Package },
  creature: { label: 'Creatures', icon: Skull },
  faction: { label: 'Factions', icon: Flag },
  quest: { label: 'Quests', icon: Sword },
};

// Combat-ready entity types
const COMBAT_TYPES = ['npc', 'creature', 'player'];

export function LibraryPanel({ campaignId, isCombatActive, onAddToCombat }: LibraryPanelProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['npc', 'quest']));
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch entities - include full data for quests
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        // Fetch basic entity list
        const response = await fetch(`/api/entities?campaignId=${campaignId}`);
        if (response.ok) {
          const basicEntities = await response.json();

          console.log('=== LIBRARY PANEL DEBUG ===');
          console.log('Basic entities:', basicEntities);

          // For quests, fetch full details to get objectives (case-insensitive)
          const entitiesWithDetails = await Promise.all(
            basicEntities.map(async (entity: Entity) => {
              if (entity.entity_type?.toLowerCase() === 'quest') {
                console.log('Fetching quest details for:', entity.name);
                const detailResponse = await fetch(`/api/entities/${entity.id}`);
                if (detailResponse.ok) {
                  const fullQuest = await detailResponse.json();
                  console.log('Quest full data:', fullQuest);
                  console.log('Quest objectives locations:', {
                    'mechanics.objectives': fullQuest.mechanics?.objectives,
                    'brain.objectives': fullQuest.brain?.objectives,
                    'attributes.objectives': fullQuest.attributes?.objectives,
                  });
                  return fullQuest;
                }
              }
              return entity;
            })
          );

          console.log('Entities with details:', entitiesWithDetails);
          setEntities(entitiesWithDetails);
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

  const toggleQuest = (questId: string) => {
    const newExpanded = new Set(expandedQuests);
    if (newExpanded.has(questId)) {
      newExpanded.delete(questId);
    } else {
      newExpanded.add(questId);
    }
    setExpandedQuests(newExpanded);
  };

  const getQuestObjectives = (quest: Entity): QuestObjective[] => {
    // Check all possible locations for objectives
    const objectives = quest.mechanics?.objectives
      || quest.brain?.objectives
      || quest.attributes?.objectives
      || [];

    console.log(`Quest "${quest.name}" objectives:`, objectives);
    return Array.isArray(objectives) ? objectives : [];
  };

  const canAddToCombat = (entity: Entity) => {
    return COMBAT_TYPES.includes(entity.entity_type?.toLowerCase()) || entity.mechanics?.ac;
  };

  const handleAddToCombat = (entity: Entity, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCombat?.(entity);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        Entity Library
        {isCombatActive && (
          <span className="ml-2 text-red-400">(Combat Mode)</span>
        )}
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
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
                      <div key={entity.id} className="group">
                        {/* The Entity itself */}
                        <div className="flex items-center">
                          {/* Expand button for quests */}
                          {entity.entity_type?.toLowerCase() === 'quest' && getQuestObjectives(entity).length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuest(entity.id);
                              }}
                              className="p-1 hover:bg-slate-700 rounded mr-1"
                            >
                              {expandedQuests.has(entity.id) ? (
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          )}
                          <div className="flex-1">
                            <DraggableEntity entity={entity} />
                          </div>

                          {/* Add to Combat button */}
                          {isCombatActive && canAddToCombat(entity) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleAddToCombat(entity, e)}
                              className="opacity-0 group-hover:opacity-100 h-6 px-2 text-xs bg-red-900/50 hover:bg-red-800 text-red-300 ml-1"
                              title="Add to Combat"
                            >
                              <Swords className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>

                        {/* Quest Objectives (nested) */}
                        {entity.entity_type?.toLowerCase() === 'quest' && expandedQuests.has(entity.id) && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-amber-800/50 pl-2">
                            {getQuestObjectives(entity).map((objective, index) => (
                              <DraggableObjective
                                key={objective.id || index}
                                objective={{
                                  id: objective.id || `${entity.id}-obj-${index}`,
                                  title: objective.title,
                                  description: objective.description,
                                  status: objective.status,
                                  questId: entity.id,
                                  questName: entity.name,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-600 mt-2 text-center">
        {isCombatActive
          ? 'Click "Add" to add NPCs/Creatures to combat'
          : 'Drag entities or objectives into your notes'
        }
      </p>
    </div>
  );
}
