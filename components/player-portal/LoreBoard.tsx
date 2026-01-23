'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen,
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

// New lore items from the rumors table
interface LoreItem {
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

// Legacy lore from entities table (for backward compatibility)
interface LegacyLore {
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

interface LoreBoardProps {
  campaignId: string;
  playerId?: string;
  readonly?: boolean;
}

export function LoreBoard({
  campaignId,
  playerId,
  readonly = false,
}: LoreBoardProps) {
  const [loreItems, setLoreItems] = useState<LoreItem[]>([]);
  const [legacyLore, setLegacyLore] = useState<LegacyLore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLoreId, setExpandedLoreId] = useState<string | null>(null);
  const [playerNote, setPlayerNote] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchLore();
  }, [campaignId]);

  const fetchLore = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Fetch new lore from rumors table
      const { data: newLore, error: loreError } = await supabase
        .from('rumors')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (loreError) {
        console.error('Failed to fetch lore:', loreError);
      } else {
        setLoreItems(newLore || []);

        // Mark lore as read
        if (userId && newLore && newLore.length > 0) {
          const loreIds = newLore.map((r) => r.id);
          await supabase.from('rumor_reads').upsert(
            loreIds.map((loreId) => ({
              rumor_id: loreId,
              user_id: userId,
            })),
            { onConflict: 'rumor_id,user_id', ignoreDuplicates: true }
          );
        }
      }

      // Also fetch legacy lore from entities table for backward compatibility
      const { data: legacyData, error: legacyError } = await supabase
        .from('entities')
        .select('id, name, soul, mechanics')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'event')
        .eq('sub_type', 'rumor')
        .not('mechanics->shared_with_players', 'is', null)
        .order('created_at', { ascending: false });

      if (legacyError) {
        console.error('Failed to fetch legacy lore:', legacyError);
      } else {
        // Filter to only show lore that is actually shared
        const sharedLore = (legacyData || []).filter(
          (r) => r.mechanics?.shared_with_players === true
        );
        setLegacyLore(sharedLore);
      }
    } catch (error) {
      console.error('Failed to fetch lore:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsInvestigated = async (loreId: string) => {
    setMarkingId(loreId);
    try {
      const lore = legacyLore.find((r) => r.id === loreId);
      if (!lore) return;

      const { error } = await supabase
        .from('entities')
        .update({
          mechanics: {
            ...lore.mechanics,
            investigated_by_players: true,
          },
        })
        .eq('id', loreId);

      if (error) throw error;

      setLegacyLore((prev) =>
        prev.map((r) =>
          r.id === loreId
            ? { ...r, mechanics: { ...r.mechanics, investigated_by_players: true } }
            : r
        )
      );

      toast.success('Marked as investigated!');
    } catch (error) {
      console.error('Failed to mark lore:', error);
      toast.error('Failed to update');
    } finally {
      setMarkingId(null);
    }
  };

  const savePlayerNote = async (loreId: string) => {
    if (!playerNote.trim()) return;

    setSavingNoteId(loreId);
    try {
      const lore = legacyLore.find((r) => r.id === loreId);
      if (!lore) return;

      const { error } = await supabase
        .from('entities')
        .update({
          mechanics: {
            ...lore.mechanics,
            player_notes: playerNote,
          },
        })
        .eq('id', loreId);

      if (error) throw error;

      setLegacyLore((prev) =>
        prev.map((r) =>
          r.id === loreId
            ? { ...r, mechanics: { ...r.mechanics, player_notes: playerNote } }
            : r
        )
      );

      setPlayerNote('');
      setExpandedLoreId(null);
      toast.success('Note saved!');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setSavingNoteId(null);
    }
  };

  // Filter both new and legacy lore
  const filteredLore = searchQuery
    ? loreItems.filter(
        (r) =>
          r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : loreItems;

  const filteredLegacyLore = searchQuery
    ? legacyLore.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.soul?.common_knowledge?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : legacyLore;

  const totalCount = filteredLore.length + filteredLegacyLore.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <BookOpen className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Lore & Discoveries</h2>
          <p className="text-sm text-slate-400">
            Knowledge your character has learned
          </p>
        </div>
      </div>

      {/* Search */}
      {totalCount > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search lore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50"
          />
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-lg">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No lore discovered yet</p>
          <p className="text-sm text-slate-500 mt-1">
            As you explore the world, knowledge will appear here
          </p>
        </div>
      )}

      {/* New Lore (from rumors table) */}
      {filteredLore.length > 0 && (
        <div className="grid gap-4">
          {filteredLore.map((lore) => (
            <div
              key={lore.id}
              className="relative overflow-hidden rounded-lg border bg-purple-500/5 border-purple-500/30 hover:border-purple-500/50 transition-all"
            >
              {/* Decoration */}
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-purple-500/50 shadow-lg" />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📖</span>
                  <div className="flex-1 min-w-0">
                    {/* Target badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {lore.target_type === 'player' ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Private Knowledge
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Party
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {lore.title && (
                      <h3 className="font-semibold text-purple-200 mb-2">
                        {lore.title}
                      </h3>
                    )}

                    {/* Content */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {lore.content}
                    </p>

                    {/* Skill check info */}
                    {lore.skill_check && lore.dc && (
                      <p className="text-xs text-slate-500 mt-2">
                        {lore.skill_check} DC {lore.dc}
                      </p>
                    )}

                    {/* Source */}
                    {lore.source_name && (
                      <p className="text-xs text-slate-600 mt-2">
                        Source: {lore.source_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date footer */}
              <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800">
                <p className="text-[10px] text-slate-500">
                  Discovered {new Date(lore.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy Lore (from entities table) */}
      {filteredLegacyLore.length > 0 && (
        <div className="grid gap-4">
          {filteredLore.length > 0 && filteredLegacyLore.length > 0 && (
            <div className="text-xs text-slate-500 uppercase tracking-wider py-2">
              Earlier Discoveries
            </div>
          )}
          {filteredLegacyLore.map((lore) => {
            const isExpanded = expandedLoreId === lore.id;
            const isInvestigated = lore.mechanics?.investigated_by_players;

            return (
              <div
                key={lore.id}
                className={`relative overflow-hidden rounded-lg border transition-all ${
                  isInvestigated
                    ? 'bg-slate-900/30 border-slate-700'
                    : 'bg-purple-500/5 border-purple-500/30 hover:border-purple-500/50'
                }`}
              >
                {/* Decoration */}
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-purple-500/50 shadow-lg" />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📜</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-semibold ${
                            isInvestigated ? 'text-slate-400' : 'text-purple-200'
                          }`}
                        >
                          {lore.name}
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
                        {lore.soul?.folklore || lore.soul?.common_knowledge}
                      </p>

                      {/* Player notes display */}
                      {lore.mechanics?.player_notes && (
                        <div className="mt-3 p-2 bg-slate-800/50 rounded text-sm">
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Party Notes
                          </p>
                          <p className="text-slate-400 italic">
                            {lore.mechanics.player_notes}
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
                              onClick={() => markAsInvestigated(lore.id)}
                              disabled={markingId === lore.id}
                              className="h-7 text-xs text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                            >
                              {markingId === lore.id ? (
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
                              setExpandedLoreId(isExpanded ? null : lore.id);
                              setPlayerNote(lore.mechanics?.player_notes || '');
                            }}
                            className="h-7 text-xs"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {lore.mechanics?.player_notes ? 'Edit Note' : 'Add Note'}
                          </Button>
                        </div>
                      )}

                      {/* Note Input */}
                      {isExpanded && !readonly && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Add party notes about this discovery..."
                            value={playerNote}
                            onChange={(e) => setPlayerNote(e.target.value)}
                            className="bg-slate-800/50 text-sm min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLoreId(null)}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => savePlayerNote(lore.id)}
                              disabled={savingNoteId === lore.id || !playerNote.trim()}
                              className="h-7 text-xs bg-purple-500 hover:bg-purple-600 text-white"
                            >
                              {savingNoteId === lore.id ? (
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
                {lore.mechanics?.shared_at && (
                  <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500">
                      Discovered {new Date(lore.mechanics.shared_at).toLocaleDateString()}
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
