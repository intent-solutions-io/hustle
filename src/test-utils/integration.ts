/**
 * Integration Test Helpers
 *
 * Utilities for integration tests running against Firebase Emulators.
 * Creates real users, real Firestore docs, real session cookies.
 *
 * Requires FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST env vars.
 */

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestUser {
  uid: string;
  email: string;
  idToken: string;
  sessionCookie: string;
}

// ---------------------------------------------------------------------------
// Emulator REST API helpers
// ---------------------------------------------------------------------------

const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const FIRESTORE_EMULATOR = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'hustle-test';

/**
 * Clear all data from both Auth and Firestore emulators.
 * Call in beforeEach() for test isolation.
 */
export async function clearEmulators(): Promise<void> {
  await Promise.all([
    // Clear Auth emulator
    fetch(`http://${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
      method: 'DELETE',
    }),
    // Clear Firestore emulator
    fetch(`http://${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
      method: 'DELETE',
    }),
  ]);
}

/**
 * Exchange a custom token for an ID token via the Auth emulator REST API.
 */
async function exchangeCustomTokenForIdToken(customToken: string): Promise<string> {
  const res = await fetch(
    `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange custom token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.idToken;
}

// ---------------------------------------------------------------------------
// Test User Creation
// ---------------------------------------------------------------------------

let userCounter = 0;

/**
 * Create a real user in the Auth emulator and get a valid session cookie.
 *
 * This creates:
 * 1. A user in Firebase Auth emulator
 * 2. A custom token → ID token exchange
 * 3. A real session cookie via Admin SDK
 */
export async function createTestUser(overrides: {
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
} = {}): Promise<TestUser> {
  userCounter++;
  const email = overrides.email || `test-${userCounter}-${Date.now()}@integration.test`;
  const displayName = overrides.displayName || `Test User ${userCounter}`;

  const auth = getAdminAuth();

  // Create user in Auth emulator
  const userRecord = await auth.createUser({
    email,
    displayName,
    emailVerified: overrides.emailVerified ?? true,
    password: 'test-password-123',
  });

  // Create custom token and exchange for ID token
  const customToken = await auth.createCustomToken(userRecord.uid);
  const idToken = await exchangeCustomTokenForIdToken(customToken);

  // Create a real session cookie (14 days)
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: 14 * 24 * 60 * 60 * 1000,
  });

  return {
    uid: userRecord.uid,
    email,
    idToken,
    sessionCookie,
  };
}

// ---------------------------------------------------------------------------
// Firestore Seed Helpers
// ---------------------------------------------------------------------------

/**
 * Seed a user profile document in Firestore.
 */
export async function seedUserProfile(
  userId: string,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  const db = getAdminDb();
  const now = new Date();

  await db.collection('users').doc(userId).set({
    defaultWorkspaceId: null,
    ownedWorkspaces: [],
    firstName: 'Test',
    lastName: 'User',
    email: `${userId}@integration.test`,
    phone: null,
    emailVerified: true,
    agreedToTerms: true,
    agreedToPrivacy: true,
    isParentGuardian: true,
    termsAgreedAt: now,
    privacyAgreedAt: now,
    verificationPinHash: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

/**
 * Seed a workspace document in Firestore and link it to the user.
 * Returns the workspace ID.
 */
export async function seedWorkspace(
  userId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const db = getAdminDb();
  const now = new Date();

  const workspaceRef = db.collection('workspaces').doc();
  const workspaceId = workspaceRef.id;

  await workspaceRef.set({
    ownerUserId: userId,
    name: 'Test Workspace',
    plan: 'starter',
    status: 'active',
    members: [{
      userId,
      email: `${userId}@integration.test`,
      role: 'owner',
      addedAt: now,
      addedBy: userId,
    }],
    billing: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
    usage: {
      playerCount: 0,
      gamesThisMonth: 0,
      storageUsedMB: 0,
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });

  // Link workspace to user
  await db.collection('users').doc(userId).update({
    defaultWorkspaceId: workspaceId,
    ownedWorkspaces: [workspaceId],
  });

  return workspaceId;
}

/**
 * Seed a player document under a user.
 * Returns the player ID.
 */
export async function seedPlayer(
  userId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const db = getAdminDb();
  const now = new Date();

  const playerRef = db.collection(`users/${userId}/players`).doc();

  await playerRef.set({
    workspaceId: null,
    name: 'Test Player',
    birthday: new Date('2012-06-15'),
    gender: 'male',
    primaryPosition: 'CM',
    position: 'CM',
    secondaryPositions: [],
    leagueCode: 'REC',
    teamClub: 'Test FC',
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  return playerRef.id;
}

/**
 * Seed a game document under a player.
 * Returns the game ID.
 */
export async function seedGame(
  userId: string,
  playerId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const db = getAdminDb();
  const now = new Date();

  const gameRef = db.collection(`users/${userId}/players/${playerId}/games`).doc();

  await gameRef.set({
    workspaceId: null,
    date: new Date('2025-09-15'),
    opponent: 'Rival FC',
    result: 'Win',
    finalScore: '3-1',
    minutesPlayed: 60,
    goals: 2,
    assists: 1,
    tackles: null,
    interceptions: null,
    clearances: null,
    blocks: null,
    aerialDuelsWon: null,
    saves: null,
    goalsAgainst: null,
    cleanSheet: null,
    verified: false,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  return gameRef.id;
}

/**
 * Read a document directly from Firestore emulator.
 * Useful for assertions.
 */
export async function readDoc(path: string): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();
  const snap = await db.doc(path).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

/**
 * Read all documents in a collection.
 */
export async function readCollection(path: string): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const db = getAdminDb();
  const snap = await db.collection(path).get();
  return snap.docs.map(doc => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));
}
