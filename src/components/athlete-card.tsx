'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { calculateAge, getInitials, getAvatarColor } from '@/lib/player-utils';
import type { Player } from '@/types/firestore';
import Link from 'next/link';

interface AthleteCardProps {
  athlete: Player;
  /** 'full' shows all details, 'compact' shows just name and position */
  variant?: 'full' | 'compact';
  /** If provided, card becomes clickable with this handler */
  onClick?: () => void;
  /** If provided, card links to this URL */
  href?: string;
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Additional className for the card */
  className?: string;
}

/**
 * Unified athlete card component used across:
 * - Athletes list page
 * - Dream Gym athlete selector
 * - Any other athlete grid/list views
 */
export function AthleteCard({
  athlete,
  variant = 'full',
  onClick,
  href,
  selected = false,
  className = '',
}: AthleteCardProps) {
  const age = calculateAge(athlete.birthday);
  const initials = getInitials(athlete.name);
  const avatarColor = getAvatarColor(athlete.name);

  const cardContent = (
    <CardContent className="py-6 text-center">
      {/* Avatar */}
      <Avatar className="w-16 h-16 mx-auto mb-4">
        {athlete.photoUrl ? (
          <AvatarImage src={athlete.photoUrl} alt={athlete.name} />
        ) : null}
        <AvatarFallback className={avatarColor}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <h3 className="font-semibold text-zinc-900 truncate px-2">
        {athlete.name}
      </h3>

      {/* Position + Age (always shown) */}
      <p className="text-sm text-zinc-500 mt-1">
        {athlete.primaryPosition}
        {variant === 'full' && ` • ${age} years old`}
      </p>

      {/* Team/Club (only in full variant) */}
      {variant === 'full' && athlete.teamClub && (
        <p className="text-xs text-zinc-400 mt-1 truncate px-2">
          {athlete.teamClub}
        </p>
      )}
    </CardContent>
  );

  const cardClassName = `
    border-zinc-200
    transition-all
    ${onClick || href ? 'cursor-pointer hover:border-zinc-400 hover:shadow-md' : ''}
    ${selected ? 'border-zinc-900 ring-2 ring-zinc-900 ring-offset-2' : ''}
    ${className}
  `.trim();

  // If href provided, wrap in Link
  if (href) {
    return (
      <Link href={href}>
        <Card className={cardClassName}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  // If onClick provided, make it clickable
  if (onClick) {
    return (
      <Card className={cardClassName} onClick={onClick}>
        {cardContent}
      </Card>
    );
  }

  // Static card
  return (
    <Card className={cardClassName}>
      {cardContent}
    </Card>
  );
}

/**
 * Add New Athlete card placeholder
 * Used in grids to provide an "add" action
 */
interface AddAthleteCardProps {
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function AddAthleteCard({
  href = '/dashboard/add-athlete',
  onClick,
  className = '',
}: AddAthleteCardProps) {
  const content = (
    <CardContent className="py-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center">
        <Plus className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="font-semibold text-zinc-600">Add New Athlete</h3>
      <p className="text-sm text-zinc-400 mt-1">Click to add</p>
    </CardContent>
  );

  const cardClassName = `
    border-dashed border-zinc-300
    cursor-pointer
    hover:border-zinc-400 hover:bg-zinc-50
    transition-all
    ${className}
  `.trim();

  if (href) {
    return (
      <Link href={href}>
        <Card className={cardClassName}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClassName} onClick={onClick}>
      {content}
    </Card>
  );
}

export default AthleteCard;
