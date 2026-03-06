import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  );
}
