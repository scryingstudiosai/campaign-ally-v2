'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { cn } from '@/lib/utils';

export interface RelationshipEdgeData {
  label: string;
  relationshipType: string;
  isSecret?: boolean;
  isHostile?: boolean;
}

const relationshipStyles: Record<string, { color: string; strokeDasharray?: string }> = {
  // Positive relationships
  ally: { color: '#22c55e' },
  friend: { color: '#22c55e' },
  family: { color: '#22c55e' },
  member: { color: '#3b82f6' },
  leader: { color: '#3b82f6' },
  employer: { color: '#3b82f6' },
  patron: { color: '#8b5cf6' },
  mentor: { color: '#8b5cf6' },

  // Negative relationships
  rival: { color: '#ef4444' },
  enemy: { color: '#ef4444' },
  hostile: { color: '#ef4444' },

  // Neutral
  acquaintance: { color: '#6b7280' },
  contact: { color: '#6b7280' },
  neutral: { color: '#6b7280' },

  // Special
  secret: { color: '#f59e0b', strokeDasharray: '5 5' },
  romantic: { color: '#ec4899' },

  // Location-based
  located_in: { color: '#14b8a6', strokeDasharray: '3 3' },
  owns: { color: '#f59e0b' },
  controls: { color: '#8b5cf6' },
};

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relType = data?.relationshipType?.toLowerCase() || 'neutral';
  const edgeStyle = relationshipStyles[relType] || relationshipStyles.neutral;

  // Override for special flags
  const finalColor = data?.isHostile ? '#ef4444' : edgeStyle.color;
  const finalDash = data?.isSecret ? '5 5' : edgeStyle.strokeDasharray;

  return (
    <>
      {/* Edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={finalColor}
        strokeDasharray={finalDash}
        fill="none"
        style={style}
      />

      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              'bg-stone-900/90 border border-stone-700',
              'text-stone-300 backdrop-blur-sm'
            )}
          >
            {data.label}
            {data.isSecret && <span className="ml-1">&#129323;</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
