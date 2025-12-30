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
} from './extensions';
import { EditorToolbar } from './EditorToolbar';
import { Loader2 } from 'lucide-react';

interface SessionPlannerProps {
  sessionId: string;
  initialContent: unknown;
  onContentChange?: (content: unknown) => void;
}

export function SessionPlanner({ sessionId, initialContent, onContentChange }: SessionPlannerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    ],
    content: (initialContent as object) || { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');

        // If there's no HTML, let Tiptap handle plain text normally
        if (!html) {
          return false;
        }

        // Check if this is from our own editor (internal copy/paste)
        // ProseMirror adds data-pm-slice for internal clipboard operations
        if (html.includes('data-pm-slice')) {
          return false; // Let Tiptap handle internal paste
        }

        // Check if the HTML contains our custom block types
        const hasOurBlocks = html.includes('data-quest-block') ||
          html.includes('data-scene-block') ||
          html.includes('data-encounter-block') ||
          html.includes('data-note-block') ||
          html.includes('data-read-aloud') ||
          html.includes('data-quest-objective') ||
          html.includes('data-mention');

        // If HTML has our custom blocks, let Tiptap parse it normally
        if (hasOurBlocks) {
          return false;
        }

        // For external HTML without our blocks, convert to plain text
        // This prevents random HTML structures from being misinterpreted as blocks
        if (text) {
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
  const insertEncounterBlock = useCallback((encounter: {
    id: string;
    name: string;
    creatures?: Array<{ name: string; count: number; cr?: string }>;
    difficulty?: string;
  }) => {
    if (!editor) return;

    editor.chain().focus().insertEncounterBlock({
      title: encounter.name,
      entityId: encounter.id,
      difficulty: encounter.difficulty || 'medium',
      creatures: JSON.stringify(encounter.creatures || []),
    }).run();
  }, [editor]);

  // Insert quest block when quest entity is dropped
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

    editor.chain().focus().insertQuestBlock({
      title: quest.name,
      entityId: quest.id,
      milestones: JSON.stringify(milestones),
    }).run();
  }, [editor]);

  // Insert quest block with a specific objective/beat as initial content
  const insertQuestBlockWithObjective = useCallback((objective: {
    id: string;
    title: string;
    description?: string;
    questId: string;
    questName: string;
  }) => {
    if (!editor) return;

    editor.chain().focus().insertContent({
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
    }).run();
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
      <EditorToolbar editor={editor} />

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto bg-slate-900/50 rounded-b-lg transition-colors ${
          isOver ? 'ring-2 ring-teal-500 ring-inset bg-teal-900/10' : ''
        }`}
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
    </div>
  );
}
