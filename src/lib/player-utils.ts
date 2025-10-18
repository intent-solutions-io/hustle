/**
 * Player utility functions for the Hustle application
 *
 * These functions provide helper utilities for player data processing,
 * display formatting, and avatar generation.
 */

import type { AvatarColorClass } from '@/types/player';

/**
 * Calculate age from a birthday date
 *
 * This function accounts for leap years and calculates accurate age
 * based on whether the birthday has occurred in the current year.
 *
 * @param birthday - The player's birthday as a Date object
 * @returns The calculated age in years
 *
 * @example
 * ```typescript
 * const birthday = new Date('2010-05-15');
 * const age = calculateAge(birthday); // Returns current age
 * ```
 */
export function calculateAge(birthday: Date): number {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Generate initials from a full name
 *
 * For single-word names, returns the first letter.
 * For multi-word names, returns first and last initials.
 *
 * @param name - The player's full name
 * @returns Uppercase initials (1-2 characters)
 *
 * @example
 * ```typescript
 * getInitials('John Smith'); // Returns 'JS'
 * getInitials('Madonna'); // Returns 'M'
 * getInitials('  John   Doe  '); // Returns 'JD' (handles extra whitespace)
 * ```
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/); // Split by any whitespace, handle multiple spaces

  if (parts.length === 0 || parts[0] === '') {
    return '?'; // Fallback for empty names
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get deterministic avatar color based on name
 *
 * Uses a simple hash function to consistently assign one of three
 * gray monochrome color schemes to each player name.
 *
 * The color assignment is deterministic - the same name always
 * produces the same color, ensuring visual consistency.
 *
 * @param name - The player's full name
 * @returns Tailwind CSS class string for avatar styling
 *
 * @example
 * ```typescript
 * getAvatarColor('John Smith'); // Always returns same color for 'John Smith'
 * getAvatarColor('Jane Doe'); // May return different color based on hash
 * ```
 */
export function getAvatarColor(name: string): AvatarColorClass {
  const colors: AvatarColorClass[] = [
    'bg-zinc-100 text-zinc-700',
    'bg-zinc-200 text-zinc-800',
    'bg-zinc-300 text-zinc-900',
  ];

  // Simple deterministic hash based on first character
  // This ensures the same name always gets the same color
  const charCode = name.charCodeAt(0);
  const index = charCode % colors.length;

  return colors[index];
}

/**
 * Validate if a date is a valid birthday
 *
 * Checks if the date is in the past and within reasonable range for athletes
 * (typically 8-18 years old for high school athletes)
 *
 * @param birthday - The birthday to validate
 * @returns True if valid birthday, false otherwise
 */
export function isValidBirthday(birthday: Date): boolean {
  const today = new Date();
  const age = calculateAge(birthday);

  // Check if date is in the past
  if (birthday > today) {
    return false;
  }

  // Check if age is in reasonable range (5-25 years)
  // Allowing wider range for flexibility
  if (age < 5 || age > 25) {
    return false;
  }

  return true;
}

/**
 * Format a birthday date for display
 *
 * @param birthday - The birthday Date object
 * @returns Formatted date string (e.g., "May 15, 2010")
 */
export function formatBirthday(birthday: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(birthday);
}
