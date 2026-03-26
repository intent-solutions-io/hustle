import { cn } from '@/lib/utils';

const positionColors: Record<string, string> = {
  GK: 'bg-yellow-100 text-yellow-800',
  CB: 'bg-blue-100 text-blue-800',
  LB: 'bg-blue-100 text-blue-800',
  RB: 'bg-blue-100 text-blue-800',
  CDM: 'bg-green-100 text-green-800',
  CM: 'bg-green-100 text-green-800',
  CAM: 'bg-purple-100 text-purple-800',
  LW: 'bg-orange-100 text-orange-800',
  RW: 'bg-orange-100 text-orange-800',
  ST: 'bg-red-100 text-red-800',
  CF: 'bg-red-100 text-red-800',
  FW: 'bg-red-100 text-red-800',
  MF: 'bg-green-100 text-green-800',
  DF: 'bg-blue-100 text-blue-800',
};

interface PositionBadgeProps {
  position: string;
  className?: string;
}

export function PositionBadge({ position, className }: PositionBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs font-body font-semibold rounded-full',
        positionColors[position] ?? 'bg-zinc-100 text-zinc-700',
        className
      )}
    >
      {position}
    </span>
  );
}
