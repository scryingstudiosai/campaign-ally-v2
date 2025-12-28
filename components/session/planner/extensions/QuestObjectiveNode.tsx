'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Target, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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

      // Insert the generated content after this node
      if (data.content && editor) {
        // Get current position
        const { from } = editor.state.selection;

        // Build content to insert - using unknown[] to allow nested structures
        const contentToInsert: unknown[] = [];

        data.content.forEach((block: { type: string; text?: string; name?: string; description?: string }) => {
          if (block.type === 'readAloud') {
            contentToInsert.push({
              type: 'readAloud',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: block.text || '' }] }],
            });
          } else if (block.type === 'paragraph') {
            contentToInsert.push({
              type: 'paragraph',
              content: [{ type: 'text', text: block.text || '' }],
            });
          } else if (block.type === 'encounter') {
            // Insert encounter as styled paragraph
            contentToInsert.push({
              type: 'paragraph',
              content: [
                { type: 'text', text: '⚔️ ' },
                { type: 'text', marks: [{ type: 'bold' }], text: `Encounter: ${block.name}` },
                { type: 'text', text: ` - ${block.description}` },
              ],
            });
          }
        });

        // Also insert suggested NPCs
        if (data.suggestedNpcs && data.suggestedNpcs.length > 0) {
          contentToInsert.push({
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'italic' }], text: `💡 NPCs involved: ${data.suggestedNpcs.map((n: { name: string }) => n.name).join(', ')}` },
            ],
          });
        }

        // Insert all content
        if (contentToInsert.length > 0) {
          editor.chain().focus().insertContentAt(from + 1, contentToInsert).run();
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

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-quest-objective': 'true' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestObjectiveNodeView);
  },
});
