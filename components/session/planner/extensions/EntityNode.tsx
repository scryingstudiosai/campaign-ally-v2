import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Users, MapPin, Sword, Package, Flag, Skull } from 'lucide-react';

// The React component that renders the node
const EntityNodeView = ({ node }: NodeViewProps) => {
  const { id, name, entityType } = node.attrs;

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    npc: { icon: Users, color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
    location: { icon: MapPin, color: 'bg-green-900/50 text-green-300 border-green-700' },
    item: { icon: Package, color: 'bg-amber-900/50 text-amber-300 border-amber-700' },
    creature: { icon: Skull, color: 'bg-red-900/50 text-red-300 border-red-700' },
    faction: { icon: Flag, color: 'bg-purple-900/50 text-purple-300 border-purple-700' },
    quest: { icon: Sword, color: 'bg-teal-900/50 text-teal-300 border-teal-700' },
  };

  const config = typeConfig[entityType] || typeConfig.npc;
  const Icon = config.icon;

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${config.color} text-sm cursor-pointer hover:opacity-80 transition-opacity`}
        data-entity-id={id}
        title={`Click to view ${name}`}
      >
        <Icon className="w-3 h-3" />
        <span>{name}</span>
      </span>
    </NodeViewWrapper>
  );
};

// The Tiptap extension
export const EntityNode = Node.create({
  name: 'entityNode',
  group: 'inline',
  inline: true,
  atom: true, // Cannot be edited directly

  addAttributes() {
    return {
      id: { default: null },
      name: { default: '' },
      entityType: { default: 'npc' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-entity-id]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            id: dom.getAttribute('data-entity-id'),
            name: dom.getAttribute('data-entity-name'),
            entityType: dom.getAttribute('data-entity-type'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-entity-id': HTMLAttributes.id,
      'data-entity-name': HTMLAttributes.name,
      'data-entity-type': HTMLAttributes.entityType,
    }), HTMLAttributes.name];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EntityNodeView);
  },
});
