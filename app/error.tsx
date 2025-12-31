'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (Sentry later)
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-slate-400 max-w-sm mx-auto">
            We hit an unexpected snag. Your campaign data is safe - this is just a display error.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-slate-600">
            Error ID: {error.digest}
          </p>
        )}

        {/* Dev details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-8">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
              Developer Details
            </summary>
            <pre className="mt-2 p-4 bg-slate-900 rounded-lg text-xs text-red-400 overflow-auto max-h-64">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
