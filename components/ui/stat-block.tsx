import { cn } from "@/lib/utils";

interface StatItemProps {
  label: string;
  value: string | number;
  glow?: 'arcane' | 'gold' | 'blood';
}

export function StatItem({ label, value, glow }: StatItemProps) {
  return (
    <div className="text-center p-3 bg-black/20 rounded-lg border border-white/[0.03]">
      <div
        className={cn(
          "font-mono text-xl font-medium",
          !glow && "text-white",
          glow === 'arcane' && "text-arcane drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]",
          glow === 'gold' && "text-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]",
          glow === 'blood' && "text-blood drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]",
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
        {label}
      </div>
    </div>
  );
}

interface StatBlockProps {
  stats: { label: string; value: string | number; glow?: 'arcane' | 'gold' | 'blood' }[];
  columns?: 3 | 6;
  className?: string;
}

export function StatBlock({ stats, columns = 3, className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 3 && "grid-cols-3",
        columns === 6 && "grid-cols-6",
        className
      )}
    >
      {stats.map((stat) => (
        <StatItem key={stat.label} {...stat} />
      ))}
    </div>
  );
}
