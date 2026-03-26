import { cn } from '@/lib/utils';

type GameResult = 'win' | 'loss' | 'draw';

interface ResultBadgeProps {
  result: GameResult;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const resultClasses = {
  win: 'bg-green-100 text-green-700',
  loss: 'bg-red-100 text-red-700',
  draw: 'bg-zinc-100 text-zinc-600',
};

const labels = { win: 'W', loss: 'L', draw: 'D' };
const fullLabels = { win: 'Win', loss: 'Loss', draw: 'Draw' };

export function ResultBadge({
  result,
  size = 'md',
  showLabel = false,
}: ResultBadgeProps) {
  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-3 py-1 rounded-full font-body font-semibold text-sm',
          resultClasses[result]
        )}
      >
        {fullLabels[result]}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-display font-semibold',
        sizeClasses[size],
        resultClasses[result]
      )}
    >
      {labels[result]}
    </span>
  );
}
