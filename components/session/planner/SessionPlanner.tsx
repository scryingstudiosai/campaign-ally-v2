'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useDroppable } from '@dnd-kit/core';
import {
  EntityNode,
  ReadAloudNode,
  QuestObjectiveNode,
  EncounterNode,
  EntityMention,
  EntityLinkMark,
  NoteBlockNode,
  SceneBlockNode,
  EncounterBlockNode,
  QuestBlockNode,
  AiGenesisBlockNode,
} from './extensions';
import { EditorToolbar, FontSize } from './EditorToolbar';
import { PrepHelpDialog } from './PrepHelpDialog';
import { SessionPrepSelectionMenu } from './SessionPrepSelectionMenu';
import { EntityQuickView } from '@/components/session/EntityQuickView';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/components/settings/SettingsContext';
import { createClient } from '@/lib/supabase/client';
import { useTextSelection } from '@/hooks/useTextSelection';

// Entity data for quick view
interface QuickViewEntity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  mechanics?: Record<string, unknown>;
  soul?: Record<string, unknown>;
  brain?: Record<string, unknown>;
}

interface SessionPlannerProps {
  sessionId: string;
  initialContent: unknown;
  onContentChange?: (content: unknown) => void;
}

const FONT_SIZE_KEY = 'prep-font-size';
const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  sm: 'text-sm',      // 14px
  md: 'text-base',    // 16px
  lg: 'text-lg',      // 18px
};

