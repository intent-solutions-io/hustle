import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Hustle',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEDD] to-[#EADBB8] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {/* Ball */}
        <div className="relative inline-block mb-8">
          <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto">
            <span className="text-6xl select-none">⚽</span>
          </div>
          {/* Shadow */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 rounded-full blur-sm" />
        </div>

        {/* 404 */}
        <p className="font-display text-8xl font-semibold text-amber-500/30 leading-none mb-2 select-none">
          404
        </p>

        <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-2">
          Out of Bounds
        </h1>
        <p className="font-body text-sm text-zinc-500 mb-8 leading-relaxed">
          This page has been red-carded. It doesn&apos;t exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white font-display font-semibold text-sm rounded-full hover:bg-zinc-800 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white text-zinc-700 font-display font-semibold text-sm rounded-full hover:bg-zinc-50 shadow-sm transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
