'use client';

import { QuestChain } from '@/types/living-entity';
import { Link2, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface QuestChainCardProps {
  chain: QuestChain;
  campaignId: string;
}

export function QuestChainCard({ chain, campaignId }: QuestChainCardProps): JSX.Element | null {
  if (!chain || Object.keys(chain).length === 0) return null;

  const hasChainInfo = chain.arc_name || chain.chain_position || chain.previous_quest || chain.next_quest_hook;

  if (!hasChainInfo) return null;

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-cyan-400 font-medium border-b border-cyan-400/20 pb-2">
        <Link2 className="w-5 h-5" />
        <span>Quest Chain</span>
      </div>

      {/* Arc Name */}
      {chain.arc_name && (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">Story Arc:</span>
          <Badge variant="outline" className="border-cyan-600 text-cyan-400">
            {chain.arc_name}
          </Badge>
        </div>
      )}

      {/* Chain Position */}
      {chain.chain_position && (
        <div className="p-3 bg-slate-800 rounded-lg">
          <span className="text-slate-400 text-xs">Position in Chain</span>
          <p className="text-slate-200 font-medium">{chain.chain_position}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Previous Quest */}
        {chain.previous_quest && (
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <ChevronLeft className="w-3 h-3" />
              Previous Quest
            </div>
            {chain.previous_quest_id ? (
              <Link
                href={`/dashboard/campaigns/${campaignId}/memory/${chain.previous_quest_id}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                {chain.previous_quest}
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <p className="text-slate-300 font-medium">{chain.previous_quest}</p>
            )}
          </div>
        )}

        {/* Next Quest Hook */}
        {chain.next_quest_hook && (
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <ChevronRight className="w-3 h-3" />
              Next Quest Hook
            </div>
            <p className="text-slate-300 text-sm italic">{chain.next_quest_hook}</p>
          </div>
        )}
      </div>

      {/* Standalone indicator */}
      {!chain.previous_quest && !chain.next_quest_hook && chain.chain_position === 'standalone' && (
        <div className="text-center text-slate-500 text-sm py-2">
          This is a standalone quest
        </div>
      )}
    </div>
  );
}
