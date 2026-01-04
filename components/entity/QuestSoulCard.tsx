'use client';

import { QuestSoul } from '@/types/living-entity';
import { Eye, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestSoulCardProps {
  soul: QuestSoul;
}

const TIMELINE_CONFIG: Record<string, { label: string; color: string }> = {
  immediate: { label: 'Urgent', color: 'text-red-400 border-red-600' },
  days: { label: 'Days', color: 'text-orange-400 border-orange-600' },
  weeks: { label: 'Weeks', color: 'text-yellow-400 border-yellow-600' },
  no_pressure: { label: 'No Rush', color: 'text-green-400 border-green-600' },
};

export function QuestSoulCard({ soul }: QuestSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) return null;

  const timelineConfig = soul.timeline ? TIMELINE_CONFIG[soul.timeline] : null;

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/20 pb-2">
        <Eye className="w-5 h-5" />
        <span>Quest Details</span>
        {timelineConfig && (
          <Badge variant="outline" className={`ml-auto text-xs ${timelineConfig.color}`}>
            <Clock className="w-3 h-3 mr-1" />
            {timelineConfig.label}
          </Badge>
        )}
      </div>

      {/* Hook */}
      {soul.hook && (
        <div className="p-4 bg-gradient-to-r from-amber-900/30 to-transparent border-l-4 border-amber-500 rounded-r-lg">
          <p className="text-slate-200 italic">{soul.hook}</p>
        </div>
      )}

      {/* Summary */}
      {soul.summary && (
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>Quest Summary</span>
          </div>
          <p className="text-sm text-slate-300">{soul.summary}</p>
        </div>
      )}

      {/* Stakes */}
      {soul.stakes && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Stakes</span>
          </div>
          <p className="text-sm text-slate-300">{soul.stakes}</p>
        </div>
      )}
    </div>
  );
}
