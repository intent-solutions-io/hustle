/**
 * Firestore Data Types
 *
 * TypeScript interfaces for Firestore documents.
 * These map from the PostgreSQL Prisma schema to Firestore collections.
 *
 * Collection Structure:
 * /users/{userId}
 *   /players/{playerId}
 *     /games/{gameId}
 * /waitlist/{email}
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User Document
 * Collection: /users/{userId}
 *
 * Firebase Auth manages authentication.
 * This document stores user profile and COPPA compliance data.
 */
export interface UserDocument {
  // Profile
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;

  // Email verification (managed by Firebase Auth)
  emailVerified: boolean;

  // COPPA Compliance
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  termsAgreedAt: Timestamp | null;
  privacyAgreedAt: Timestamp | null;

  // Game verification PIN (bcrypt hash of 4-6 digit PIN)
  verificationPinHash?: string | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Player Document
 * Subcollection: /users/{userId}/players/{playerId}
 *
 * Child profiles for tracking youth soccer players.
 */
export interface PlayerDocument {
  // Profile
  name: string;
  birthday: Timestamp;
  position: string;
  teamClub: string;
  photoUrl?: string | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Game Document
 * Subcollection: /users/{userId}/players/{playerId}/games/{gameId}
 *
 * Individual game statistics.
 */
export interface GameDocument {
  // Game info
  date: Timestamp;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  finalScore: string;
  minutesPlayed: number;

  // Universal stats
  goals: number;
  assists: number;

  // Defensive stats (null if not defender)
  tackles?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocks?: number | null;
  aerialDuelsWon?: number | null;

  // Goalkeeper stats (null if not goalkeeper)
  saves?: number | null;
  goalsAgainst?: number | null;
  cleanSheet?: boolean | null;

  // Verification
  verified: boolean;
  verifiedAt?: Timestamp | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Waitlist Document
 * Collection: /waitlist/{email}
 *
 * Early access signups (document ID is the email).
 */
export interface WaitlistDocument {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Client-side types (with Date instead of Timestamp)
 * Used in React components and API routes.
 */

export interface User extends Omit<UserDocument, 'createdAt' | 'updatedAt' | 'termsAgreedAt' | 'privacyAgreedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  termsAgreedAt: Date | null;
  privacyAgreedAt: Date | null;
}

export interface Player extends Omit<PlayerDocument, 'birthday' | 'createdAt' | 'updatedAt'> {
  id: string;
  birthday: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game extends Omit<GameDocument, 'date' | 'verifiedAt' | 'createdAt' | 'updatedAt'> {
  id: string;
  date: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Waitlist extends Omit<WaitlistDocument, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
