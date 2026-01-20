'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Link as LinkIcon,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Users,
  Package,
  Calendar,
  Scroll,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expandable } from '@/components/ui/motion';
import { EntityTypeBadge } from '@/components/memory/entity-type-badge';
import { toast } from 'sonner';

interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description?: string;
  target?: {
    id: string;
    name: string;
    entity_type: string;
  };
  source?: {
    id: string;
    name: string;
    entity_type: string;
  };
}

interface EventConnectionsPanelProps {
  eventId: string;
  eventName: string;
  campaignId: string;
  onAddConnection?: () => void;
}

// Relationship type configuration for events
const RELATIONSHIP_GROUPS = [
  {
    key: 'caused_by',
    label: 'Caused By',
    icon: ArrowLeft,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Events or entities that led to this',
  },
  {
    key: 'led_to',
    label: 'Led To',
    icon: ArrowRight,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Consequences and outcomes',
  },
  {
    key: 'involved',
    label: 'Involved',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'NPCs and factions that participated',
  },
  {
    key: 'location_of',
    label: 'Locations',
    icon: MapPin,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    description: 'Where it happened or was affected',
  },
  {
    key: 'related_to',
    label: 'Related Items',
    icon: Package,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Artifacts and objects involved',
  },
];

export function EventConnectionsPanel({
  eventId,
  eventName,
  campaignId,
  onAddConnection,
}: EventConnectionsPanelProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['caused_by', 'led_to', 'involved'])
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRelationships();
  }, [eventId]);

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      // Fetch relationships where this event is the source
      const { data: outgoing, error: outError } = await supabase
        .from('relationships')
        .select(`
          id,
          source_entity_id,
          target_entity_id,
          relationship_type,
          description,
          target:target_id(id, name, entity_type)
        `)
        .eq('source_id', eventId);

      // Fetch relationships where this event is the target
      const { data: incoming, error: inError } = await supabase
        .from('relationships')
        .select(`
          id,
          source_entity_id,
          target_entity_id,
          relationship_type,
          description,
          source:source_id(id, name, entity_type)
        `)
        .eq('target_id', eventId);

      if (outError) console.error('Outgoing relationships error:', outError);
      if (inError) console.error('Incoming relationships error:', inError);

      // Combine and normalize
      const allRelationships: Relationship[] = [
        ...(outgoing || []).map(r => ({
          ...r,
          direction: 'outgoing' as const,
        })),
        ...(incoming || []).map(r => ({
          ...r,
          direction: 'incoming' as const,
          // Swap target to show the other entity
          target: r.source,
        })),
      ];

      setRelationships(allRelationships);
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const removeRelationship = async (relationshipId: string) => {
    setRemovingId(relationshipId);
    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      setRelationships(prev => prev.filter(r => r.id !== relationshipId));
      toast.success('Connection removed');
    } catch (error) {
      console.error('Failed to remove relationship:', error);
      toast.error('Failed to remove connection');
    } finally {
      setRemovingId(null);
    }
  };

  // Group relationships by type
  const groupedRelationships = RELATIONSHIP_GROUPS.map(group => ({
    ...group,
    relationships: relationships.filter(r => r.relationship_type === group.key),
  }));

  // Also include any relationships with types not in our predefined groups
  const knownTypes = new Set(RELATIONSHIP_GROUPS.map(g => g.key));
  const otherRelationships = relationships.filter(r => !knownTypes.has(r.relationship_type));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-amber-400" />
          Connections
          {relationships.length > 0 && (
            <span className="text-xs text-slate-500">({relationships.length})</span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddConnection}
          className="h-7 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Connection
        </Button>
      </div>

      {/* Empty state */}
      {relationships.length === 0 && (
        <div className="text-center py-6 bg-slate-900/30 border border-slate-800 rounded-lg">
          <LinkIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No connections yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Link this event to NPCs, locations, and other events
          </p>
        </div>
      )}

      {/* Grouped relationships */}
      {groupedRelationships.map(group => {
        if (group.relationships.length === 0) return null;

        const IconComponent = group.icon;
        const isExpanded = expandedGroups.has(group.key);

        return (
          <div
            key={group.key}
            className={`border rounded-lg overflow-hidden ${group.bgColor} border-opacity-30`}
            style={{ borderColor: `var(--${group.color.replace('text-', '')})` }}
          >
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${group.color}`} />
                <span className={`text-sm font-medium ${group.color}`}>{group.label}</span>
                <span className="text-xs text-slate-500">({group.relationships.length})</span>
              </div>
              {isExpanded ? (
                <ChevronDown className={`w-4 h-4 ${group.color}`} />
              ) : (
                <ChevronRight className={`w-4 h-4 ${group.color}`} />
              )}
            </button>

            <Expandable isOpen={isExpanded}>
              <div className="px-3 pb-3 space-y-2">
                {group.relationships.map(rel => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800"
                  >
                    <Link
                      href={`/dashboard/campaigns/${campaignId}/memory/${rel.target?.id}`}
                      className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      {rel.target && (
                        <EntityTypeBadge
                          type={rel.target.entity_type as 'npc' | 'location' | 'event' | 'item' | 'faction' | 'quest' | 'other'}
                          size="sm"
                        />
                      )}
                      <span className="text-sm text-slate-200 truncate">
                        {rel.target?.name}
                      </span>
                    </Link>
                    {rel.description && (
                      <span className="text-xs text-slate-500 italic mx-2 truncate max-w-[150px]">
                        {rel.description}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRelationship(rel.id)}
                      disabled={removingId === rel.id}
                      className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                    >
                      {removingId === rel.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </Expandable>
          </div>
        );
      })}

      {/* Other relationships (unknown types) */}
      {otherRelationships.length > 0 && (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleGroup('other')}
            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-400">Other</span>
              <span className="text-xs text-slate-500">({otherRelationships.length})</span>
            </div>
            {expandedGroups.has('other') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <Expandable isOpen={expandedGroups.has('other')}>
            <div className="px-3 pb-3 space-y-2">
              {otherRelationships.map(rel => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800"
                >
                  <Link
                    href={`/dashboard/campaigns/${campaignId}/memory/${rel.target?.id}`}
                    className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    {rel.target && (
                      <EntityTypeBadge
                        type={rel.target.entity_type as 'npc' | 'location' | 'event' | 'item' | 'faction' | 'quest' | 'other'}
                        size="sm"
                      />
                    )}
                    <span className="text-sm text-slate-200 truncate">
                      {rel.target?.name}
                    </span>
                  </Link>
                  <span className="text-xs text-slate-600 mx-2">
                    {rel.relationship_type}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelationship(rel.id)}
                    disabled={removingId === rel.id}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                  >
                    {removingId === rel.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </Expandable>
        </div>
      )}
    </div>
  );
}
