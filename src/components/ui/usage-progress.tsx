'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UsageProgressProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
}

export function UsageProgress({
  label,
  used,
  max,
  unit = '',
}: UsageProgressProps) {
  const percentage = Math.min((used / max) * 100, 100);
  const status =
    percentage < 70 ? 'ok' : percentage < 100 ? 'warning' : 'critical';

  const barColor = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }[status];

  const textColor = {
    ok: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  }[status];

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-body font-medium text-zinc-700">{label}</span>
        <span className={cn('font-body', textColor)}>
          {used}
          {unit} / {max}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full', barColor)}
        />
      </div>
    </div>
  );
}
