'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  entityId: string;
  campaignId: string;
  entityName: string;
  className?: string;
  showLabel?: boolean;
}

export function EntityVisibilityToggle({
  entityId,
  campaignId,
  entityName,
  className,
  showLabel = false
}: Props) {
  const [isRevealed, setIsRevealed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const supabase = createClient();

  // Check current visibility status
  useEffect(() => {
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('player_discoveries')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('entity_id', entityId)
        .limit(1);

      if (!error) {
        setIsRevealed(data && data.length > 0);
      }
      setIsLoading(false);
    };

    checkStatus();
  }, [entityId, campaignId, supabase]);

  const handleToggle = async () => {
    setIsToggling(true);

    if (isRevealed) {
      // Hide from players - delete all discoveries for this entity
      const { error } = await supabase
        .from('player_discoveries')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('entity_id', entityId);

      if (!error) {
        setIsRevealed(false);
      }
    } else {
      // Reveal to players
      const res = await fetch('/api/portal/world/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          entityId,
          playerIds: null, // All players
        }),
      });

      if (res.ok) {
        setIsRevealed(true);
      }
    }

    setIsToggling(false);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
        {showLabel && <span className="text-sm text-slate-500">Checking...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      title={isRevealed ? `Hide ${entityName} from players` : `Reveal ${entityName} to players`}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
        isRevealed
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white",
        isToggling && "opacity-50 cursor-wait",
        className
      )}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRevealed ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
      {showLabel && (
        <span>{isRevealed ? 'Visible to Players' : 'Hidden from Players'}</span>
      )}
    </button>
  );
}
