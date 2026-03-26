'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-zinc-900 mb-2">
          Something went wrong
        </h2>
        <p className="font-body text-sm text-zinc-500 mb-6 leading-relaxed">
          This page ran into an error. You can try again or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="font-body text-xs text-zinc-400 bg-zinc-100 rounded-lg px-3 py-2 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-display font-semibold text-sm rounded-full hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </motion.button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-white text-zinc-700 font-display font-semibold text-sm rounded-full hover:bg-zinc-50 shadow-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
