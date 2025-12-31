'use client';

import { Loader2, Brain, Search, Sparkles } from 'lucide-react';

export function ScanningState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center border border-teal-500/30 relative">
          <Brain className="w-10 h-10 text-teal-500" />
          <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Scanning Your Content</h2>
          <p className="text-slate-400">
            Our AI is reading through your notes and extracting entities...
          </p>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 animate-pulse" />
            Finding names
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Classifying types
          </div>
        </div>

        <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
      </div>
    </div>
  );
}
