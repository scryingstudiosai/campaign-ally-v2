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
  NoteBlockNode,
  SceneBlockNode,
  EncounterBlockNode,
  QuestBlockNode,
  AiGenesisBlockNode,
} from './extensions';
import { EditorToolbar, FontSize } from './EditorToolbar';
import { PrepHelpDialog } from './PrepHelpDialog';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      }
    } catch (error) {
      console.error('Failed to save prep content:', error);
    }
    setIsSaving(false);
  }, [sessionId, onContentChange]);

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
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto bg-slate-900/50 rounded-b-lg transition-colors',
          FONT_SIZE_CLASSES[fontSize],
          // Only show global highlight when NOT holding shift (root level drop)
          // When shift is held, individual blocks will highlight instead
          isOver && 'ring-2 ring-teal-500/50 ring-inset'
        )}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>

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
    </div>
  );
}
