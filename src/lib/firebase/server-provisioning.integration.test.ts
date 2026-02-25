/**
 * Integration Tests: src/lib/firebase/server-provisioning.ts
 *
 * Tests ensureUserProvisioned() against real Firebase Emulators.
 * No mocks — creates real Auth users, reads/writes real Firestore documents.
 *
 * Prerequisites:
 *   FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must be set.
 *   Run via: npx vitest run --config vitest.integration.config.mts \
 *              src/lib/firebase/server-provisioning.integration.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { DecodedIdToken } from 'firebase-admin/auth';

import {
  clearEmulators,
  createTestUser,
  seedUserProfile,
  seedWorkspace,
  seedPlayer,
  readDoc,
  type TestUser,
} from '@/test-utils/integration';
import { ensureUserProvisioned } from '@/lib/firebase/server-provisioning';

// ---------------------------------------------------------------------------
// Helper: build a minimal DecodedIdToken-like claims object.
// ---------------------------------------------------------------------------

function makeClaims(
  user: TestUser,
  overrides: Partial<DecodedIdToken> = {}
): DecodedIdToken {
  return {
    uid: user.uid,
    email: user.email,
    email_verified: true,
    aud: 'hustle-test',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    firebase: { identities: {}, sign_in_provider: 'password' },
    iat: Math.floor(Date.now() / 1000),
    iss: 'https://securetoken.google.com/hustle-test',
    sub: user.uid,
    ...overrides,
  } as DecodedIdToken;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ensureUserProvisioned() — integration against Firebase Emulators', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    await clearEmulators();
    testUser = await createTestUser({
      displayName: 'Test Player',
      emailVerified: true,
    });
  });

  // -------------------------------------------------------------------------
  // Slow path: no user doc, no workspace
  // -------------------------------------------------------------------------

  it('creates a user doc and workspace when neither exists', async () => {
    const claims = makeClaims(testUser);

    const result = await ensureUserProvisioned(claims);

    expect(result.userId).toBe(testUser.uid);
    expect(typeof result.workspaceId).toBe('string');
    expect(result.workspaceId.length).toBeGreaterThan(0);

    const userDoc = await readDoc(`users/${testUser.uid}`);
    expect(userDoc).not.toBeNull();
    expect(userDoc!.defaultWorkspaceId).toBe(result.workspaceId);
    expect(Array.isArray(userDoc!.ownedWorkspaces)).toBe(true);
    expect((userDoc!.ownedWorkspaces as string[])).toContain(result.workspaceId);

    const workspaceDoc = await readDoc(`workspaces/${result.workspaceId}`);
    expect(workspaceDoc).not.toBeNull();
    expect(workspaceDoc!.ownerUserId).toBe(testUser.uid);
    expect(workspaceDoc!.plan).toBe('free');
    expect(workspaceDoc!.status).toBe('trial');
  });

  it('sets the correct 14-day trial period end date on the new workspace', async () => {
    const before = new Date();
    const claims = makeClaims(testUser);

    const { workspaceId } = await ensureUserProvisioned(claims);

    const after = new Date();
    const workspaceDoc = await readDoc(`workspaces/${workspaceId}`);

    // Firestore Timestamps arrive as objects with _seconds/_nanoseconds or toDate().
    const rawPeriodEnd = workspaceDoc!.billing as any;
    const periodEndTs = rawPeriodEnd?.currentPeriodEnd;

    // Convert to Date regardless of representation (Firestore Timestamp or Date).
    const periodEndDate: Date =
      typeof periodEndTs?.toDate === 'function'
        ? periodEndTs.toDate()
        : new Date(periodEndTs);

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 14);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + 14);

    expect(periodEndDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(periodEndDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
  });

  it('fills in firstName and lastName from the Auth emulator display name', async () => {
    // createTestUser sets displayName = 'Test Player' by default.
    const claims = makeClaims(testUser);

    await ensureUserProvisioned(claims);

    const userDoc = await readDoc(`users/${testUser.uid}`);
    expect(userDoc!.firstName).toBe('Test');
    expect(userDoc!.lastName).toBe('Player');
  });

  it('links the new workspace in ownedWorkspaces array on the user doc', async () => {
    const claims = makeClaims(testUser);

    const { workspaceId } = await ensureUserProvisioned(claims);

    const userDoc = await readDoc(`users/${testUser.uid}`);
    const ownedWorkspaces = userDoc!.ownedWorkspaces as string[];
    expect(ownedWorkspaces).toContain(workspaceId);
  });

  it('carries existing player count into workspace usage.playerCount', async () => {
    // Seed two players under this user before provisioning.
    await seedPlayer(testUser.uid);
    await seedPlayer(testUser.uid);

    const claims = makeClaims(testUser);
    const { workspaceId } = await ensureUserProvisioned(claims);

    const workspaceDoc = await readDoc(`workspaces/${workspaceId}`);
    const usage = workspaceDoc!.usage as { playerCount: number };
    expect(usage.playerCount).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Fast path: user doc + workspace both present
  // -------------------------------------------------------------------------

  it('returns existing userId and workspaceId on the fast path without re-creating docs', async () => {
    // Seed user and workspace so both exist already.
    await seedUserProfile(testUser.uid, {
      email: testUser.email,
      firstName: 'Existing',
      lastName: 'User',
      emailVerified: true,
    });
    const existingWorkspaceId = await seedWorkspace(testUser.uid);

    const claims = makeClaims(testUser);
    const result = await ensureUserProvisioned(claims);

    expect(result.userId).toBe(testUser.uid);
    expect(result.workspaceId).toBe(existingWorkspaceId);

    // Confirm no extra workspace was created.
    const userDoc = await readDoc(`users/${testUser.uid}`);
    const ownedWorkspaces = userDoc!.ownedWorkspaces as string[];
    // seedWorkspace writes exactly one entry; fast path should not append another.
    expect(ownedWorkspaces.length).toBe(1);
    expect(ownedWorkspaces[0]).toBe(existingWorkspaceId);
  });

  it('patches emailVerified drift on the fast path without touching other fields', async () => {
    await seedUserProfile(testUser.uid, {
      email: testUser.email,
      firstName: 'Drift',
      lastName: 'Test',
      // Stored as false even though Auth says true.
      emailVerified: false,
    });
    await seedWorkspace(testUser.uid);

    // Claims say email_verified: true — should trigger a patch.
    const claims = makeClaims(testUser, { email_verified: true });

    await ensureUserProvisioned(claims);

    const userDoc = await readDoc(`users/${testUser.uid}`);
    expect(userDoc!.emailVerified).toBe(true);
    // Other fields must remain unchanged.
    expect(userDoc!.firstName).toBe('Drift');
    expect(userDoc!.lastName).toBe('Test');
  });

  // -------------------------------------------------------------------------
  // Edge: workspace referenced but missing
  // -------------------------------------------------------------------------

  it('creates a new workspace when the referenced defaultWorkspaceId doc is missing', async () => {
    // Seed user with a dangling (non-existent) workspace ID.
    const danglingWorkspaceId = 'workspace-that-does-not-exist';
    await seedUserProfile(testUser.uid, {
      email: testUser.email,
      firstName: 'Dangling',
      lastName: 'Ref',
      emailVerified: true,
      defaultWorkspaceId: danglingWorkspaceId,
      ownedWorkspaces: [danglingWorkspaceId],
    });
    // Do NOT create the workspace document.

    const claims = makeClaims(testUser);
    const result = await ensureUserProvisioned(claims);

    // Should have created a brand-new workspace.
    expect(result.workspaceId).not.toBe(danglingWorkspaceId);
    expect(result.workspaceId.length).toBeGreaterThan(0);

    const newWorkspaceDoc = await readDoc(`workspaces/${result.workspaceId}`);
    expect(newWorkspaceDoc).not.toBeNull();
    expect(newWorkspaceDoc!.plan).toBe('free');
    expect(newWorkspaceDoc!.status).toBe('trial');

    // User doc must now point to the new workspace.
    const userDoc = await readDoc(`users/${testUser.uid}`);
    expect(userDoc!.defaultWorkspaceId).toBe(result.workspaceId);
    const ownedWorkspaces = userDoc!.ownedWorkspaces as string[];
    expect(ownedWorkspaces).toContain(result.workspaceId);
  });
});
