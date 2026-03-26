import { Skeleton, SkeletonCard, SkeletonChart } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header + range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Goals over time */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-24" />
        <SkeletonChart height={200} />
      </div>

      {/* Bar + Pie row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-20" />
          <SkeletonChart height={200} />
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24" />
          <SkeletonChart height={160} />
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best/worst */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 2 }, (_, j) => (
              <div key={j} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right space-y-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
