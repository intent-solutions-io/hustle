import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

export default function BillingLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Plan card + usage */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <Skeleton className="h-5 w-16" />
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-100">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="p-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-14" />
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
              <Skeleton className="h-8 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <Skeleton className="h-5 w-28" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonRow key={i} cols={5} />
        ))}
      </div>
    </div>
  );
}
