'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { EntityTypeBadge } from '@/components/memory/entity-type-badge';
import { EventConnectionsPanel } from './EventConnectionsPanel';
import { AddConnectionModal } from './AddConnectionModal';
import { EVENT_SUB_TYPES, LoreDrop, EventSoul, EventBrain, EventMechanics } from '@/types/event';
import { toast } from 'sonner';

interface EventDetailDrawerProps {
  event: {
    id: string;
    name: string;
    entity_type: 'event';
    sub_type: string;
    event_era?: string | null;
    event_sort?: number;
    event_ongoing?: boolean;
    soul?: EventSoul;
    brain?: EventBrain;
    mechanics?: EventMechanics;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function EventDetailDrawer({
  event,
  isOpen,
  onClose,
  campaignId,
  onDeleted,
  onUpdated,
}: EventDetailDrawerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showBrain, setShowBrain] = useState(true);
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);

  if (!event) return null;

  const subTypeInfo = EVENT_SUB_TYPES.find(t => t.value === event.sub_type);

  const handleCopyDrop = async (drop: LoreDrop) => {
    try {
      await navigator.clipboard.writeText(drop.text);
      setCopiedDropId(drop.id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedDropId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('entities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', event.id);

      if (error) throw error;

      toast.success('Event deleted');
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/campaigns/${campaignId}/memory/${event.id}/edit`);
    onClose();
  };

  const handleOpenInForge = () => {
    router.push(`/dashboard/campaigns/${campaignId}/forge/lore?eventId=${event.id}`);
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[500px] p-0 bg-slate-900 border-slate-800"
        >
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Header */}
              <SheetHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <EntityTypeBadge type="event" size="sm" />
                      {subTypeInfo && (
                        <span className="text-xs text-slate-500">
                          {subTypeInfo.icon} {subTypeInfo.label}
                        </span>
                      )}
                    </div>
                    <SheetTitle className="text-xl text-slate-100">
                      {event.name}
                    </SheetTitle>
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  {event.event_era && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_era}
                    </span>
                  )}
                  {event.mechanics?.date_display && (
                    <span className="px-2 py-0.5 bg-slate-800 rounded">
                      {event.mechanics.date_display}
                    </span>
                  )}
                  {event.event_ongoing && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                      Ongoing
                    </span>
                  )}
                </div>
              </SheetHeader>

              {/* Soul - Player-facing knowledge */}
              {event.soul && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    What People Know
                  </h3>

                  <Tabs defaultValue="common" className="w-full">
                    <TabsList className="w-full bg-slate-800">
                      <TabsTrigger value="common" className="flex-1 text-xs">
                        Common Knowledge
                      </TabsTrigger>
                      <TabsTrigger value="scholarly" className="flex-1 text-xs">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Scholarly
                      </TabsTrigger>
                      <TabsTrigger value="folklore" className="flex-1 text-xs">
                        Folklore
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="common" className="mt-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 leading-relaxed">
                        {event.soul.common_knowledge || 'No common knowledge recorded.'}
                      </div>
                    </TabsContent>

                    <TabsContent value="scholarly" className="mt-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 leading-relaxed">
                        {event.soul.scholarly_account || 'No scholarly account recorded.'}
                      </div>
                    </TabsContent>

                    <TabsContent value="folklore" className="mt-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 leading-relaxed italic">
                        {event.soul.folklore || 'No folklore recorded.'}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {event.soul.propaganda && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400 font-medium mb-1">
                        Official Narrative
                      </p>
                      <p className="text-sm text-slate-300 italic">
                        {event.soul.propaganda}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Brain - DM-only truth */}
              {event.brain && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBrain(!showBrain)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      {showBrain ? (
                        <Eye className="w-4 h-4 text-purple-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      )}
                      DM Truth
                    </span>
                    <span className="text-xs text-slate-500">
                      {showBrain ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {showBrain && (
                    <div className="space-y-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                      {event.brain.true_history && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium mb-1">
                            True History
                          </p>
                          <p className="text-sm text-slate-300">
                            {event.brain.true_history}
                          </p>
                        </div>
                      )}

                      {event.brain.hidden_causes && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium mb-1">
                            Hidden Causes
                          </p>
                          <p className="text-sm text-slate-300">
                            {event.brain.hidden_causes}
                          </p>
                        </div>
                      )}

                      {event.brain.secrets && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium mb-1">
                            Secrets
                          </p>
                          <p className="text-sm text-slate-300">
                            {event.brain.secrets}
                          </p>
                        </div>
                      )}

                      {event.brain.consequences && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium mb-1">
                            Consequences
                          </p>
                          <p className="text-sm text-slate-300">
                            {event.brain.consequences}
                          </p>
                        </div>
                      )}

                      {event.brain.hooks && event.brain.hooks.length > 0 && (
                        <div>
                          <p className="text-xs text-purple-400 font-medium mb-1">
                            Plot Hooks
                          </p>
                          <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                            {event.brain.hooks.map((hook, i) => (
                              <li key={i}>{hook}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lore Drops */}
              {event.mechanics?.lore_drops && event.mechanics.lore_drops.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Lore Drops
                    <span className="text-xs text-slate-500">
                      ({event.mechanics.lore_drops.length})
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {event.mechanics.lore_drops.map((drop) => (
                      <div
                        key={drop.id}
                        className={`p-3 rounded-lg border ${
                          drop.used
                            ? 'bg-slate-800/30 border-slate-700 opacity-60'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">
                            {drop.trigger}
                          </span>
                          <div className="flex items-center gap-2">
                            {drop.dc && (
                              <span className="text-xs px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded">
                                DC {drop.dc}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-600">
                              {drop.delivery}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm text-slate-300 italic">
                            "{drop.text}"
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyDrop(drop)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            {copiedDropId === drop.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                          </Button>
                        </div>
                        {drop.used && (
                          <span className="text-[10px] text-slate-600 mt-1 block">
                            ✓ Revealed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connections Panel */}
              <EventConnectionsPanel
                eventId={event.id}
                eventName={event.name}
                campaignId={campaignId}
                onAddConnection={() => setShowAddConnection(true)}
              />

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInForge}
                  className="flex-1 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open in Forge
                </Button>
                {!showDeleteConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="w-full flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-300 flex-1">Delete this event?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-6 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-6 text-xs"
                    >
                      {deleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Add Connection Modal */}
      <AddConnectionModal
        open={showAddConnection}
        onOpenChange={setShowAddConnection}
        eventId={event.id}
        eventName={event.name}
        campaignId={campaignId}
        onSaved={onUpdated}
      />
    </>
  );
}
