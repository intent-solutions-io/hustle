import { Skeleton } from '@/components/ui/skeleton';

export default function AthletesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Athlete cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            {/* Avatar + name */}
            <div className="flex items-start gap-3">
              <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
              <div className="flex-1 pt-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            {/* Team */}
            <Skeleton className="h-3 w-2/3" />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="text-center space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-3 w-10 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
