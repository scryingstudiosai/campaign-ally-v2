'use client';

import { useState } from 'react';
import { Eye, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  campaignId: string;
  entityId: string;
  entityName: string;
  className?: string;
}

export function RevealToPlayersButton({ campaignId, entityId, entityName, className }: Props) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    setIsRevealing(true);

    const res = await fetch('/api/portal/world/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        entityId,
        playerIds: null, // null = all players
      }),
    });

    if (res.ok) {
      setRevealed(true);
      setTimeout(() => setRevealed(false), 2000);
    }

    setIsRevealing(false);
  };

  return (
    <button
      onClick={handleReveal}
      disabled={isRevealing}
      title={`Reveal ${entityName} to all players`}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
        revealed
          ? "bg-green-500/20 text-green-400"
          : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
        className
      )}
    >
      {isRevealing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : revealed ? (
        <Check className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      {revealed ? 'Revealed!' : 'Reveal to Players'}
    </button>
  );
}
