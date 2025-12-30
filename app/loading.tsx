import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
