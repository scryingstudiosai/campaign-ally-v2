'use client';

import { Coins } from 'lucide-react';

export interface Currency {
  pp?: number;  // Platinum
  gp?: number;  // Gold
  sp?: number;  // Silver
  cp?: number;  // Copper
  // Note: No electrum (ep) - not commonly used
}

interface Props {
  currency: Currency;
  showAll?: boolean;  // Show all currencies even if 0
  compact?: boolean;  // Compact display for headers
}

export function CurrencyDisplay({ currency, showAll = false, compact = true }: Props) {
  const { pp = 0, gp = 0, sp = 0, cp = 0 } = currency;

  // Define currency types with their colors
  const currencies = [
    { value: pp, label: 'pp', color: 'text-slate-200', bgColor: 'bg-slate-400' },
    { value: gp, label: 'gp', color: 'text-amber-400', bgColor: 'bg-amber-400' },
    { value: sp, label: 'sp', color: 'text-slate-300', bgColor: 'bg-slate-300' },
    { value: cp, label: 'cp', color: 'text-orange-400', bgColor: 'bg-orange-400' },
  ].filter(item => showAll || item.value > 0);

  // If no currency at all, show 0 gp
  if (currencies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/10">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="text-sm">
          <span className="text-amber-400 font-medium">0</span>
          <span className="text-slate-500 ml-0.5">gp</span>
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/10">
        <Coins className="w-4 h-4 text-amber-400" />
        <div className="flex gap-2 text-sm">
          {currencies.map(({ value, label, color }) => (
            <span key={label}>
              <span className={`${color} font-medium`}>{value}</span>
              <span className="text-slate-500 ml-0.5">{label}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Full display with coin icons
  return (
    <div className="flex flex-wrap gap-3">
      {currencies.map(({ value, label, color, bgColor }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center`}>
            <span className="text-[10px] font-bold text-slate-900">
              {label[0].toUpperCase()}
            </span>
          </div>
          <span className={`${color} font-medium`}>{value}</span>
          <span className="text-slate-500 text-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}
