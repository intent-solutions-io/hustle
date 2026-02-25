/**
 * Integration Tests: src/lib/auth.ts
 *
 * Tests auth(), authWithProfile(), and requireAuth() against real Firebase
 * Emulators. The only mock is next/headers cookies() — everything else
 * (verifySessionCookie, Firestore reads) hits the real emulator.
 *
 * Prerequisites:
 *   FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must be set.
 *   Run via: npx vitest run --config vitest.integration.config.mts src/lib/auth.integration.test.ts
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock next/headers before any module that imports it is loaded.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import {
  clearEmulators,
  createTestUser,
  seedUserProfile,
  seedWorkspace,
  type TestUser,
} from '@/test-utils/integration';
import { auth, authWithProfile, requireAuth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Point the mocked cookies() at a real session cookie value.
 */
async function mockSessionCookie(sessionCookie: string | null): Promise<void> {
  const { cookies } = await import('next/headers');
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === '__session' && sessionCookie !== null
        ? { value: sessionCookie }
        : undefined,
  } as any);
}

/**
 * Simulate no cookie being present at all.
 */
async function mockNoCookie(): Promise<void> {
  await mockSessionCookie(null);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('auth module — integration against Firebase Emulators', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    await clearEmulators();
    // Create a fresh, email-verified user for each test.
    testUser = await createTestUser({ emailVerified: true });
  });

  // -------------------------------------------------------------------------
  // auth()
  // -------------------------------------------------------------------------

  describe('auth()', () => {
    it('returns null when no session cookie is present', async () => {
      await mockNoCookie();

      const session = await auth();

      expect(session).toBeNull();
    });

    it('returns a valid Session from a real emulator session cookie', async () => {
      await mockSessionCookie(testUser.sessionCookie);

      const session = await auth();

      expect(session).not.toBeNull();
      expect(session!.user.id).toBe(testUser.uid);
      expect(session!.user.email).toBe(testUser.email);
      expect(session!.user.emailVerified).toBe(true);
    });

    it('returns null for a malformed / tampered session cookie', async () => {
      await mockSessionCookie('this-is-not-a-valid-cookie.at.all');

      const session = await auth();

      expect(session).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // authWithProfile()
  // -------------------------------------------------------------------------

  describe('authWithProfile()', () => {
    it('returns null when no session cookie is present', async () => {
      await mockNoCookie();

      const dashboardUser = await authWithProfile();

      expect(dashboardUser).toBeNull();
    });

    it('returns null when the user doc is missing from Firestore', async () => {
      // Valid session cookie but no /users/{uid} document seeded.
      await mockSessionCookie(testUser.sessionCookie);

      const dashboardUser = await authWithProfile();

      expect(dashboardUser).toBeNull();
    });

    it('returns the full DashboardUser when user doc exists in Firestore', async () => {
      await seedUserProfile(testUser.uid, {
        email: testUser.email,
        firstName: 'Jamie',
        lastName: 'Carragher',
        emailVerified: true,
      });
      await mockSessionCookie(testUser.sessionCookie);

      const dashboardUser = await authWithProfile();

      expect(dashboardUser).not.toBeNull();
      expect(dashboardUser!.uid).toBe(testUser.uid);
      expect(dashboardUser!.email).toBe(testUser.email);
      expect(dashboardUser!.firstName).toBe('Jamie');
      expect(dashboardUser!.lastName).toBe('Carragher');
      expect(dashboardUser!.emailVerified).toBe(true);
    });

    it('surfaces firstName and lastName fields exactly as stored', async () => {
      await seedUserProfile(testUser.uid, {
        email: testUser.email,
        firstName: 'Megan',
        lastName: 'Rapinoe',
      });
      await mockSessionCookie(testUser.sessionCookie);

      const dashboardUser = await authWithProfile();

      expect(dashboardUser!.firstName).toBe('Megan');
      expect(dashboardUser!.lastName).toBe('Rapinoe');
    });
  });

  // -------------------------------------------------------------------------
  // requireAuth()
  // -------------------------------------------------------------------------

  describe('requireAuth()', () => {
    it('throws "Unauthorized: No valid Firebase session" when no session cookie', async () => {
      await mockNoCookie();

      await expect(requireAuth()).rejects.toThrow('Unauthorized: No valid Firebase session');
    });

    it('throws when the user doc is missing (authWithProfile returns null)', async () => {
      // Valid session but no Firestore user doc → authWithProfile returns null.
      await mockSessionCookie(testUser.sessionCookie);

      await expect(requireAuth()).rejects.toThrow('Unauthorized: No valid Firebase session');
    });

    it('throws "Unauthorized: Email not verified" for an unverified user', async () => {
      const unverifiedUser = await createTestUser({ emailVerified: false });
      await seedUserProfile(unverifiedUser.uid, {
        email: unverifiedUser.email,
        emailVerified: false,
      });
      await mockSessionCookie(unverifiedUser.sessionCookie);

      await expect(requireAuth()).rejects.toThrow('Unauthorized: Email not verified');
    });

    it('returns the DashboardUser when authenticated and email is verified', async () => {
      await seedUserProfile(testUser.uid, {
        email: testUser.email,
        firstName: 'Alex',
        lastName: 'Morgan',
        emailVerified: true,
      });
      await mockSessionCookie(testUser.sessionCookie);

      const dashboardUser = await requireAuth();

      expect(dashboardUser.uid).toBe(testUser.uid);
      expect(dashboardUser.email).toBe(testUser.email);
      expect(dashboardUser.emailVerified).toBe(true);
      expect(dashboardUser.firstName).toBe('Alex');
      expect(dashboardUser.lastName).toBe('Morgan');
    });
  });
});
