'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEDD] to-[#EADBB8] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚨</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-2">
          Something went wrong
        </h1>
        <p className="font-body text-sm text-zinc-500 mb-8 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white font-display font-semibold text-sm rounded-full hover:bg-zinc-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-white text-zinc-700 font-display font-semibold text-sm rounded-full hover:bg-zinc-50 shadow-sm transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
