'use client';

import { useState } from 'react';
import {
  Users, MapPin, Package, Skull, Shield,
  Scroll, Swords, Sparkles, Crown, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Unified entity type colors - keep consistent across the app
// Colors: npc=blue, player=yellow, location=emerald, item=amber, creature=red,
//         faction=purple, quest=teal, encounter=orange, event=cyan, deity=violet
const ENTITY_OPTIONS = [
  { type: 'npc', label: 'NPC', icon: Users, color: 'text-blue-400 hover:bg-blue-500/20' },
  { type: 'location', label: 'Location', icon: MapPin, color: 'text-emerald-400 hover:bg-emerald-500/20' },
  { type: 'item', label: 'Item', icon: Package, color: 'text-amber-400 hover:bg-amber-500/20' },
  { type: 'creature', label: 'Creature', icon: Skull, color: 'text-red-400 hover:bg-red-500/20' },
  { type: 'faction', label: 'Faction', icon: Shield, color: 'text-purple-400 hover:bg-purple-500/20' },
  { type: 'quest', label: 'Quest', icon: Scroll, color: 'text-teal-400 hover:bg-teal-500/20' },
  { type: 'encounter', label: 'Encounter', icon: Swords, color: 'text-orange-400 hover:bg-orange-500/20' },
  { type: 'event', label: 'Lore', icon: Sparkles, color: 'text-cyan-400 hover:bg-cyan-500/20' },
  { type: 'deity', label: 'Deity', icon: Crown, color: 'text-violet-400 hover:bg-violet-500/20' },
] as const;

interface SessionPrepSelectionMenuProps {
  selectedText: string;
  position: { x: number; y: number };
  campaignId: string;
  sessionId: string;
  onClose: () => void;
  onEntityCreated?: (entity: { id: string; name: string; entity_type: string }) => void;
}

/**
 * Selection menu for creating entity stubs from highlighted text in Session Prep
 * Creates stubs directly in Memory (entities table)
 */
export function SessionPrepSelectionMenu({
  selectedText,
  position,
  campaignId,
  sessionId,
  onClose,
  onEntityCreated,
}: SessionPrepSelectionMenuProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [creatingType, setCreatingType] = useState<string | null>(null);

  const handleCreateStub = async (entityType: string) => {
    if (!selectedText.trim() || !campaignId) return;

    setIsCreating(true);
    setCreatingType(entityType);

    try {
      const supabase = createClient();

      // Create stub entity directly in Memory
      // Pattern matches lib/forge/entity-minter.ts createStubEntities()
      const { data: newEntity, error } = await supabase
        .from('entities')
        .insert({
          campaign_id: campaignId,
          name: selectedText.trim(),
          entity_type: entityType,
          summary: `Stub entity created from session prep`,
          status: 'active',
          importance_tier: 'background',
          visibility: 'dm_only',
          forge_status: 'stub',
          attributes: {
            is_stub: true,
            needs_review: true,
            source: 'session_prep',
            session_id: sessionId,
          },
        })
        .select('id, name, entity_type')
        .single();

      if (error) {
        console.error('Error creating entity stub:', error);
        toast.error('Failed to create entity');
        return;
      }

      if (newEntity) {
        toast.success(
          <div className="flex items-center gap-2">
            <span>Created &quot;{selectedText}&quot; as {entityType}</span>
          </div>,
          {
            description: 'Entity stub added to Memory. Flesh it out with AI later!',
          }
        );

        onEntityCreated?.({
          id: newEntity.id,
          name: newEntity.name,
          entity_type: newEntity.entity_type,
        });

        onClose();
      }
    } catch (err) {
      console.error('Error creating entity stub:', err);
      toast.error('Failed to create entity');
    } finally {
      setIsCreating(false);
      setCreatingType(null);
    }
  };

  return (
    <div
      className="selection-menu fixed z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-slate-400 truncate max-w-[150px]">
            Create from &quot;{selectedText.length > 20 ? selectedText.slice(0, 20) + '...' : selectedText}&quot;
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entity Type Grid */}
        <div className="grid grid-cols-3 gap-1">
          {ENTITY_OPTIONS.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => handleCreateStub(type)}
              disabled={isCreating}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded transition-colors',
                color,
                isCreating && creatingType !== type && 'opacity-50'
              )}
              title={`Create ${label} stub`}
            >
              {isCreating && creatingType === type ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>

        {/* Tip */}
        <p className="text-[10px] text-slate-500 mt-2 px-1 text-center">
          Creates a stub in Memory to flesh out later
        </p>
      </div>

      {/* Arrow pointing up to selection */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full">
        <div className="border-8 border-transparent border-b-slate-800" />
      </div>
    </div>
  );
}
