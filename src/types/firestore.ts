/**
 * Firestore Data Types
 *
 * TypeScript interfaces for Firestore documents.
 * These map from the PostgreSQL Prisma schema to Firestore collections.
 *
 * Collection Structure:
 * /workspaces/{workspaceId}
 * /users/{userId}
 *   /players/{playerId}
 *     /games/{gameId}
 * /waitlist/{email}
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Workspace Plan Tiers
 */
export type WorkspacePlan = 'free' | 'starter' | 'plus' | 'pro';

/**
 * Workspace Lifecycle Status
 */
export type WorkspaceStatus =
  | 'active'      // Workspace active and in good standing
  | 'trial'       // Free trial period
  | 'past_due'    // Payment failed, grace period
  | 'canceled'    // Subscription canceled, still accessible until period end
  | 'suspended'   // Access restricted (payment issues, TOS violation)
  | 'deleted';    // Soft deleted, no longer accessible

/**
 * Workspace Member Role (Phase 6 Task 6: Collaborators)
 */
export type WorkspaceMemberRole =
  | 'owner'       // Full access, billing, can delete workspace
  | 'admin'       // Full access to players/games, can invite members
  | 'member'      // Can view/edit players/games
  | 'viewer';     // Read-only access

/**
 * Workspace Member (Phase 6 Task 6: Collaborators)
 */
export interface WorkspaceMember {
  userId: string;              // Firebase UID
  email: string;               // User email
  role: WorkspaceMemberRole;   // Member role
  addedAt: Timestamp;          // When member was added
  addedBy: string;             // Firebase UID of inviter
}

/**
 * Workspace Document
 * Collection: /workspaces/{workspaceId}
 *
 * Represents a billable tenant (typically a parent/guardian account).
 * Owns players, games, and has a Stripe subscription.
 */
export interface WorkspaceDocument {
  // Identity
  ownerUserId: string;       // Firebase UID of workspace owner
  name: string;              // Display name (e.g., "Johnson Family Stats")

  // Plan & Status
  plan: WorkspacePlan;       // Current subscription tier
  status: WorkspaceStatus;   // Lifecycle status

  // Collaborators (Phase 6 Task 6)
  members: WorkspaceMember[]; // Team members with role-based access

  // Billing Integration
  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Timestamp | null;
  };

  // Usage Tracking (denormalized for quick limit checks)
  usage: {
    playerCount: number;       // Current active players
    gamesThisMonth: number;    // Games created this billing cycle
    storageUsedMB: number;     // Storage used (photos, videos - future)
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;  // Soft delete timestamp
}

/**
 * User Document
 * Collection: /users/{userId}
 *
 * Firebase Auth manages authentication.
 * This document stores user profile and COPPA compliance data.
 */
export interface UserDocument {
  // Workspace Ownership (Phase 5)
  defaultWorkspaceId: string | null;  // Primary workspace for this user
  ownedWorkspaces: string[];          // Array of workspace IDs where user is owner

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
  // Workspace Ownership (Phase 5)
  workspaceId: string;  // Workspace that owns this player

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
  // Workspace Ownership (Phase 5 - denormalized for filtering)
  workspaceId: string;  // Workspace that owns this game

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
 * Workspace Invite Document (Phase 6 Task 6: Collaborators)
 * Collection: /workspace-invites/{inviteId}
 *
 * Pending invitations to join a workspace.
 */
export interface WorkspaceInviteDocument {
  workspaceId: string;         // Workspace being invited to
  workspaceName: string;       // Workspace display name
  invitedEmail: string;        // Email address of invitee
  invitedBy: string;           // Firebase UID of inviter
  inviterName: string;         // Display name of inviter
  role: WorkspaceMemberRole;   // Role to be assigned
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Timestamp;        // Invite expiration (7 days)
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

export interface Workspace extends Omit<WorkspaceDocument, 'createdAt' | 'updatedAt' | 'deletedAt' | 'billing' | 'members'> {
  id: string;
  billing: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Date | null;
  };
  members: Array<Omit<WorkspaceMember, 'addedAt'> & { addedAt: Date }>;  // Convert Timestamp to Date
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceInvite extends Omit<WorkspaceInviteDocument, 'createdAt' | 'updatedAt' | 'expiresAt'> {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
