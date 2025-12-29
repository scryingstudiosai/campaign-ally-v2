export function SkeletonCard(): JSX.Element {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-32 bg-slate-700 rounded" />
        <div className="h-5 w-16 bg-slate-700 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-800 rounded" />
        <div className="h-3 w-2/3 bg-slate-800 rounded" />
      </div>
    </div>
  )
}

export function SkeletonList(): JSX.Element {
  return (
    <div className="border border-white/5 rounded-lg bg-slate-900/50 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0"
        >
          <div className="h-4 w-4 bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-800 rounded ml-auto" />
        </div>
      ))}
    </div>
  )
}
