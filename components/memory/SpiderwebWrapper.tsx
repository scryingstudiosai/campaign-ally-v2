'use client';

import dynamic from 'next/dynamic';
import { Loader2, Users } from 'lucide-react';

// Dynamically import the graph with SSR disabled
const SpiderwebGraphInner = dynamic(
  () => import('./SpiderwebGraph').then((mod) => mod.SpiderwebGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-stone-950 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Users className="h-12 w-12 text-stone-700" />
            <Loader2 className="h-6 w-6 animate-spin text-teal-400 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-sm text-stone-400">Loading relationship graph...</span>
        </div>
      </div>
    ),
  }
);

// Re-export with the same interface
interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  image_url?: string;
  status?: string;
  importance_tier?: string;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  description?: string;
  visibility?: 'public' | 'dm_only' | 'revealable';
}

interface SpiderwebGraphProps {
  campaignId: string;
  initialEntities: Entity[];
  initialRelationships: Relationship[];
  onEntityClick?: (entityId: string) => void;
  className?: string;
}

export function SpiderwebGraphWrapper(props: SpiderwebGraphProps) {
  return <SpiderwebGraphInner {...props} />;
}

// Also export as default for easier importing
export default SpiderwebGraphWrapper;
