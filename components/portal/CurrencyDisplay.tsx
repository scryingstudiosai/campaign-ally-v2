'use client';

import { Coins } from 'lucide-react';

interface Props {
  currency: {
    gold?: number;
    silver?: number;
    copper?: number;
  };
}

export function CurrencyDisplay({ currency }: Props) {
  const { gold = 0, silver = 0, copper = 0 } = currency;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/10">
      <Coins className="w-4 h-4 text-amber-400" />
      <div className="flex gap-2 text-sm">
        <span>
          <span className="text-amber-400 font-medium">{gold}</span>
          <span className="text-slate-500 ml-0.5">gp</span>
        </span>
        {silver > 0 && (
          <span>
            <span className="text-slate-300">{silver}</span>
            <span className="text-slate-500 ml-0.5">sp</span>
          </span>
        )}
        {copper > 0 && (
          <span>
            <span className="text-orange-400">{copper}</span>
            <span className="text-slate-500 ml-0.5">cp</span>
          </span>
        )}
      </div>
    </div>
  );
}