export function SessionPlanner({ sessionId, initialContent, onContentChange }: SessionPlannerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showHelp, setShowHelp] = useState(false);
  const { markOnboardingComplete } = useSettingsContext();
  const hasMarkedOnboarding = useRef(false);

  // Entity quick view state
  const [quickViewEntity, setQuickViewEntity] = useState<QuickViewEntity | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Text selection for creating entity stubs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { selectedText, selectionPosition, clearSelection } = useTextSelection(editorContainerRef);

  // Get campaign ID from URL
  const getCampaignId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const pathParts = window.location.pathname.split('/');
    const campaignIndex = pathParts.indexOf('campaigns');
    return campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null;
  }, []);

  // Fetch and show entity quick view
  const handleEntityLinkClick = useCallback(async (entityId: string) => {
    const campaignId = getCampaignId();
    if (!entityId || !campaignId) return;

    try {
      const supabase = createClient();
      const { data: entity, error } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type, summary, mechanics, soul, brain')
        .eq('id', entityId)
        .single();

      if (error) {
        console.error('Error fetching entity:', error);
        return;
      }

      if (entity) {
        setQuickViewEntity(entity as QuickViewEntity);
        setIsQuickViewOpen(true);
      }
    } catch (err) {
      console.error('Error fetching entity for quick view:', err);
    }
  }, [getCampaignId]);

  // Load font size preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved && ['sm', 'md', 'lg'].includes(saved)) {
      setFontSize(saved as FontSize);
    }
  }, []);

  // Save font size preference to localStorage
  const handleFontSizeChange = useCallback((size: FontSize) => {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, size);
  }, []);

  // Setup droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: 'session-planner-editor',
  });

  // Debounced save function
  const saveContent = useCallback(async (content: unknown) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_content: content }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        onContentChange?.(content);

        // Mark onboarding complete on first successful save
        if (!hasMarkedOnboarding.current) {
          hasMarkedOnboarding.current = true;
          await markOnboardingComplete('use_session_prep');
        }
      }
    } catch (error) {
      console.error('Failed to save prep content:', error);
    }
    setIsSaving(false);
  }, [sessionId, onContentChange, markOnboardingComplete]);

  // Debounce helper
  const debouncedSave = useCallback((content: unknown) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveContent(content), 1500);
  }, [saveContent]);

  // Initialize Tiptap editor
  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start planning your session... Type @ to mention entities →',
      }),
      EntityNode,
      ReadAloudNode,
      QuestObjectiveNode,
      EncounterNode,
      EntityMention,
      EntityLinkMark,
      // Collapsible blocks
      NoteBlockNode,
      SceneBlockNode,
      EncounterBlockNode,
      QuestBlockNode,
      AiGenesisBlockNode,
    ],
    content: (initialContent as object) || { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handleClick: (view, pos, event) => {
        // Check if clicked on an entity link
        const target = event.target as HTMLElement;
        const entityLink = target.closest('[data-entity-link]');

        if (entityLink) {
          const entityId = entityLink.getAttribute('data-entity-id');
          if (entityId) {
            event.preventDefault();
            handleEntityLinkClick(entityId);
            return true;
          }
        }

        return false;
      },
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');

        // Debug logging
        console.log('Paste event:', {
          hasHtml: !!html,
          hasText: !!text,
          htmlPreview: html?.slice(0, 500),
        });

        // If there's no HTML, let Tiptap handle plain text normally
        if (!html) {
          return false;
        }

        // Check if the HTML contains our custom block wrapper types
        // These should only be preserved for intentional block copy/paste
        const hasBlockWrapper = html.includes('data-quest-block') ||
          html.includes('data-scene-block') ||
          html.includes('data-encounter-block') ||
          html.includes('data-note-block');

        // For internal copy/paste WITH block wrappers, let Tiptap handle it
        if (html.includes('data-pm-slice') && hasBlockWrapper) {
          console.log('Internal paste with block wrapper - allowing');
          return false;
        }

        // For ALL other HTML (external or internal without explicit blocks),
        // convert to plain text to prevent misinterpretation
        if (text) {
          console.log('Converting HTML to plain text');
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(text));
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON());
    },
  });

  // Insert entity when dropped
  const insertEntity = useCallback((entity: { id: string; name: string; entityType: string }) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'entityNode',
        attrs: {
          id: entity.id,
          name: entity.name,
          entityType: entity.entityType,
        },
      })
      .insertContent(' ') // Add space after entity
      .run();
  }, [editor]);

  // Insert quest objective when dropped
  const insertObjective = useCallback((objective: {
    id: string;
    title: string;
    description?: string;
    questId: string;
    questName: string;
  }) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'questObjective',
        attrs: {
          id: objective.id,
          title: objective.title,
          description: objective.description || '',
          questId: objective.questId,
          questName: objective.questName,
        },
      })
      .run();
  }, [editor]);

  // Insert encounter block when encounter entity is dropped
  // Inserts at the END of the document for predictable placement
  const insertEncounterBlock = useCallback((encounter: {
    id: string;
    name: string;
    creatures?: Array<{ name: string; count: number; cr?: string }>;
    difficulty?: string;
  }) => {
    if (!editor) return;

    // Move to end of document, then insert block
    const endPos = editor.state.doc.content.size;
    editor.chain()
      .focus()
      .setTextSelection(endPos)
      .insertEncounterBlock({
        title: encounter.name,
        entityId: encounter.id,
        difficulty: encounter.difficulty || 'medium',
        creatures: JSON.stringify(encounter.creatures || []),
      })
      .run();
  }, [editor]);

  // Insert quest block when quest entity is dropped
  // Inserts at the END of the document for predictable placement
  const insertQuestBlock = useCallback((quest: {
    id: string;
    name: string;
    objectives?: Array<{ id: string; text: string; completed?: boolean }>;
  }) => {
    if (!editor) return;

    const milestones = (quest.objectives || []).map(obj => ({
      id: obj.id || crypto.randomUUID(),
      text: obj.text,
      completed: obj.completed || false,
    }));

    // Move to end of document, then insert block
    const endPos = editor.state.doc.content.size;
    editor.chain()
      .focus()
      .setTextSelection(endPos)
      .insertQuestBlock({
        title: quest.name,
        entityId: quest.id,
        milestones: JSON.stringify(milestones),
      })
      .run();
  }, [editor]);

  // Insert quest block with a specific objective/beat as initial content
  // Inserts at the END of the document for predictable placement
  const insertQuestBlockWithObjective = useCallback((objective: {
    id: string;
    title: string;
    description?: string;
    questId: string;
    questName: string;
  }) => {
    if (!editor) return;

    // Move to end of document, then insert block
    const endPos = editor.state.doc.content.size;
    editor.chain()
      .focus()
      .setTextSelection(endPos)
      .insertContent({
        type: 'questBlock',
        attrs: {
          id: crypto.randomUUID(),
          title: objective.questName,
          entityId: objective.questId,
          milestones: '[]',
          status: 'pending',
          isCollapsed: false,
        },
        content: [
          {
            type: 'questObjective',
            attrs: {
              id: objective.id,
              title: objective.title,
              description: objective.description || '',
              questId: objective.questId,
              questName: objective.questName,
            },
          },
          { type: 'paragraph' },
        ],
      })
      .run();
  }, [editor]);

  // Expose editor and insert functions for drag-drop handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as Window & {
        __sessionPlannerEditor?: typeof editor;
        __sessionPlannerInsertEntity?: typeof insertEntity;
        __sessionPlannerInsertObjective?: typeof insertObjective;
        __sessionPlannerInsertEncounterBlock?: typeof insertEncounterBlock;
        __sessionPlannerInsertQuestBlock?: typeof insertQuestBlock;
        __sessionPlannerInsertQuestBlockWithObjective?: typeof insertQuestBlockWithObjective;
      };
      win.__sessionPlannerEditor = editor;
      win.__sessionPlannerInsertEntity = insertEntity;
      win.__sessionPlannerInsertObjective = insertObjective;
      win.__sessionPlannerInsertEncounterBlock = insertEncounterBlock;
      win.__sessionPlannerInsertQuestBlock = insertQuestBlock;
      win.__sessionPlannerInsertQuestBlockWithObjective = insertQuestBlockWithObjective;
    }
    return () => {
      if (typeof window !== 'undefined') {
        const win = window as Window & {
          __sessionPlannerEditor?: typeof editor;
          __sessionPlannerInsertEntity?: typeof insertEntity;
          __sessionPlannerInsertObjective?: typeof insertObjective;
          __sessionPlannerInsertEncounterBlock?: typeof insertEncounterBlock;
          __sessionPlannerInsertQuestBlock?: typeof insertQuestBlock;
          __sessionPlannerInsertQuestBlockWithObjective?: typeof insertQuestBlockWithObjective;
        };
        delete win.__sessionPlannerEditor;
        delete win.__sessionPlannerInsertEntity;
        delete win.__sessionPlannerInsertObjective;
        delete win.__sessionPlannerInsertEncounterBlock;
        delete win.__sessionPlannerInsertQuestBlock;
        delete win.__sessionPlannerInsertQuestBlockWithObjective;
      }
    };
  }, [editor, insertEntity, insertObjective, insertEncounterBlock, insertQuestBlock, insertQuestBlockWithObjective]);

  // Listen for forced save events (e.g., from beat generation)
  useEffect(() => {
    const handleForceSave = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        console.log('Force save triggered from beat generation');
        saveContent(customEvent.detail);
      }
    };

    window.addEventListener('session-planner-save', handleForceSave);
    return () => {
      window.removeEventListener('session-planner-save', handleForceSave);
    };
  }, [saveContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar
        editor={editor}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onHelpClick={() => setShowHelp(true)}
      />

      <div
        ref={(node) => {
          // Combine refs: setNodeRef for droppable, editorContainerRef for text selection
          setNodeRef(node);
          if (editorContainerRef) {
            (editorContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn(
          'flex-1 overflow-y-auto bg-slate-900/50 rounded-b-lg transition-colors relative',
          FONT_SIZE_CLASSES[fontSize],
          // Only show global highlight when NOT holding shift (root level drop)
          // When shift is held, individual blocks will highlight instead
          isOver && 'ring-2 ring-teal-500/50 ring-inset'
        )}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Text Selection Menu for creating entity stubs */}
      {selectedText && selectionPosition && (
        <SessionPrepSelectionMenu
          selectedText={selectedText}
          position={selectionPosition}
          campaignId={getCampaignId() || ''}
          sessionId={sessionId}
          onClose={clearSelection}
        />
      )}

      {/* Save Status */}
      <div className="flex items-center justify-end gap-2 p-2 text-xs text-slate-500">
        {isSaving ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </>
        ) : lastSaved ? (
          <span>Saved at {lastSaved.toLocaleTimeString()}</span>
        ) : (
          <span>Auto-save enabled</span>
        )}
      </div>

      {/* Help Dialog */}
      <PrepHelpDialog open={showHelp} onOpenChange={setShowHelp} />

      {/* Entity Quick View */}
      <EntityQuickView
        entity={quickViewEntity}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewEntity(null);
        }}
        campaignId={getCampaignId() || ''}
      />
    </div>
  );
}
