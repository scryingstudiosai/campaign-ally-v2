'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useDroppable } from '@dnd-kit/core';
import { EntityNode, ReadAloudNode } from './extensions';
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
        placeholder: 'Start planning your session... Drag entities from the library →',
      }),
      EntityNode,
      ReadAloudNode,
    ],
    content: (initialContent as object) || { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
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

  // Expose insertEntity for drag-drop handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { __sessionPlannerInsertEntity?: typeof insertEntity }).__sessionPlannerInsertEntity = insertEntity;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as Window & { __sessionPlannerInsertEntity?: typeof insertEntity }).__sessionPlannerInsertEntity;
      }
    };
  }, [insertEntity]);

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
