/**
 * Player-related type definitions for the Hustle application
 *
 * These types provide strict TypeScript checking for player data structures
 * and helper functions used throughout the application.
 */

/**
 * Player data structure from Firestore database
 *
 * Note: This matches the Firestore PlayerDocument schema
 */
export interface PlayerData {
  id: string;
  name: string;
  birthday: Date;
  position: string;
  teamClub: string;
  photoUrl: string | null;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Derived player data with calculated fields
 *
 * Used in UI components where age and display information is needed
 */
export interface PlayerDisplayData extends PlayerData {
  age: number;
  initials: string;
  avatarColor: string;
}

/**
 * Avatar color class names for deterministic avatar styling
 *
 * These are Tailwind CSS utility classes for consistent gray monochrome theme
 */
export type AvatarColorClass =
  | 'bg-zinc-100 text-zinc-700'
  | 'bg-zinc-200 text-zinc-800'
  | 'bg-zinc-300 text-zinc-900';

/**
 * Result of age calculation
 */
export interface AgeCalculationResult {
  age: number;
  isValid: boolean;
}
