'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Target, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Entity type for linking
interface LinkableEntity {
  id: string;
  name: string;
  entity_type: string;
}

// TipTap text node with optional marks
interface TextNode {
  type: 'text';
  text: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Processes text and returns TipTap content array with entity links applied
 */
function processTextWithEntityLinks(
  text: string,
  entities: LinkableEntity[],
  existingMarks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
): TextNode[] {
  if (!text || entities.length === 0) {
    return [{ type: 'text', text, marks: existingMarks.length > 0 ? existingMarks : undefined }];
  }

  // Sort entities by name length (longest first) to match longer names first
  const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

  // Filter out very short names (less than 3 chars) to avoid false positives
  const matchableEntities = sortedEntities.filter(e => e.name.length >= 3);

  if (matchableEntities.length === 0) {
    return [{ type: 'text', text, marks: existingMarks.length > 0 ? existingMarks : undefined }];
  }

  // Create a regex pattern that matches any entity name (case-insensitive)
  const pattern = matchableEntities.map(e => escapeRegex(e.name)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  // Split text by entity names
  const parts = text.split(regex);

  // Map each part to a text node
  const result: TextNode[] = [];

  for (const part of parts) {
    if (!part) continue;

    // Check if this part matches an entity name (case-insensitive)
    const matchedEntity = matchableEntities.find(
      e => e.name.toLowerCase() === part.toLowerCase()
    );

    if (matchedEntity) {
      // Apply entity link mark
      result.push({
        type: 'text',
        text: part,
        marks: [
          ...existingMarks,
          {
            type: 'entityLink',
            attrs: {
              entityId: matchedEntity.id,
              entityType: matchedEntity.entity_type,
              entityName: matchedEntity.name,
            },
          },
        ],
      });
    } else {
      result.push({
        type: 'text',
        text: part,
        marks: existingMarks.length > 0 ? existingMarks : undefined,
      });
    }
  }

  return result;
}

// The React component that renders the node
const QuestObjectiveNodeView = ({ node, editor }: NodeViewProps) => {
  const { id, title, description, questId, questName } = node.attrs;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateBeats = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get campaign ID from the URL or context
      const pathParts = window.location.pathname.split('/');
      const campaignIndex = pathParts.indexOf('campaigns');
      const campaignId = campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null;

      if (!campaignId) {
        throw new Error('Campaign ID not found');
      }

      const response = await fetch('/api/ai/generate-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: title,
          objectiveDescription: description,
          questId,
          questName,
          campaignId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate beats');
      }

      const data = await response.json();

      // Get linkable entities from the API response
      const linkableEntities: LinkableEntity[] = data.linkableEntities || [];

      // Insert the generated content after this node
      if (data.content && editor) {
        // Get current position
        const { from } = editor.state.selection;

        // Build content to insert - using unknown[] to allow nested structures
        const contentToInsert: unknown[] = [];

        data.content.forEach((block: { type: string; text?: string; name?: string; description?: string }) => {
          if (block.type === 'readAloud') {
            // Process readAloud text for entity links
            const processedContent = processTextWithEntityLinks(block.text || '', linkableEntities);
            contentToInsert.push({
              type: 'readAloud',
              content: [{ type: 'paragraph', content: processedContent }],
            });
          } else if (block.type === 'paragraph') {
            // Process paragraph text for entity links
            const processedContent = processTextWithEntityLinks(block.text || '', linkableEntities);
            contentToInsert.push({
              type: 'paragraph',
              content: processedContent,
            });
          } else if (block.type === 'encounter') {
            // Process encounter text for entity links
            const descriptionContent = processTextWithEntityLinks(` - ${block.description}`, linkableEntities);
            contentToInsert.push({
              type: 'paragraph',
              content: [
                { type: 'text', text: '⚔️ ' },
                { type: 'text', marks: [{ type: 'bold' }], text: `Encounter: ${block.name}` },
                ...descriptionContent,
              ],
            });
          }
        });

        // Also insert suggested NPCs with entity links
        if (data.suggestedNpcs && data.suggestedNpcs.length > 0) {
          const npcNames = data.suggestedNpcs.map((n: { name: string }) => n.name).join(', ');
          const npcContent = processTextWithEntityLinks(npcNames, linkableEntities, [{ type: 'italic' }]);
          contentToInsert.push({
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'italic' }], text: '💡 NPCs involved: ' },
              ...npcContent,
            ],
          });
        }

        // Insert all content
        if (contentToInsert.length > 0) {
          editor.chain().focus().insertContentAt(from + 1, contentToInsert).run();

          // IMPORTANT: Trigger save after inserting content
          // The editor's onUpdate should fire, but dispatch a custom event as backup
          setTimeout(() => {
            const content = editor.getJSON();
            window.dispatchEvent(new CustomEvent('session-planner-save', { detail: content }));
          }, 100);
        }
      }
    } catch (err) {
      console.error('Beat generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    setIsGenerating(false);
  };

  return (
    <NodeViewWrapper className="my-4">
      <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700/50 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 bg-amber-900/20">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-amber-800/30 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-amber-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <Target className="w-5 h-5 text-amber-500" />
          <div className="flex-1">
            <p className="font-medium text-amber-200">{title}</p>
            {questName && (
              <p className="text-xs text-amber-600">from &quot;{questName}&quot;</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateBeats}
            disabled={isGenerating}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-800/30"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Beats
              </>
            )}
          </Button>
        </div>

        {/* Description (collapsible) */}
        {isExpanded && description && (
          <div className="p-3 border-t border-amber-800/30">
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-900/20 border-t border-red-800/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// The Tiptap extension
export const QuestObjectiveNode = Node.create({
  name: 'questObjective',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      title: { default: '' },
      description: { default: '' },
      questId: { default: null },
      questName: { default: '' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-quest-objective]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // No content hole (0) because atom: true means this is a leaf node
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-quest-objective': 'true',
      'data-id': node.attrs.id,
      'data-title': node.attrs.title,
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestObjectiveNodeView);
  },
});
