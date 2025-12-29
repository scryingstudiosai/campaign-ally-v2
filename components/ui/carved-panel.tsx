import { cn } from "@/lib/utils";

interface CarvedPanelProps {
  children: React.ReactNode;
  deep?: boolean;
  className?: string;
}

export function CarvedPanel({ children, deep = false, className }: CarvedPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-4 border border-black/30",
        !deep && "bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]",
        deep && "bg-black/60 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {children}
    </div>
  );
}
