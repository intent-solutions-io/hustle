/**
 * Firebase Admin Workspaces Service Tests
 *
 * Tests for all exported functions in admin-services/workspaces.ts.
 * Covers workspace lookup, billing updates, status changes, and usage counters.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  queryGet: vi.fn(),
  increment: vi.fn((n: number) => ({ _increment: n })),
}));

// Build chainable mock for the workspaces collection
const mockDocRef = vi.hoisted(() => ({
  get: mocks.get,
  update: mocks.update,
}));

const mockWhereChain = vi.hoisted(() => ({
  limit: vi.fn(() => ({ get: mocks.queryGet })),
}));

const mockCollectionRef = vi.hoisted(() => ({
  doc: vi.fn(() => mockDocRef),
  where: vi.fn(() => mockWhereChain),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => mockCollectionRef),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: mocks.increment,
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getWorkspaceByIdAdmin,
  getWorkspaceByStripeCustomerIdAdmin,
  updateWorkspaceBillingAdmin,
  updateWorkspaceStatusAdmin,
  incrementWorkspacePlayerCountAdmin,
  incrementWorkspaceGamesThisMonthAdmin,
  updateWorkspaceStorageUsageAdmin,
} from './workspaces';
import { adminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const WORKSPACE_ID = 'workspace-abc';

function makeTimestamp(date: Date) {
  return { toDate: () => date };
}

function makeWorkspaceData(overrides: Record<string, unknown> = {}) {
  const now = new Date('2025-03-01T00:00:00.000Z');
  return {
    ownerUserId: 'user-123',
    name: 'Test Workspace',
    plan: 'starter',
    status: 'active',
    billing: {
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      currentPeriodEnd: makeTimestamp(new Date('2026-03-01')),
    },
    members: [
      {
        userId: 'user-123',
        email: 'owner@example.com',
        role: 'owner',
        addedAt: makeTimestamp(now),
        addedBy: 'user-123',
      },
    ],
    usage: { playerCount: 2, gamesThisMonth: 5, storageUsedMB: 10 },
    createdAt: makeTimestamp(now),
    updatedAt: makeTimestamp(now),
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getWorkspaceByIdAdmin
// ---------------------------------------------------------------------------

describe('getWorkspaceByIdAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('returns null when workspace document does not exist', async () => {
    mocks.get.mockResolvedValue({ exists: false });

    const result = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(result).toBeNull();
  });

  it('returns a Workspace object when document exists', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      id: WORKSPACE_ID,
      data: () => makeWorkspaceData(),
    });

    const workspace = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(workspace).not.toBeNull();
    expect(workspace!.id).toBe(WORKSPACE_ID);
    expect(workspace!.name).toBe('Test Workspace');
    expect(workspace!.plan).toBe('starter');
    expect(workspace!.status).toBe('active');
  });

  it('converts Timestamp billing.currentPeriodEnd to Date', async () => {
    const periodEnd = new Date('2026-06-01');
    mocks.get.mockResolvedValue({
      exists: true,
      id: WORKSPACE_ID,
      data: () =>
        makeWorkspaceData({
          billing: {
            stripeCustomerId: 'cus_x',
            stripeSubscriptionId: 'sub_x',
            currentPeriodEnd: makeTimestamp(periodEnd),
          },
        }),
    });

    const workspace = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(workspace!.billing.currentPeriodEnd).toBeInstanceOf(Date);
    expect(workspace!.billing.currentPeriodEnd!.getFullYear()).toBe(2026);
  });

  it('returns null billing.currentPeriodEnd when absent', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      id: WORKSPACE_ID,
      data: () =>
        makeWorkspaceData({
          billing: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        }),
    });

    const workspace = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(workspace!.billing.currentPeriodEnd).toBeNull();
  });

  it('converts member addedAt Timestamps to Dates', async () => {
    const addedAt = new Date('2025-01-10');
    mocks.get.mockResolvedValue({
      exists: true,
      id: WORKSPACE_ID,
      data: () =>
        makeWorkspaceData({
          members: [
            {
              userId: 'u1',
              email: 'member@example.com',
              role: 'member',
              addedAt: makeTimestamp(addedAt),
              addedBy: 'u0',
            },
          ],
        }),
    });

    const workspace = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(workspace!.members[0].addedAt).toBeInstanceOf(Date);
    expect(workspace!.members[0].addedAt.getFullYear()).toBe(2025);
  });

  it('returns empty members array when members field is absent', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      id: WORKSPACE_ID,
      data: () => makeWorkspaceData({ members: undefined }),
    });

    const workspace = await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(workspace!.members).toEqual([]);
  });

  it('queries the workspaces collection with the correct workspace ID', async () => {
    mocks.get.mockResolvedValue({ exists: false });
    const spy = vi.spyOn(adminDb, 'collection');

    await getWorkspaceByIdAdmin(WORKSPACE_ID);

    expect(spy).toHaveBeenCalledWith('workspaces');
    expect(mockCollectionRef.doc).toHaveBeenCalledWith(WORKSPACE_ID);
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceByStripeCustomerIdAdmin
// ---------------------------------------------------------------------------

describe('getWorkspaceByStripeCustomerIdAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.where.mockReturnValue(mockWhereChain);
    mockWhereChain.limit.mockReturnValue({ get: mocks.queryGet });
  });

  it('returns null when no matching workspace exists', async () => {
    mocks.queryGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await getWorkspaceByStripeCustomerIdAdmin('cus_unknown');

    expect(result).toBeNull();
  });

  it('returns the first matching workspace', async () => {
    mocks.queryGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: WORKSPACE_ID,
          data: () => makeWorkspaceData(),
        },
      ],
    });

    const workspace = await getWorkspaceByStripeCustomerIdAdmin('cus_test');

    expect(workspace).not.toBeNull();
    expect(workspace!.id).toBe(WORKSPACE_ID);
    expect(workspace!.billing.stripeCustomerId).toBe('cus_test');
  });

  it('queries with the correct Stripe customer ID filter', async () => {
    mocks.queryGet.mockResolvedValue({ empty: true, docs: [] });

    await getWorkspaceByStripeCustomerIdAdmin('cus_abc123');

    expect(mockCollectionRef.where).toHaveBeenCalledWith(
      'billing.stripeCustomerId',
      '==',
      'cus_abc123'
    );
    expect(mockWhereChain.limit).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// updateWorkspaceBillingAdmin
// ---------------------------------------------------------------------------

describe('updateWorkspaceBillingAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mocks.update.mockResolvedValue(undefined);
  });

  it('updates stripeCustomerId when provided', async () => {
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, { stripeCustomerId: 'cus_new' });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg['billing.stripeCustomerId']).toBe('cus_new');
  });

  it('updates stripeSubscriptionId when provided', async () => {
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, { stripeSubscriptionId: 'sub_new' });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg['billing.stripeSubscriptionId']).toBe('sub_new');
  });

  it('updates currentPeriodEnd when provided', async () => {
    const periodEnd = new Date('2026-12-31');
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, { currentPeriodEnd: periodEnd });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg['billing.currentPeriodEnd']).toEqual(periodEnd);
  });

  it('supports setting fields to null', async () => {
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg['billing.stripeCustomerId']).toBeNull();
    expect(updateArg['billing.stripeSubscriptionId']).toBeNull();
    expect(updateArg['billing.currentPeriodEnd']).toBeNull();
  });

  it('omits undefined billing fields from the update', async () => {
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, { stripeCustomerId: 'cus_only' });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('billing.stripeSubscriptionId');
    expect(updateArg).not.toHaveProperty('billing.currentPeriodEnd');
  });

  it('always includes updatedAt in the update', async () => {
    await updateWorkspaceBillingAdmin(WORKSPACE_ID, {});

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });

  it('resolves with void on success', async () => {
    await expect(updateWorkspaceBillingAdmin(WORKSPACE_ID, {})).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateWorkspaceStatusAdmin
// ---------------------------------------------------------------------------

describe('updateWorkspaceStatusAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mocks.update.mockResolvedValue(undefined);
  });

  it('updates the workspace status and sets updatedAt', async () => {
    await updateWorkspaceStatusAdmin(WORKSPACE_ID, 'past_due');

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.status).toBe('past_due');
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });

  it('handles all valid workspace statuses', async () => {
    const statuses = ['active', 'trial', 'past_due', 'canceled', 'suspended', 'deleted'] as const;

    for (const status of statuses) {
      vi.clearAllMocks();
      await updateWorkspaceStatusAdmin(WORKSPACE_ID, status);
      const updateArg = mocks.update.mock.calls[0][0];
      expect(updateArg.status).toBe(status);
    }
  });

  it('resolves with void on success', async () => {
    await expect(updateWorkspaceStatusAdmin(WORKSPACE_ID, 'active')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// incrementWorkspacePlayerCountAdmin
// ---------------------------------------------------------------------------

describe('incrementWorkspacePlayerCountAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mocks.update.mockResolvedValue(undefined);
  });

  it('increments player count by 1 by default', async () => {
    await incrementWorkspacePlayerCountAdmin(WORKSPACE_ID);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(mocks.increment).toHaveBeenCalledWith(1);
    expect(updateArg['usage.playerCount']).toEqual({ _increment: 1 });
  });

  it('increments by custom delta when provided', async () => {
    await incrementWorkspacePlayerCountAdmin(WORKSPACE_ID, 3);

    expect(mocks.increment).toHaveBeenCalledWith(3);
    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg['usage.playerCount']).toEqual({ _increment: 3 });
  });

  it('supports negative delta (decrement)', async () => {
    await incrementWorkspacePlayerCountAdmin(WORKSPACE_ID, -1);

    expect(mocks.increment).toHaveBeenCalledWith(-1);
  });

  it('includes updatedAt in the update', async () => {
    await incrementWorkspacePlayerCountAdmin(WORKSPACE_ID);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// incrementWorkspaceGamesThisMonthAdmin
// ---------------------------------------------------------------------------

describe('incrementWorkspaceGamesThisMonthAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mocks.update.mockResolvedValue(undefined);
  });

  it('increments gamesThisMonth by 1 by default', async () => {
    await incrementWorkspaceGamesThisMonthAdmin(WORKSPACE_ID);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(mocks.increment).toHaveBeenCalledWith(1);
    expect(updateArg['usage.gamesThisMonth']).toEqual({ _increment: 1 });
  });

  it('increments by custom delta when provided', async () => {
    await incrementWorkspaceGamesThisMonthAdmin(WORKSPACE_ID, 5);

    expect(mocks.increment).toHaveBeenCalledWith(5);
  });

  it('includes updatedAt in the update', async () => {
    await incrementWorkspaceGamesThisMonthAdmin(WORKSPACE_ID);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// updateWorkspaceStorageUsageAdmin
// ---------------------------------------------------------------------------

describe('updateWorkspaceStorageUsageAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mocks.update.mockResolvedValue(undefined);
  });

  it('increments storageUsedMB by the given delta', async () => {
    await updateWorkspaceStorageUsageAdmin(WORKSPACE_ID, 12.5);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(mocks.increment).toHaveBeenCalledWith(12.5);
    expect(updateArg['usage.storageUsedMB']).toEqual({ _increment: 12.5 });
  });

  it('supports negative delta for storage removal', async () => {
    await updateWorkspaceStorageUsageAdmin(WORKSPACE_ID, -5);

    expect(mocks.increment).toHaveBeenCalledWith(-5);
  });

  it('includes updatedAt in the update', async () => {
    await updateWorkspaceStorageUsageAdmin(WORKSPACE_ID, 1);

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });

  it('resolves with void on success', async () => {
    await expect(updateWorkspaceStorageUsageAdmin(WORKSPACE_ID, 10)).resolves.toBeUndefined();
  });
});
