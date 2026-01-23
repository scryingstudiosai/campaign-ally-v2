'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ScrollText,
  Search,
  Check,
  MessageSquare,
  Loader2,
  Lock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// New rumors from the rumors table
interface Rumor {
  id: string;
  title: string | null;
  content: string;
  source_name: string | null;
  source_type: string | null;
  target_type: 'party' | 'player';
  skill_check: string | null;
  dc: number | null;
  created_at: string;
}

// Legacy rumors from entities table (for backward compatibility)
interface LegacyRumor {
  id: string;
  name: string;
  soul?: {
    common_knowledge?: string;
    folklore?: string;
  };
  mechanics?: {
    date_display?: string;
    shared_at?: string;
    investigated_by_players?: boolean;
    player_notes?: string;
  };
}

interface RumorsBoardProps {
  campaignId: string;
  playerId?: string;
  readonly?: boolean;
}

export function RumorsBoard({
  campaignId,
  playerId,
  readonly = false,
}: RumorsBoardProps) {
  const [rumors, setRumors] = useState<Rumor[]>([]);
  const [legacyRumors, setLegacyRumors] = useState<LegacyRumor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRumorId, setExpandedRumorId] = useState<string | null>(null);
  const [playerNote, setPlayerNote] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRumors();
  }, [campaignId]);

  const fetchRumors = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Fetch new rumors from rumors table
      const { data: newRumors, error: rumorsError } = await supabase
        .from('rumors')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (rumorsError) {
        console.error('Failed to fetch rumors:', rumorsError);
      } else {
        setRumors(newRumors || []);

        // Mark rumors as read
        if (userId && newRumors && newRumors.length > 0) {
          const rumorIds = newRumors.map((r) => r.id);
          await supabase.from('rumor_reads').upsert(
            rumorIds.map((rumorId) => ({
              rumor_id: rumorId,
              user_id: userId,
            })),
            { onConflict: 'rumor_id,user_id', ignoreDuplicates: true }
          );
        }
      }

      // Also fetch legacy rumors from entities table for backward compatibility
      const { data: legacyData, error: legacyError } = await supabase
        .from('entities')
        .select('id, name, soul, mechanics')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'event')
        .eq('sub_type', 'rumor')
        .not('mechanics->shared_with_players', 'is', null)
        .order('created_at', { ascending: false });

      if (legacyError) {
        console.error('Failed to fetch legacy rumors:', legacyError);
      } else {
        // Filter to only show rumors that are actually shared
        const sharedRumors = (legacyData || []).filter(
          (r) => r.mechanics?.shared_with_players === true
        );
        setLegacyRumors(sharedRumors);
      }
    } catch (error) {
      console.error('Failed to fetch rumors:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsInvestigated = async (rumorId: string) => {
    setMarkingId(rumorId);
    try {
      const rumor = legacyRumors.find((r) => r.id === rumorId);
      if (!rumor) return;

      const { error } = await supabase
        .from('entities')
        .update({
          mechanics: {
            ...rumor.mechanics,
            investigated_by_players: true,
          },
        })
        .eq('id', rumorId);

      if (error) throw error;

      setLegacyRumors((prev) =>
        prev.map((r) =>
          r.id === rumorId
            ? { ...r, mechanics: { ...r.mechanics, investigated_by_players: true } }
            : r
        )
      );

      toast.success('Marked as investigated!');
    } catch (error) {
      console.error('Failed to mark rumor:', error);
      toast.error('Failed to update');
    } finally {
      setMarkingId(null);
    }
  };

  const savePlayerNote = async (rumorId: string) => {
    if (!playerNote.trim()) return;

    setSavingNoteId(rumorId);
    try {
      const rumor = legacyRumors.find((r) => r.id === rumorId);
      if (!rumor) return;

      const { error } = await supabase
        .from('entities')
        .update({
          mechanics: {
            ...rumor.mechanics,
            player_notes: playerNote,
          },
        })
        .eq('id', rumorId);

      if (error) throw error;

      setLegacyRumors((prev) =>
        prev.map((r) =>
          r.id === rumorId
            ? { ...r, mechanics: { ...r.mechanics, player_notes: playerNote } }
            : r
        )
      );

      setPlayerNote('');
      setExpandedRumorId(null);
      toast.success('Note saved!');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setSavingNoteId(null);
    }
  };

  // Filter both new and legacy rumors
  const filteredRumors = searchQuery
    ? rumors.filter(
        (r) =>
          r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rumors;

  const filteredLegacyRumors = searchQuery
    ? legacyRumors.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.soul?.common_knowledge?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : legacyRumors;

  const totalCount = filteredRumors.length + filteredLegacyRumors.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <ScrollText className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Rumors Board</h2>
          <p className="text-sm text-slate-400">
            Whispers and tales from taverns and streets
          </p>
        </div>
      </div>

      {/* Search */}
      {totalCount > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search rumors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50"
          />
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-lg">
          <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No rumors posted yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Check back later for news and whispers
          </p>
        </div>
      )}

      {/* New Rumors (from rumors table) */}
      {filteredRumors.length > 0 && (
        <div className="grid gap-4">
          {filteredRumors.map((rumor) => (
            <div
              key={rumor.id}
              className="relative overflow-hidden rounded-lg border bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 transition-all"
            >
              {/* Pin decoration */}
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-500/50 shadow-lg" />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📜</span>
                  <div className="flex-1 min-w-0">
                    {/* Target badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {rumor.target_type === 'player' ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Private - For Your Eyes Only
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Party
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {rumor.title && (
                      <h3 className="font-semibold text-amber-200 mb-2">
                        {rumor.title}
                      </h3>
                    )}

                    {/* Content */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {rumor.content}
                    </p>

                    {/* Skill check info */}
                    {rumor.skill_check && rumor.dc && (
                      <p className="text-xs text-slate-500 mt-2">
                        {rumor.skill_check} DC {rumor.dc}
                      </p>
                    )}

                    {/* Source */}
                    {rumor.source_name && (
                      <p className="text-xs text-slate-600 mt-2">
                        Source: {rumor.source_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date footer */}
              <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800">
                <p className="text-[10px] text-slate-500">
                  Posted {new Date(rumor.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy Rumors (from entities table) */}
      {filteredLegacyRumors.length > 0 && (
        <div className="grid gap-4">
          {filteredRumors.length > 0 && filteredLegacyRumors.length > 0 && (
            <div className="text-xs text-slate-500 uppercase tracking-wider py-2">
              Older Rumors
            </div>
          )}
          {filteredLegacyRumors.map((rumor) => {
            const isExpanded = expandedRumorId === rumor.id;
            const isInvestigated = rumor.mechanics?.investigated_by_players;

            return (
              <div
                key={rumor.id}
                className={`relative overflow-hidden rounded-lg border transition-all ${
                  isInvestigated
                    ? 'bg-slate-900/30 border-slate-700'
                    : 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                {/* Pin decoration */}
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-500/50 shadow-lg" />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🍺</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-semibold ${
                            isInvestigated ? 'text-slate-400' : 'text-amber-200'
                          }`}
                        >
                          {rumor.name}
                        </h3>
                        {isInvestigated && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Investigated
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-sm leading-relaxed ${
                          isInvestigated ? 'text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {rumor.soul?.folklore || rumor.soul?.common_knowledge}
                      </p>

                      {/* Player notes display */}
                      {rumor.mechanics?.player_notes && (
                        <div className="mt-3 p-2 bg-slate-800/50 rounded text-sm">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Party Notes
                          </p>
                          <p className="text-slate-400 italic">
                            {rumor.mechanics.player_notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {!readonly && (
                        <div className="mt-3 flex items-center gap-2">
                          {!isInvestigated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsInvestigated(rumor.id)}
                              disabled={markingId === rumor.id}
                              className="h-7 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              {markingId === rumor.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark Investigated
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpandedRumorId(isExpanded ? null : rumor.id);
                              setPlayerNote(rumor.mechanics?.player_notes || '');
                            }}
                            className="h-7 text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {rumor.mechanics?.player_notes ? 'Edit Note' : 'Add Note'}
                          </Button>
                        </div>
                      )}

                      {/* Note Input */}
                      {isExpanded && !readonly && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Add party notes about this rumor..."
                            value={playerNote}
                            onChange={(e) => setPlayerNote(e.target.value)}
                            className="bg-slate-800/50 text-sm min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedRumorId(null)}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => savePlayerNote(rumor.id)}
                              disabled={savingNoteId === rumor.id || !playerNote.trim()}
                              className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black"
                            >
                              {savingNoteId === rumor.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Save Note'
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date footer */}
                {rumor.mechanics?.shared_at && (
                  <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500">
                      Posted {new Date(rumor.mechanics.shared_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
