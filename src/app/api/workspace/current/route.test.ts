/**
 * Tests for GET /api/workspace/current
 *
 * Covers: auth (401), not-found (404), happy path (200), error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockDashboardUser } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  authWithProfile: vi.fn(),
  adminDbGet: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authWithProfile: mocks.authWithProfile,
}));

// We mock the adminDb collection/doc chain used in this route.
// The route calls:
//   adminDb.collection('users').doc(uid).get()
//   adminDb.collection('workspaces').doc(workspaceId).get()

const makeDocRef = (getFn: () => Promise<unknown>) => ({
  get: getFn,
});

const makeCollectionRef = (docFn: (id: string) => { get: () => Promise<unknown> }) => ({
  doc: (id: string) => docFn(id),
});

// We track calls by collection name so we can control each independently.
let userDocGetFn = mocks.adminDbGet;
let workspaceDocGetFn = mocks.adminDbGet;

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn((collectionName: string) => {
      if (collectionName === 'users') {
        return {
          doc: vi.fn(() => ({ get: () => userDocGetFn() })),
        };
      }
      if (collectionName === 'workspaces') {
        return {
          doc: vi.fn(() => ({ get: () => workspaceDocGetFn() })),
        };
      }
      return {
        doc: vi.fn(() => ({ get: mocks.adminDbGet })),
      };
    }),
  },
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET } from './route';

// ---------------------------------------------------------------------------
// Firestore snapshot helpers
// ---------------------------------------------------------------------------

function makeUserDoc(data: Record<string, unknown> | null) {
  return {
    exists: data !== null,
    data: () => data,
  };
}

function makeWorkspaceDoc(
  data: Record<string, unknown> | null,
  id = 'workspace-123'
) {
  return {
    exists: data !== null,
    id,
    data: () => data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/workspace/current', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to the shared mock by default
    userDocGetFn = mocks.adminDbGet;
    workspaceDocGetFn = mocks.adminDbGet;
  });

  it('returns 401 when not authenticated', async () => {
    mocks.authWithProfile.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('UNAUTHORIZED');
  });

  it('returns 404 when user document does not exist', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());
    userDocGetFn = vi.fn().mockResolvedValue(makeUserDoc(null));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('USER_NOT_FOUND');
  });

  it('returns 404 when user has no defaultWorkspaceId', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());
    userDocGetFn = vi.fn().mockResolvedValue(makeUserDoc({ defaultWorkspaceId: null }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('NO_WORKSPACE');
  });

  it('returns 404 when workspace document does not exist', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());
    userDocGetFn = vi.fn().mockResolvedValue(makeUserDoc({ defaultWorkspaceId: 'ws-abc' }));
    workspaceDocGetFn = vi.fn().mockResolvedValue(makeWorkspaceDoc(null));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('WORKSPACE_NOT_FOUND');
  });

  it('returns workspace data on success', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());

    const fakeTimestamp = {
      toDate: () => new Date('2026-03-01T00:00:00.000Z'),
    };

    userDocGetFn = vi.fn().mockResolvedValue(
      makeUserDoc({ defaultWorkspaceId: 'workspace-123' })
    );
    workspaceDocGetFn = vi.fn().mockResolvedValue(
      makeWorkspaceDoc({
        name: 'Test Workspace',
        plan: 'starter',
        status: 'active',
        billing: {
          currentPeriodEnd: fakeTimestamp,
        },
        usage: { playerCount: 2 },
        createdAt: fakeTimestamp,
        updatedAt: fakeTimestamp,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.workspace).toMatchObject({
      id: 'workspace-123',
      name: 'Test Workspace',
      plan: 'starter',
      status: 'active',
    });
    expect(body.workspace.billing.currentPeriodEnd).toBe('2026-03-01T00:00:00.000Z');
    // Sensitive Stripe fields must NOT be exposed
    expect(body.workspace.billing.stripeCustomerId).toBeUndefined();
    expect(body.workspace.billing.stripeSubscriptionId).toBeUndefined();
  });

  it('handles null currentPeriodEnd gracefully', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());

    const fakeTimestamp = { toDate: () => new Date('2026-01-01') };

    userDocGetFn = vi.fn().mockResolvedValue(
      makeUserDoc({ defaultWorkspaceId: 'workspace-123' })
    );
    workspaceDocGetFn = vi.fn().mockResolvedValue(
      makeWorkspaceDoc({
        name: 'No Billing Workspace',
        plan: 'free',
        status: 'trial',
        billing: {}, // no currentPeriodEnd
        usage: {},
        createdAt: fakeTimestamp,
        updatedAt: fakeTimestamp,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspace.billing.currentPeriodEnd).toBeNull();
  });

  it('returns 500 when adminDb throws', async () => {
    mocks.authWithProfile.mockResolvedValue(createMockDashboardUser());
    userDocGetFn = vi.fn().mockRejectedValue(new Error('Firestore unavailable'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});
