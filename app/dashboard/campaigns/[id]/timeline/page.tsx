'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Scroll,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageTransition, StaggerContainer, StaggerItem, Expandable } from '@/components/ui/motion';
import { EVENT_SUB_TYPES, EventSubType, LoreDrop } from '@/types/event';
import { EventDetailDrawer } from '@/components/lore/EventDetailDrawer';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  name: string;
  entity_type: 'event';
  sub_type: EventSubType;
  event_sort: number;
  event_era: string | null;
  event_ongoing: boolean;
  soul?: {
    common_knowledge?: string;
    scholarly_account?: string;
    folklore?: string;
    propaganda?: string;
  };
  brain?: {
    true_history?: string;
    hidden_causes?: string;
    consequences?: string;
    secrets?: string;
    reveal_triggers?: string[];
    hooks?: string[];
  };
  mechanics?: {
    date_display?: string;
    duration?: string;
    affected_regions?: string[];
    current_evidence?: string;
    lore_drops?: LoreDrop[];
  };
  relationships?: {
    type: string;
    target_name: string;
    target_id: string;
    target_type: string;
  }[];
}

interface GroupedEvents {
  era: string;
  events: TimelineEvent[];
}

export default function TimelinePage() {
  const params = useParams();
  const campaignId = params?.id as string;
  const supabase = createClient();

  // Data state
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eraFilter, setEraFilter] = useState<string>('all');
  const [showDmOnly, setShowDmOnly] = useState(true);
  const [showOngoing, setShowOngoing] = useState(true);

  // UI state
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [collapsedEras, setCollapsedEras] = useState<Set<string>>(new Set());
  const [showConnections, setShowConnections] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Refs for connection line drawing
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, [campaignId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events
      const { data: eventData, error } = await supabase
        .from('entities')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'event')
        .order('event_sort', { ascending: true });

      if (error) throw error;

      // Fetch relationships for events
      const eventIds = eventData?.map(e => e.id) || [];

      if (eventIds.length > 0) {
        const { data: relationships } = await supabase
          .from('entity_relationships')
          .select(`
            id,
            source_entity_id,
            target_entity_id,
            relationship_type,
            target:target_entity_id(id, name, entity_type)
          `)
          .in('source_entity_id', eventIds);

        // Attach relationships to events
        const eventsWithRelationships = eventData?.map(event => ({
          ...event,
          relationships: relationships
            ?.filter(r => r.source_entity_id === event.id)
            ?.map(r => ({
              type: r.relationship_type,
              target_name: (r.target as unknown as { name: string })?.name,
              target_id: (r.target as unknown as { id: string })?.id,
              target_type: (r.target as unknown as { entity_type: string })?.entity_type,
            })) || [],
        }));

        setEvents(eventsWithRelationships || []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique eras for filter
  const uniqueEras = useMemo(() => {
    const eras = new Set(events.map(e => e.event_era).filter(Boolean) as string[]);
    return Array.from(eras).sort();
  }, [events]);

  // Filter and group events
  const groupedEvents = useMemo(() => {
    let filtered = events;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.soul?.common_knowledge?.toLowerCase().includes(query) ||
        e.mechanics?.date_display?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.sub_type === typeFilter);
    }

    // Era filter
    if (eraFilter !== 'all') {
      filtered = filtered.filter(e => e.event_era === eraFilter);
    }

    // Ongoing filter
    if (!showOngoing) {
      filtered = filtered.filter(e => !e.event_ongoing);
    }

    // Group by era
    const eraMap = new Map<string, TimelineEvent[]>();

    filtered.forEach(event => {
      const era = event.event_era || 'Undated';
      if (!eraMap.has(era)) {
        eraMap.set(era, []);
      }
      eraMap.get(era)!.push(event);
    });

    // Sort eras by the earliest event in each
    const sortedEras = Array.from(eraMap.entries()).sort((a, b) => {
      const aMin = Math.min(...a[1].map(e => e.event_sort || 0));
      const bMin = Math.min(...b[1].map(e => e.event_sort || 0));
      return aMin - bMin;
    });

    const groups: GroupedEvents[] = [];
    sortedEras.forEach(([era, events]) => {
      groups.push({
        era,
        events: events.sort((a, b) => (a.event_sort || 0) - (b.event_sort || 0)),
      });
    });

    return groups;
  }, [events, searchQuery, typeFilter, eraFilter, showOngoing]);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleEraCollapsed = (era: string) => {
    setCollapsedEras(prev => {
      const next = new Set(prev);
      if (next.has(era)) {
        next.delete(era);
      } else {
        next.add(era);
      }
      return next;
    });
  };

  const hasSecrets = (event: TimelineEvent) => {
    return event.brain?.secrets || event.brain?.true_history;
  };

  const getLoreDropCount = (event: TimelineEvent) => {
    return event.mechanics?.lore_drops?.length || 0;
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowDrawer(true);
  };

  const handleDrawerClose = () => {
    setShowDrawer(false);
    setSelectedEvent(null);
  };

  // Build connection pairs for visualization
  const connectionPairs = useMemo(() => {
    if (!showConnections) return [];

    const pairs: { sourceId: string; targetId: string; type: string }[] = [];
    const eventIds = new Set(events.map(e => e.id));

    events.forEach(event => {
      event.relationships?.forEach(rel => {
        // Only show connections to other events that are visible
        if (rel.target_type === 'event' && eventIds.has(rel.target_id)) {
          pairs.push({
            sourceId: event.id,
            targetId: rel.target_id,
            type: rel.type,
          });
        }
      });
    });

    return pairs;
  }, [events, showConnections]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Campaign Timeline</h1>
                <p className="text-slate-400">
                  {events.length} event{events.length !== 1 ? 's' : ''} across {uniqueEras.length} era{uniqueEras.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/campaigns/${campaignId}/forge/lore`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EVENT_SUB_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Era Filter */}
            <Select value={eraFilter} onValueChange={setEraFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50">
                <SelectValue placeholder="All Eras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Eras</SelectItem>
                {uniqueEras.map(era => (
                  <SelectItem key={era} value={era}>
                    {era}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Toggle Buttons */}
            <Button
              variant={showDmOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDmOnly(!showDmOnly)}
              className={showDmOnly ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
            >
              {showDmOnly ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              DM Info
            </Button>

            <Button
              variant={showOngoing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOngoing(!showOngoing)}
              className={showOngoing ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}
            >
              <Clock className="w-4 h-4 mr-1" />
              Ongoing
            </Button>

            <Button
              variant={showConnections ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className={showConnections ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
            >
              <LinkIcon className="w-4 h-4 mr-1" />
              Connections
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {groupedEvents.length === 0 ? (
            <div className="text-center py-12">
              <Scroll className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No events found</h3>
              <p className="text-slate-500 mb-4">
                {events.length === 0
                  ? "Start building your world's history"
                  : 'Try adjusting your filters'}
              </p>
              <Link href={`/dashboard/campaigns/${campaignId}/forge/lore`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {groupedEvents.map((group) => (
                <div key={group.era} className="mb-8">
                  {/* Era Header */}
                  <button
                    onClick={() => toggleEraCollapsed(group.era)}
                    className="w-full flex items-center gap-3 mb-4 group"
                  >
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                      {collapsedEras.has(group.era) ? (
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-amber-400 font-semibold uppercase tracking-wider text-sm">
                        {group.era}
                      </span>
                      <span className="text-amber-400/60 text-xs">
                        ({group.events.length})
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-amber-500/50 to-transparent" />
                  </button>

                  {/* Events in Era */}
                  <Expandable isOpen={!collapsedEras.has(group.era)}>
                    <div className="relative pl-8">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />

                      <StaggerContainer className="space-y-4">
                        {group.events.map((event) => {
                          const isExpanded = expandedEvents.has(event.id);
                          const typeInfo = EVENT_SUB_TYPES.find(t => t.value === event.sub_type);

                          return (
                            <StaggerItem key={event.id}>
                              <div className="relative">
                                {/* Timeline Node */}
                                <div className={`absolute -left-5 top-4 w-4 h-4 rounded-full border-2 ${
                                  event.event_ongoing
                                    ? 'bg-amber-500/50 border-amber-400 animate-pulse'
                                    : hasSecrets(event)
                                    ? 'bg-red-500/50 border-red-400'
                                    : 'bg-slate-700 border-slate-500'
                                }`}>
                                  {event.event_ongoing && (
                                    <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                                  )}
                                </div>

                                {/* Event Card */}
                                <div className={`bg-slate-900/50 border rounded-lg overflow-hidden transition-all ${
                                  isExpanded
                                    ? 'border-amber-500/50'
                                    : 'border-slate-800 hover:border-slate-700'
                                }`}>
                                  {/* Card Header */}
                                  <button
                                    onClick={() => toggleEventExpanded(event.id)}
                                    className="w-full p-4 text-left"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-lg">{typeInfo?.icon}</span>
                                          <h3 className="font-semibold text-slate-100">
                                            {event.name}
                                          </h3>
                                          {event.event_ongoing && (
                                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-medium">
                                              ONGOING
                                            </span>
                                          )}
                                          {hasSecrets(event) && showDmOnly && (
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                          <span>{event.mechanics?.date_display}</span>
                                          <span>•</span>
                                          <span className="capitalize">{typeInfo?.label}</span>
                                          {getLoreDropCount(event) > 0 && (
                                            <>
                                              <span>•</span>
                                              <span className="text-teal-400">
                                                {getLoreDropCount(event)} lore drop{getLoreDropCount(event) !== 1 ? 's' : ''}
                                              </span>
                                            </>
                                          )}
                                          {showConnections && event.relationships && event.relationships.length > 0 && (
                                            <>
                                              <span>•</span>
                                              <span className="text-purple-400 flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3" />
                                                {event.relationships.length}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`} />
                                    </div>

                                    {/* Preview */}
                                    {!isExpanded && (
                                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                                        {event.soul?.common_knowledge}
                                      </p>
                                    )}
                                  </button>

                                  {/* Expanded Content */}
                                  <Expandable isOpen={isExpanded}>
                                    <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
                                      {/* Common Knowledge */}
                                      <div>
                                        <h4 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                                          Common Knowledge
                                        </h4>
                                        <p className="text-slate-300 text-sm">
                                          {event.soul?.common_knowledge}
                                        </p>
                                      </div>

                                      {/* Scholarly Account */}
                                      {event.soul?.scholarly_account && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">
                                            Scholarly Account
                                          </h4>
                                          <p className="text-slate-300 text-sm">
                                            {event.soul.scholarly_account}
                                          </p>
                                        </div>
                                      )}

                                      {/* Folklore */}
                                      {event.soul?.folklore && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2">
                                            Folklore
                                          </h4>
                                          <p className="text-slate-300 text-sm italic">
                                            {event.soul.folklore}
                                          </p>
                                        </div>
                                      )}

                                      {/* DM Truth */}
                                      {showDmOnly && event.brain?.true_history && (
                                        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                          <h4 className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center gap-2">
                                            <EyeOff className="w-3 h-3" />
                                            DM Truth
                                          </h4>
                                          <p className="text-slate-300 text-sm">
                                            {event.brain.true_history}
                                          </p>
                                          {event.brain.consequences && (
                                            <p className="text-slate-400 text-sm mt-2">
                                              <strong className="text-red-400">Consequences:</strong> {event.brain.consequences}
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Lore Drops Preview */}
                                      {event.mechanics?.lore_drops && event.mechanics.lore_drops.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                                            Lore Drops
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {event.mechanics.lore_drops.slice(0, 3).map((drop: LoreDrop) => (
                                              <span
                                                key={drop.id}
                                                className={`px-2 py-1 rounded text-xs ${
                                                  drop.reveal_level === 'dm_truth'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : drop.reveal_level === 'partial'
                                                    ? 'bg-amber-500/10 text-amber-400'
                                                    : 'bg-slate-700 text-slate-300'
                                                }`}
                                              >
                                                {drop.trigger}
                                              </span>
                                            ))}
                                            {event.mechanics.lore_drops.length > 3 && (
                                              <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                                                +{event.mechanics.lore_drops.length - 3} more
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Relationships */}
                                      {event.relationships && event.relationships.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                                            Connections
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {event.relationships.map((rel, i) => (
                                              <Link
                                                key={i}
                                                href={`/dashboard/campaigns/${campaignId}/memory/${rel.target_id}`}
                                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
                                              >
                                                {rel.type}: {rel.target_name}
                                              </Link>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Current Evidence */}
                                      {event.mechanics?.current_evidence && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                                            Current Evidence
                                          </h4>
                                          <p className="text-slate-400 text-sm">
                                            {event.mechanics.current_evidence}
                                          </p>
                                        </div>
                                      )}

                                      {/* View Full Button */}
                                      <div className="pt-2 flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                          }}
                                        >
                                          Quick View
                                        </Button>
                                        <Link href={`/dashboard/campaigns/${campaignId}/memory/${event.id}`} className="flex-1">
                                          <Button variant="outline" size="sm" className="w-full">
                                            Full Details
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  </Expandable>
                                </div>
                              </div>
                            </StaggerItem>
                          );
                        })}
                      </StaggerContainer>
                    </div>
                  </Expandable>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent ? {
          id: selectedEvent.id,
          name: selectedEvent.name,
          entity_type: 'event',
          sub_type: selectedEvent.sub_type,
          event_era: selectedEvent.event_era,
          event_sort: selectedEvent.event_sort,
          event_ongoing: selectedEvent.event_ongoing,
          soul: selectedEvent.soul,
          brain: selectedEvent.brain,
          mechanics: selectedEvent.mechanics,
        } : null}
        isOpen={showDrawer}
        onClose={handleDrawerClose}
        campaignId={campaignId}
        onDeleted={fetchEvents}
        onUpdated={fetchEvents}
      />
    </PageTransition>
  );
}
