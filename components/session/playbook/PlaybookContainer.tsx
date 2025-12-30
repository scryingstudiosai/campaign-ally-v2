'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SceneBlock, EncounterBlock, QuestBlock, InfoBlock, AddBlockMenu } from './blocks';
import { LiveSpine } from '../LiveSpine';
import { Loader2 } from 'lucide-react';

interface PlaybookBlock {
  id: string;
  session_id: string;
  block_type: 'scene' | 'encounter' | 'quest' | 'info';
  title: string;
  content: any;
  sort_order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  parent_id?: string;
  started_at?: string;
  completed_at?: string;
}

interface PlaybookContainerProps {
  sessionId: string;
}

export function PlaybookContainer({ sessionId }: PlaybookContainerProps) {
  const [blocks, setBlocks] = useState<PlaybookBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the active block index (first block with status 'active', or -1 if none)
  const activeBlockIndex = useMemo(() => {
    const validBlocks = blocks.filter(b => b && b.id);
    return validBlocks.findIndex(b => b.status === 'active');
  }, [blocks]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch blocks on mount
  useEffect(() => {
    fetchBlocks();
  }, [sessionId]);

  const fetchBlocks = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/blocks`);
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not { blocks: [...] }
        const blocksArray = Array.isArray(data) ? data : (data.blocks || []);
        // Filter out any blocks without valid IDs
        setBlocks(blocksArray.filter((b: PlaybookBlock) => b && b.id));
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new block
  const handleAddBlock = async (type: 'scene' | 'encounter' | 'quest' | 'info') => {
    const defaultTitles: Record<string, string> = {
      scene: 'New Scene',
      encounter: 'New Encounter',
      quest: 'New Quest',
      info: 'New Note',
    };

    try {
      const response = await fetch(`/api/sessions/${sessionId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_type: type,
          title: defaultTitles[type],
          content: {},
          status: 'pending',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // API returns block directly, not { block: {...} }
        const newBlock = data.block || data;
        if (newBlock && newBlock.id) {
          setBlocks(prev => [...prev, newBlock]);
        }
      }
    } catch (error) {
      console.error('Failed to add block:', error);
    }
  };

  // Update a block
  const handleUpdateBlock = useCallback(async (blockId: string, updates: Partial<PlaybookBlock>) => {
    // Optimistic update
    setBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, ...updates, content: updates.content !== undefined ? updates.content : b.content } : b))
    );

    setSaving(true);
    try {
      await fetch(`/api/sessions/${sessionId}/blocks/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update block:', error);
      // Revert on error
      fetchBlocks();
    } finally {
      setSaving(false);
    }
  }, [sessionId]);

  // Delete a block
  const handleDeleteBlock = useCallback(async (blockId: string) => {
    // Optimistic delete
    setBlocks(prev => prev.filter(b => b.id !== blockId));

    try {
      await fetch(`/api/sessions/${sessionId}/blocks/${blockId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete block:', error);
      fetchBlocks();
    }
  }, [sessionId]);

  // Duplicate a block
  const handleDuplicateBlock = useCallback(async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_type: block.block_type,
          title: `${block.title} (Copy)`,
          content: block.content,
          status: 'pending',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // API returns block directly, not { block: {...} }
        const newBlock = data.block || data;
        if (newBlock && newBlock.id) {
          // Insert after the original
          const index = blocks.findIndex(b => b.id === blockId);
          const newBlocks = [...blocks];
          newBlocks.splice(index + 1, 0, newBlock);
          setBlocks(newBlocks);
        }
      }
    } catch (error) {
      console.error('Failed to duplicate block:', error);
    }
  }, [blocks, sessionId]);

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      setBlocks(newBlocks);

      // Save new order to server
      try {
        await fetch(`/api/sessions/${sessionId}/blocks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockIds: newBlocks.map(b => b.id),
          }),
        });
      } catch (error) {
        console.error('Failed to reorder blocks:', error);
        fetchBlocks();
      }
    }
  };

  // Handle running an encounter
  const handleRunEncounter = useCallback((encounterId: string, encounterName: string) => {
    // Dispatch event for SessionShell to handle
    window.dispatchEvent(new CustomEvent('run-encounter', {
      detail: { id: encounterId, name: encounterName }
    }));
  }, []);

  // Render a block based on its type
  const renderBlock = (block: PlaybookBlock) => {
    const commonProps = {
      block,
      onUpdate: (updates: any) => handleUpdateBlock(block.id, updates),
      onDelete: () => handleDeleteBlock(block.id),
      onDuplicate: () => handleDuplicateBlock(block.id),
    };

    switch (block.block_type) {
      case 'scene':
        return <SceneBlock key={block.id} {...commonProps} />;
      case 'encounter':
        return (
          <EncounterBlock
            key={block.id}
            {...commonProps}
            onRunEncounter={() => handleRunEncounter(block.id, block.title)}
          />
        );
      case 'quest':
        return <QuestBlock key={block.id} {...commonProps} />;
      case 'info':
        return <InfoBlock key={block.id} {...commonProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </div>
      )}

      {/* Blocks list with Live Spine */}
      <div className="flex-1 overflow-y-auto pb-4">
        {!blocks?.length ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No blocks yet. Add your first block to start planning.</p>
            <AddBlockMenu onAddBlock={handleAddBlock} />
          </div>
        ) : (
          <div className="relative pl-4" ref={containerRef}>
            {/* Live Spine - Active Block Indicator */}
            {activeBlockIndex >= 0 && (
              <LiveSpine
                activeIndex={activeBlockIndex}
                containerRef={containerRef}
              />
            )}

            {/* Blocks */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.filter(b => b && b.id).map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {blocks.filter(b => b && b.id).map(block => renderBlock(block))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Add block button at bottom */}
      {(blocks?.length ?? 0) > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <AddBlockMenu onAddBlock={handleAddBlock} />
        </div>
      )}
    </div>
  );
}
