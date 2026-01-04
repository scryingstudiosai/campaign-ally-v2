import { cn } from "@/lib/utils";

interface ReadAloudProps {
  children: React.ReactNode;
  className?: string;
}

export function ReadAloud({ children, className }: ReadAloudProps) {
  return (
    <blockquote
      className={cn(
        "relative my-4 py-4 px-5 rounded-r-lg",
        "bg-amber-400/5 border-l-[3px] border-gold",
        "italic text-slate-200 leading-relaxed",
        className
      )}
    >
      <span className="absolute -top-2 left-2 font-display text-3xl text-gold/30">"</span>
      {children}
    </blockquote>
  );
}
