'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Portal Error</h1>
          <p className="text-slate-400 max-w-sm mx-auto">
            Something went wrong loading the portal. Your character data is safe.
          </p>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-500 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/portal'}
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Portal Home
          </button>
        </div>

        {error.digest && (
          <p className="text-xs text-slate-600">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
