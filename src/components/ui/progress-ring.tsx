'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'amber' | 'green' | 'red' | 'blue' | 'purple';
  className?: string;
}

const colorClasses: Record<string, string> = {
  amber: 'text-amber-500',
  green: 'text-green-500',
  red: 'text-red-500',
  blue: 'text-blue-500',
  purple: 'text-purple-500',
};

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  label,
  showPercentage = true,
  color = 'amber',
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-zinc-100"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
          className={colorClasses[color]}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {showPercentage && (
          <span className="font-display font-semibold text-zinc-900 leading-none"
            style={{ fontSize: size * 0.2 }}>
            {Math.round(progress * 100)}%
          </span>
        )}
        {label && (
          <span className="font-body text-zinc-500 mt-0.5 leading-none"
            style={{ fontSize: size * 0.13 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
