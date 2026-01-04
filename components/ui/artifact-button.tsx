'use client';

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ArtifactButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'arcane' | 'gold' | 'default' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const ArtifactButton = forwardRef<HTMLButtonElement, ArtifactButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          "inline-flex items-center justify-center gap-2",
          "font-medium rounded-lg",
          "border-t border-l border-b-2 border-r",
          "transition-all duration-150",
          "active:translate-y-px active:border-b",
          "disabled:opacity-50 disabled:cursor-not-allowed",

          // Sizes
          size === 'sm' && "px-3 py-1.5 text-xs",
          size === 'md' && "px-4 py-2.5 text-sm",
          size === 'lg' && "px-6 py-3 text-base",

          // Variants
          variant === 'arcane' && [
            "bg-gradient-to-b from-teal-500 to-teal-700",
            "text-white",
            "border-t-white/10 border-l-white/5 border-b-black/50 border-r-black/30",
            "shadow-sm shadow-glow-arcane",
            "hover:from-teal-400 hover:to-teal-600 hover:shadow-glow-arcane-strong",
          ],
          variant === 'gold' && [
            "bg-gradient-to-b from-amber-400 to-amber-600",
            "text-amber-950",
            "border-t-white/10 border-l-white/5 border-b-black/50 border-r-black/30",
            "shadow-sm shadow-glow-gold",
            "hover:from-amber-300 hover:to-amber-500",
          ],
          variant === 'default' && [
            "bg-slate-700",
            "text-slate-200",
            "border-t-white/10 border-l-white/5 border-b-black/50 border-r-black/30",
            "hover:bg-slate-600",
          ],
          variant === 'ghost' && [
            "bg-transparent",
            "text-slate-400",
            "border-transparent",
            "hover:bg-white/5 hover:text-slate-200",
          ],
          variant === 'outline' && [
            "bg-transparent",
            "text-slate-200",
            "border border-slate-600",
            "hover:bg-white/[0.03] hover:border-slate-500",
          ],
          variant === 'danger' && [
            "bg-gradient-to-b from-rose-500 to-rose-700",
            "text-white",
            "border-t-white/10 border-l-white/5 border-b-black/50 border-r-black/30",
            "shadow-sm shadow-glow-blood",
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ArtifactButton.displayName = "ArtifactButton";

export { ArtifactButton };
export type { ArtifactButtonProps };
