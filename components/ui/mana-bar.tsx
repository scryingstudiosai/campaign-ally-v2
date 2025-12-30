import { cn } from "@/lib/utils";

interface ManaBarProps {
  value: number;
  max: number;
  variant?: 'arcane' | 'blood' | 'gold' | 'emerald';
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ManaBar({
  value,
  max,
  variant = 'arcane',
  label,
  showValue = true,
  className
}: ManaBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{label}</span>
          {showValue && (
            <span className="font-mono text-slate-200">{value} / {max}</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            variant === 'arcane' && "bg-gradient-to-r from-teal-600 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.4)]",
            variant === 'blood' && "bg-gradient-to-r from-rose-700 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]",
            variant === 'gold' && "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]",
            variant === 'emerald' && "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
