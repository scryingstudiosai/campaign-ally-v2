'use client';

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface MaterialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  entityType?: 'npc' | 'location' | 'quest' | 'item' | 'faction' | 'creature' | 'encounter';
  active?: boolean;
}

const MaterialCard = forwardRef<HTMLDivElement, MaterialCardProps>(
  ({ className, hoverable = false, entityType, active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative overflow-hidden rounded-xl",
          // Gradient background for depth (carved stone effect)
          "bg-gradient-to-br from-slate-800/80 to-slate-900/95",
          // Etched border effect
          "border-t border-l border-b border-r",
          "border-t-white/[0.08] border-l-white/[0.05]",
          "border-b-black/45 border-r-black/35",
          // Carved stone shadow (light from top-left)
          "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]",
          // Inner polish gradient (using pseudo-element)
          "before:absolute before:inset-0 before:pointer-events-none before:rounded-xl",
          "before:bg-gradient-to-b before:from-white/[0.03] before:via-transparent before:to-black/[0.15]",
          // Transitions
          "transition-all duration-200 ease-out",
          // Hoverable variant
          hoverable && [
            "cursor-pointer",
            "hover:-translate-y-0.5",
            "hover:border-t-arcane/20 hover:border-l-arcane/15",
            "hover:shadow-glow-arcane",
          ],
          // Entity type hover colors
          entityType === 'npc' && hoverable && "hover:border-t-purple-400/25 hover:shadow-glow-purple",
          entityType === 'location' && hoverable && "hover:border-t-emerald-400/25 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]",
          entityType === 'quest' && hoverable && "hover:border-t-amber-400/25 hover:shadow-glow-gold",
          entityType === 'item' && hoverable && "hover:border-t-blue-400/25 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
          entityType === 'faction' && hoverable && "hover:border-t-rose-400/25 hover:shadow-glow-blood",
          entityType === 'creature' && hoverable && "hover:border-t-orange-400/25 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]",
          entityType === 'encounter' && hoverable && "hover:border-t-amber-400/25 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]",
          // Active state
          active && "border-arcane/40 shadow-glow-arcane-strong",
          className
        )}
        {...props}
      >
        {children}

        {/* Sheen effect on hover */}
        {hoverable && (
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full pointer-events-none group-hover:animate-sheen" />
        )}
      </div>
    );
  }
);
MaterialCard.displayName = "MaterialCard";

export { MaterialCard };
export type { MaterialCardProps };
