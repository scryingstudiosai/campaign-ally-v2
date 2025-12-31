'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { EntityNode, EntityNodeData } from './graph/entity-node';
import { RelationshipEdge, RelationshipEdgeData } from './graph/relationship-edge';
import { getLayoutedElements } from '@/lib/utils/graph-layout';
import { Button } from '@/components/ui/button';
import { LayoutGrid, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  soul?: Record<string, unknown>;
  brain?: Record<string, unknown>;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  description?: string;
  is_secret?: boolean;
}

interface RelationshipGraphProps {
  entities: Entity[];
  relationships: Relationship[];
  onEntityClick?: (entityId: string) => void;
  className?: string;
}

// Register custom node/edge types
const nodeTypes = {
  entity: EntityNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

// Color mapping for minimap
const nodeColor = (node: Node): string => {
  const colors: Record<string, string> = {
    npc: '#3b82f6',
    location: '#22c55e',
    item: '#f59e0b',
    quest: '#8b5cf6',
    faction: '#ef4444',
    creature: '#f97316',
  };
  return colors[node.data?.entityType] || '#6b7280';
};

export function RelationshipGraph({
  entities,
  relationships,
  onEntityClick,
  className,
}: RelationshipGraphProps) {
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // Build nodes from entities
  const initialNodes: Node<EntityNodeData>[] = useMemo(() => {
    return entities
      .filter(e => filterTypes.length === 0 || filterTypes.includes(e.entity_type))
      .map((entity) => ({
        id: entity.id,
        type: 'entity',
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          id: entity.id,
          name: entity.name,
          entityType: entity.entity_type,
          subtitle: (entity.soul?.occupation as string) || (entity.soul?.location_type as string),
          imageUrl: entity.soul?.image_url as string | undefined,
          status: entity.soul?.status as string | undefined,
          onClick: onEntityClick,
        },
      }));
  }, [entities, filterTypes, onEntityClick]);

  // Build edges from relationships
  const initialEdges: Edge<RelationshipEdgeData>[] = useMemo(() => {
    const nodeIds = new Set(initialNodes.map(n => n.id));

    return relationships
      .filter(r => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
      .map((rel) => ({
        id: rel.id,
        source: rel.source_id,
        target: rel.target_id,
        type: 'relationship',
        data: {
          label: rel.relationship_type,
          relationshipType: rel.relationship_type,
          isSecret: rel.is_secret,
          isHostile: ['rival', 'enemy', 'hostile'].includes(rel.relationship_type?.toLowerCase()),
        },
      }));
  }, [relationships, initialNodes]);

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, {
      direction: layoutDirection,
      nodeWidth: 180,
      nodeHeight: 80,
      rankSep: 120,
      nodeSep: 100,
    });
  }, [initialNodes, initialEdges, layoutDirection]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Re-layout handler
  const handleRelayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
      nodes,
      edges,
      { direction: layoutDirection }
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [nodes, edges, layoutDirection, setNodes, setEdges]);

  // Toggle layout direction
  const toggleDirection = () => {
    setLayoutDirection(prev => prev === 'TB' ? 'LR' : 'TB');
  };

  // Entity type filters
  const entityTypes = useMemo(() => {
    const types = new Set(entities.map(e => e.entity_type));
    return Array.from(types);
  }, [entities]);

  const toggleFilter = (type: string) => {
    setFilterTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (entities.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center text-stone-400">
          <p>No entities to display</p>
          <p className="text-sm">Create some NPCs, locations, or factions first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        className="bg-stone-950"
      >
        {/* Controls */}
        <Controls
          className="!bg-stone-800 !border-stone-700 !rounded-lg [&>button]:!bg-stone-800 [&>button]:!border-stone-700 [&>button]:!text-stone-300 [&>button:hover]:!bg-stone-700"
        />

        {/* Background */}
        <Background
          color="#292524"
          gap={20}
          size={1}
        />

        {/* Minimap */}
        <MiniMap
          nodeColor={nodeColor}
          className="!bg-stone-900 !border-stone-700 !rounded-lg"
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Custom toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDirection}
            className="bg-stone-800 border-stone-700 hover:bg-stone-700"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRelayout}
            className="bg-stone-800 border-stone-700 hover:bg-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </Panel>

        {/* Entity type filters */}
        <Panel position="top-left" className="flex gap-1 flex-wrap max-w-xs">
          {entityTypes.map(type => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => toggleFilter(type)}
              className={cn(
                'capitalize text-xs',
                'bg-stone-800 border-stone-700',
                filterTypes.includes(type) && 'bg-teal-500/20 border-teal-500/50 text-teal-400'
              )}
            >
              {type}
            </Button>
          ))}
          {filterTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterTypes([])}
              className="text-xs text-stone-400"
            >
              Clear
            </Button>
          )}
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left">
          <div className="bg-stone-900/90 border border-stone-700 rounded-lg p-3 text-xs space-y-1">
            <p className="font-medium text-stone-300 mb-2">Relationships</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" />
              <span className="text-stone-400">Ally / Friend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500" />
              <span className="text-stone-400">Rival / Enemy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500" />
              <span className="text-stone-400">Member / Leader</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed', borderTopWidth: 2 }} />
              <span className="text-stone-400">Secret</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
