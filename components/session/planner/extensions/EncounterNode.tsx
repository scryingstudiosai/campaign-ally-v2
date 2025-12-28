import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Swords, Play, Skull, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EncounterCreature {
  name: string;
  count?: number;
  cr?: string;
}

// The React component that renders the node
const EncounterNodeView = ({ node }: NodeViewProps) => {
  const { id, name, creatures, difficulty, xp } = node.attrs;

  // Parse creatures if it's a string
  const creatureList: EncounterCreature[] = typeof creatures === 'string'
    ? JSON.parse(creatures || '[]')
    : (creatures || []);

  const handleRunEncounter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;

    // Dispatch event for parent component to handle starting the encounter
    window.dispatchEvent(new CustomEvent('run-encounter', {
      detail: { id, name, creatures: creatureList }
    }));
  };

  const difficultyColors: Record<string, string> = {
    trivial: 'bg-gray-600 text-gray-200',
    easy: 'bg-green-600 text-green-100',
    medium: 'bg-yellow-600 text-yellow-100',
    hard: 'bg-orange-600 text-orange-100',
    deadly: 'bg-red-600 text-red-100',
  };

  return (
    <NodeViewWrapper className="my-3">
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 not-prose">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-900/50 rounded-lg">
              <Swords className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h4 className="font-semibold text-red-300">{name || 'Combat Encounter'}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {difficulty && (
                  <Badge className={difficultyColors[difficulty] || difficultyColors.medium}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Badge>
                )}
                {xp && <span>{xp} XP</span>}
              </div>
            </div>
          </div>

          <Button
            onClick={handleRunEncounter}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Run Encounter
          </Button>
        </div>

        {/* Creature List */}
        {creatureList.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Creatures</p>
            <div className="flex flex-wrap gap-2">
              {creatureList.map((creature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded text-sm"
                >
                  <Skull className="w-3 h-3 text-red-400" />
                  <span className="text-slate-300">
                    {creature.count && creature.count > 1 ? `${creature.count}x ` : ''}
                    {creature.name}
                  </span>
                  {creature.cr && (
                    <span className="text-xs text-slate-500">CR {creature.cr}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {creatureList.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            No creatures defined. Configure encounter in the entity library.
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// The Tiptap extension
export const EncounterNode = Node.create({
  name: 'encounterNode',
  group: 'block',
  atom: true, // Cannot be edited directly

  addAttributes() {
    return {
      id: { default: null },
      name: { default: 'Combat Encounter' },
      creatures: { default: '[]' },
      difficulty: { default: 'medium' },
      xp: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-encounter-id]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            id: dom.getAttribute('data-encounter-id'),
            name: dom.getAttribute('data-encounter-name'),
            creatures: dom.getAttribute('data-encounter-creatures'),
            difficulty: dom.getAttribute('data-encounter-difficulty'),
            xp: dom.getAttribute('data-encounter-xp'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-encounter-id': HTMLAttributes.id,
      'data-encounter-name': HTMLAttributes.name,
      'data-encounter-creatures': HTMLAttributes.creatures,
      'data-encounter-difficulty': HTMLAttributes.difficulty,
      'data-encounter-xp': HTMLAttributes.xp,
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EncounterNodeView);
  },
});
