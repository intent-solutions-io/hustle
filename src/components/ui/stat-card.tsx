'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerItem } from '@/lib/animation';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    suffix?: string;
  };
  icon?: React.ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, trend, icon, accent }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl p-6 shadow-sm',
        accent ? 'bg-zinc-900 text-white' : 'bg-white'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className={cn(
            'text-sm font-body font-medium',
            accent ? 'text-zinc-300' : 'text-zinc-500'
          )}
        >
          {label}
        </p>
        {icon && (
          <div className={cn(accent ? 'text-amber-400' : 'text-amber-500')}>
            {icon}
          </div>
        )}
      </div>
      <p
        className={cn(
          'text-4xl font-display font-semibold',
          accent ? 'text-white' : 'text-zinc-900'
        )}
      >
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            'text-sm font-body mt-2 flex items-center gap-1',
            trend.direction === 'up' && 'text-green-500',
            trend.direction === 'down' && 'text-red-500',
            trend.direction === 'neutral' &&
              (accent ? 'text-zinc-400' : 'text-zinc-500')
          )}
        >
          {trend.direction === 'up' && <ArrowUp className="w-3.5 h-3.5" />}
          {trend.direction === 'down' && <ArrowDown className="w-3.5 h-3.5" />}
          {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
          {trend.value > 0 && '+'}
          {trend.value} {trend.suffix ?? 'this month'}
        </p>
      )}
    </motion.div>
  );
}
