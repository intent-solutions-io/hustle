/**
 * Integration Tests: Workspace Current API Route (GET /api/workspace/current)
 *
 * Tests the full route handler with real Firestore data.
 * Only mock: next/headers cookies().
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearEmulators,
  createTestUser,
  seedUserProfile,
  seedWorkspace,
  type TestUser,
} from '@/test-utils/integration';

// Mock next/headers to inject real session cookie
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('GET /api/workspace/current (Integration)', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    await clearEmulators();
    testUser = await createTestUser();

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => name === '__session' ? { value: testUser.sessionCookie } : undefined,
    } as any);
  });

  it('returns 401 when not authenticated', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as any);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns 404 when user has no workspace', async () => {
    await seedUserProfile(testUser.uid, {
      email: testUser.email,
      defaultWorkspaceId: null,
    });

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it('returns workspace data with correct fields', async () => {
    await seedUserProfile(testUser.uid, { email: testUser.email });
    const workspaceId = await seedWorkspace(testUser.uid, {
      name: 'Johnson Family Stats',
      plan: 'plus',
      status: 'active',
      usage: { playerCount: 3, gamesThisMonth: 12, storageUsedMB: 25 },
    });

    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.workspace.id).toBe(workspaceId);
    expect(data.workspace.name).toBe('Johnson Family Stats');
    expect(data.workspace.plan).toBe('plus');
    expect(data.workspace.status).toBe('active');
    expect(data.workspace.usage.playerCount).toBe(3);
    expect(data.workspace.usage.gamesThisMonth).toBe(12);
  });

  it('does not expose Stripe IDs to client', async () => {
    await seedUserProfile(testUser.uid, { email: testUser.email });
    await seedWorkspace(testUser.uid, {
      billing: {
        stripeCustomerId: 'cus_secret',
        stripeSubscriptionId: 'sub_secret',
        currentPeriodEnd: null,
      },
    });

    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    // Billing object should not contain Stripe IDs
    expect(data.workspace.billing.stripeCustomerId).toBeUndefined();
    expect(data.workspace.billing.stripeSubscriptionId).toBeUndefined();
  });
});
