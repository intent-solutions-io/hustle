import React from 'react';
import { cn } from '@/lib/utils';

// Base shimmer primitive
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-zinc-200/80',
        className
      )}
      {...props}
    />
  );
}

// Card-shaped skeleton used for stat/summary cards
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl p-5 shadow-sm space-y-3', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Row skeleton used inside tables / lists
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-50 last:border-0">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === 0 ? 'flex-1' : 'w-16')} />
      ))}
    </div>
  );
}

// Chart placeholder
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-xl bg-zinc-100 animate-pulse"
      style={{ height }}
    />
  );
}
