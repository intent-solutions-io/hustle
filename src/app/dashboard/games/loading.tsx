import { Skeleton, SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';

export default function GamesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Games table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
          {['w-28', 'w-44', 'w-24', 'w-20', 'w-20', 'w-20'].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonRow key={i} cols={6} />
        ))}
      </div>
    </div>
  );
}
