import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { Users, MapPin, Sword, Package, Flag, Skull } from 'lucide-react';
import { useState } from 'react';

// The React component that renders the node
const EntityNodeView = ({ node }: NodeViewProps) => {
  const { id, name, entityType } = node.attrs;
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    npc: { icon: Users, color: 'bg-blue-900/50 text-blue-300 border-blue-700 hover:bg-blue-800/50' },
    player: { icon: Users, color: 'bg-green-900/50 text-green-300 border-green-700 hover:bg-green-800/50' },
    location: { icon: MapPin, color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700 hover:bg-emerald-800/50' },
    item: { icon: Package, color: 'bg-amber-900/50 text-amber-300 border-amber-700 hover:bg-amber-800/50' },
    creature: { icon: Skull, color: 'bg-red-900/50 text-red-300 border-red-700 hover:bg-red-800/50' },
    faction: { icon: Flag, color: 'bg-purple-900/50 text-purple-300 border-purple-700 hover:bg-purple-800/50' },
    quest: { icon: Sword, color: 'bg-teal-900/50 text-teal-300 border-teal-700 hover:bg-teal-800/50' },
  };

  const config = typeConfig[entityType] || typeConfig.npc;
  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;

    // Dispatch event for parent component to handle opening the QuickView modal
    window.dispatchEvent(new CustomEvent('open-entity-quickview', {
      detail: { id, name, entityType }
    }));
  };

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${config.color} text-sm cursor-pointer transition-all ${
          isHovered ? 'ring-1 ring-white/30 scale-105' : ''
        }`}
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
