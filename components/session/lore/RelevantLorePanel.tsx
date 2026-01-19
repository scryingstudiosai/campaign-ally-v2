'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Scroll,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Send,
  Loader2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expandable } from '@/components/ui/motion';
import { EVENT_SUB_TYPES, LoreDrop } from '@/types/event';
import { toast } from 'sonner';

interface RelevantEvent {
  id: string;
  name: string;
  sub_type: string;
  event_era?: string;
  soul?: {
    common_knowledge?: string;
    folklore?: string;
  };
  brain?: {
    true_history?: string;
    secrets?: string;
  };
  mechanics?: {
    date_display?: string;
    lore_drops?: LoreDrop[];
  };
}

interface RelevantLorePanelProps {
  campaignId: string;
  sessionId?: string;
  onInsertLoreDrop?: (text: string) => void;
}

export function RelevantLorePanel({
  campaignId,
  sessionId,
  onInsertLoreDrop,
}: RelevantLorePanelProps) {
  const [events, setEvents] = useState<RelevantEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['lore_drops', 'rumors', 'prophecies'])
  );
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null);
  const [pushingRumorId, setPushingRumorId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRelevantLore();
  }, [campaignId]);

  const fetchRelevantLore = async () => {
    setLoading(true);
    try {
      // Fetch all events for the campaign
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, sub_type, event_era, soul, brain, mechanics')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'event')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch lore:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyLoreDrop = (drop: LoreDrop) => {
    const text = `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`;
    navigator.clipboard.writeText(text);
    setCopiedDropId(drop.id);
    setTimeout(() => setCopiedDropId(null), 2000);
    toast.success('Lore drop copied!');
  };

  const insertLoreDrop = (drop: LoreDrop) => {
    if (onInsertLoreDrop) {
      const text = `**${drop.trigger}** (${drop.delivery}): "${drop.text}"`;
      onInsertLoreDrop(text);
      toast.success('Added to session notes!');
    }
  };

  const pushRumorToPortal = async (event: RelevantEvent) => {
    setPushingRumorId(event.id);
    try {
      // Update the event to mark it as shared
      const { error } = await supabase
        .from('entities')
        .update({
          mechanics: {
            ...event.mechanics,
            shared_with_players: true,
            shared_at: new Date().toISOString(),
          },
        })
        .eq('id', event.id);

      if (error) throw error;

      // Update local state
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, mechanics: { ...e.mechanics, shared_with_players: true } }
            : e
        )
      );

      toast.success('Rumor pushed to Player Portal!');
    } catch (error) {
      console.error('Failed to push rumor:', error);
      toast.error('Failed to push rumor');
    } finally {
      setPushingRumorId(null);
    }
  };

  // Group events by type
  const loreDropEvents = events.filter(e => e.mechanics?.lore_drops?.length);
  const rumors = events.filter(e => e.sub_type === 'rumor');
  const prophecies = events.filter(e => e.sub_type === 'prophecy');

  const getEventIcon = (subType: string) => {
    return EVENT_SUB_TYPES.find(t => t.value === subType)?.icon || '📜';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No lore available</p>
        <p className="text-xs text-slate-600">Create events in the Lore Forge</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lore Drops Section */}
      {loreDropEvents.length > 0 && (
        <div className="border border-teal-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('lore_drops')}
            className="w-full flex items-center justify-between p-3 bg-teal-500/10 hover:bg-teal-500/15 transition-colors"
          >
            <h3 className="text-xs font-semibold text-teal-400 uppercase flex items-center gap-2">
              <span>🎯</span>
              Lore Drops
              <span className="text-teal-400/60">({loreDropEvents.length})</span>
            </h3>
            {expandedSections.has('lore_drops') ? (
              <ChevronDown className="w-4 h-4 text-teal-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-teal-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('lore_drops')}>
            <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
              {loreDropEvents.map(event => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <span>{getEventIcon(event.sub_type)}</span>
                    {event.name}
                  </p>
                  {event.mechanics?.lore_drops?.slice(0, 3).map(drop => (
                    <div
                      key={drop.id}
                      className={`p-2 rounded text-xs ${
                        drop.reveal_level === 'dm_truth'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : drop.reveal_level === 'partial'
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-slate-800/50 border border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-slate-400">
                          {drop.trigger} • {drop.delivery}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLoreDrop(drop)}
                            className="h-5 w-5 p-0"
                          >
                            {copiedDropId === drop.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          {onInsertLoreDrop && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => insertLoreDrop(drop)}
                              className="h-5 w-5 p-0 text-teal-400"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-300">"{drop.text}"</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Expandable>
        </div>
      )}

      {/* Rumors Section */}
      {rumors.length > 0 && (
        <div className="border border-amber-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('rumors')}
            className="w-full flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/15 transition-colors"
          >
            <h3 className="text-xs font-semibold text-amber-400 uppercase flex items-center gap-2">
              <span>🍺</span>
              Rumors
              <span className="text-amber-400/60">({rumors.length})</span>
            </h3>
            {expandedSections.has('rumors') ? (
              <ChevronDown className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('rumors')}>
            <div className="p-3 space-y-2 max-h-[250px] overflow-y-auto">
              {rumors.map(rumor => {
                const isShared = rumor.mechanics?.shared_with_players;
                return (
                  <div
                    key={rumor.id}
                    className={`p-2 rounded border text-xs ${
                      isShared
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-200 mb-1">{rumor.name}</p>
                        <p className="text-slate-400 line-clamp-2">
                          {rumor.soul?.common_knowledge}
                        </p>
                      </div>
                      {!isShared && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pushRumorToPortal(rumor)}
                          disabled={pushingRumorId === rumor.id}
                          className="h-6 text-[10px] text-amber-400 border-amber-500/30"
                        >
                          {pushingRumorId === rumor.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-1" />
                              Push
                            </>
                          )}
                        </Button>
                      )}
                      {isShared && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Expandable>
        </div>
      )}

      {/* Prophecies Section */}
      {prophecies.length > 0 && (
        <div className="border border-purple-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('prophecies')}
            className="w-full flex items-center justify-between p-3 bg-purple-500/10 hover:bg-purple-500/15 transition-colors"
          >
            <h3 className="text-xs font-semibold text-purple-400 uppercase flex items-center gap-2">
              <span>🔮</span>
              Prophecies
              <span className="text-purple-400/60">({prophecies.length})</span>
            </h3>
            {expandedSections.has('prophecies') ? (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-purple-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('prophecies')}>
            <div className="p-3 space-y-2 max-h-[250px] overflow-y-auto">
              {prophecies.map(prophecy => (
                <div
                  key={prophecy.id}
                  className="p-2 rounded bg-slate-800/50 border border-slate-700 text-xs"
                >
                  <p className="font-medium text-slate-200 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-purple-400" />
                    {prophecy.name}
                  </p>
                  <p className="text-slate-400 italic line-clamp-3">
                    {prophecy.soul?.folklore || prophecy.soul?.common_knowledge}
                  </p>
                </div>
              ))}
            </div>
          </Expandable>
        </div>
      )}
    </div>
  );
}
