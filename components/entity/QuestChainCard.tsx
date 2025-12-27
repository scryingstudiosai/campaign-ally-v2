'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestChain } from '@/types/living-entity';
import { Link2, ChevronRight, ChevronLeft, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface QuestChainCardProps {
  chain: QuestChain;
  campaignId: string;
  questId: string;
  questName: string;
  brainNextHook?: string; // Fallback from brain.next_quest_hook
}

interface SequelInfo {
  id: string;
  name: string;
}

// Helper to increment chain position (e.g., "Part 1 of 3" -> "Part 2 of 3")
function incrementChainPosition(current: string | null): string {
  if (!current) return 'Part 2 of ?';
  const match = current.match(/Part (\d+)( of (\d+|\?))?/i);
  if (match) {
    const part = parseInt(match[1]) + 1;
    const total = match[3] || '?';
    return `Part ${part} of ${total}`;
  }
  return 'Part 2 of ?';
}

export function QuestChainCard({
  chain,
  campaignId,
  questId,
  questName,
  brainNextHook,
}: QuestChainCardProps): JSX.Element | null {
  const router = useRouter();
  const [sequel, setSequel] = useState<SequelInfo | null>(null);
  const [loadingSequel, setLoadingSequel] = useState(true);

  // Get the next hook from chain or brain
  const nextHook = chain?.next_quest_hook || brainNextHook;

  // Check for existing sequel relationship
  useEffect(() => {
    async function checkForSequel(): Promise<void> {
      try {
        const supabase = createClient();

        // Look for a relationship where this quest leads to another
        const { data: relationships } = await supabase
          .from('relationships')
          .select('target_id')
          .eq('source_id', questId)
          .in('relationship_type', ['leads_to', 'sequel', 'continues_in', 'followed_by'])
          .is('deleted_at', null)
          .limit(1);

        if (relationships && relationships.length > 0) {
          // Fetch the sequel quest details
          const { data: sequelQuest } = await supabase
            .from('entities')
            .select('id, name')
            .eq('id', relationships[0].target_id)
            .is('deleted_at', null)
            .single();

          if (sequelQuest) {
            setSequel({ id: sequelQuest.id, name: sequelQuest.name });
          }
        }
      } catch (error) {
        console.error('Failed to check for sequel:', error);
      } finally {
        setLoadingSequel(false);
      }
    }

    checkForSequel();
  }, [questId]);

  // Handle Forge Sequel navigation
  const handleForgeSequel = (): void => {
    // CRITICAL: Get arc info from chain, or use current quest as anchor if it's Part 1
    const arcName = chain?.arc_name || questName;
    // If no arc_id exists in the chain, the current quest IS the arc anchor
    const arcId = chain?.arc_id || questId;
    // Calculate next position from current position
    const currentPosition = chain?.chain_position || 'Part 1 of ?';
    const nextPosition = incrementChainPosition(currentPosition);

    const params = new URLSearchParams({
      concept: nextHook || '',
      parentQuestId: questId,
      parentQuestName: questName,
      // Pass the original arc info (inherited from chain origin)
      arcId: arcId,
      arcName: arcName,
      chainPosition: nextPosition,
    });

    router.push(`/dashboard/campaigns/${campaignId}/forge/quest?${params.toString()}`);
  };

  // If no chain data and no next hook, nothing to show
  if (!chain || Object.keys(chain).length === 0) {
    // Still show if we have a next hook from brain
    if (!nextHook) return null;
  }

  const hasChainInfo =
    chain?.arc_name ||
    chain?.chain_position ||
    chain?.previous_quest ||
    nextHook ||
    sequel;

  if (!hasChainInfo) return null;

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-cyan-400 font-medium border-b border-cyan-400/20 pb-2">
        <Link2 className="w-5 h-5" />
        <span>Quest Chain</span>
      </div>

      {/* Arc Name */}
      {chain?.arc_name && (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">Story Arc:</span>
          <Badge variant="outline" className="border-cyan-600 text-cyan-400">
            {chain.arc_name}
          </Badge>
        </div>
      )}

      {/* Chain Position */}
      {chain?.chain_position && (
        <div className="p-3 bg-slate-800 rounded-lg">
          <span className="text-slate-400 text-xs">Position in Chain</span>
          <p className="text-slate-200 font-medium">{chain.chain_position}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Previous Quest */}
        {chain?.previous_quest && (
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

        {/* Next Quest / Sequel / Hook */}
        <div className="p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <ChevronRight className="w-3 h-3" />
            {sequel ? 'Continues In' : 'Next Quest Hook'}
          </div>

          {loadingSequel ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Checking...</span>
            </div>
          ) : sequel ? (
            /* Link to existing sequel */
            <Link
              href={`/dashboard/campaigns/${campaignId}/memory/${sequel.id}`}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              {sequel.name}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : nextHook ? (
            /* Show hook and Forge Sequel button */
            <div className="space-y-3">
              <p className="text-slate-300 text-sm italic">{nextHook}</p>
              <Button
                onClick={handleForgeSequel}
                variant="outline"
                size="sm"
                className="w-full border-amber-600/50 text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Forge Sequel
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">No sequel planned</p>
          )}
        </div>
      </div>

      {/* Standalone indicator */}
      {!chain?.previous_quest && !nextHook && !sequel && chain?.chain_position === 'standalone' && (
        <div className="text-center text-slate-500 text-sm py-2">
          This is a standalone quest
        </div>
      )}
    </div>
  );
}
