/**
 * Firebase Access Control Tests
 *
 * Tests subscription-status-based access enforcement:
 * - checkWorkspaceAccess() for each workspace lifecycle status
 * - requireWorkspaceWriteAccess() throws WorkspaceAccessError when denied
 * - requireWorkspaceReadAccess() throws WorkspaceAccessError when denied
 * - WorkspaceAccessError shape and toJSON() output
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({ get: mockGet }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));
  return { mockGet, mockDoc, mockCollection };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('./admin', () => ({
  adminDb: {
    collection: mocks.mockCollection,
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  checkWorkspaceAccess,
  requireWorkspaceWriteAccess,
  requireWorkspaceReadAccess,
  WorkspaceAccessError,
} from './access-control';
import type { WorkspaceStatus } from '@/types/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockWorkspaceDoc(status: WorkspaceStatus | null, exists = true) {
  mocks.mockGet.mockResolvedValue({
    exists,
    data: () => (exists && status !== null ? { status } : null),
  });
}

// ---------------------------------------------------------------------------
// checkWorkspaceAccess
// ---------------------------------------------------------------------------

describe('checkWorkspaceAccess()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Active workspace
  it('allows read for active workspace', async () => {
    mockWorkspaceDoc('active');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('active');
  });

  it('allows write for active workspace', async () => {
    mockWorkspaceDoc('active');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(true);
  });

  // Trial workspace
  it('allows read for trial workspace', async () => {
    mockWorkspaceDoc('trial');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(true);
  });

  it('allows write for trial workspace', async () => {
    mockWorkspaceDoc('trial');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(true);
  });

  // Past due workspace (grace period: read only)
  it('allows read for past_due workspace (grace period)', async () => {
    mockWorkspaceDoc('past_due');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(true);
  });

  it('denies write for past_due workspace', async () => {
    mockWorkspaceDoc('past_due');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('PAYMENT_PAST_DUE');
    expect(result.status).toBe('past_due');
  });

  // Canceled workspace
  it('denies read for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SUBSCRIPTION_CANCELED');
  });

  it('denies write for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SUBSCRIPTION_CANCELED');
  });

  // Suspended workspace
  it('denies read for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCOUNT_SUSPENDED');
  });

  it('denies write for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCOUNT_SUSPENDED');
  });

  // Deleted workspace
  it('denies read for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    const result = await checkWorkspaceAccess('ws-1', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_DELETED');
  });

  it('denies write for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_DELETED');
  });

  // Workspace not found
  it('returns not allowed when workspace document does not exist', async () => {
    mockWorkspaceDoc(null, false);
    const result = await checkWorkspaceAccess('missing-ws', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_NOT_FOUND');
    expect(result.workspaceId).toBe('missing-ws');
  });

  // Workspace with no status field
  it('returns not allowed when workspace has no status field', async () => {
    mocks.mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ plan: 'starter' }), // no status field
    });
    const result = await checkWorkspaceAccess('ws-no-status', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('INVALID_WORKSPACE_STATUS');
  });

  // workspaceId is included in successful result
  it('includes workspaceId in result', async () => {
    mockWorkspaceDoc('active');
    const result = await checkWorkspaceAccess('ws-known', false);
    expect(result.workspaceId).toBe('ws-known');
  });

  // Firestore error
  it('returns not allowed when Firestore throws an error', async () => {
    mocks.mockGet.mockRejectedValue(new Error('Firestore unavailable'));
    const result = await checkWorkspaceAccess('ws-1', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCESS_CHECK_FAILED');
  });

  // Default write parameter
  it('defaults isWriteOperation to true', async () => {
    mockWorkspaceDoc('past_due');
    const result = await checkWorkspaceAccess('ws-1');
    expect(result.allowed).toBe(false); // past_due blocks writes
  });
});

// ---------------------------------------------------------------------------
// requireWorkspaceWriteAccess
// ---------------------------------------------------------------------------

describe('requireWorkspaceWriteAccess()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for active workspace', async () => {
    mockWorkspaceDoc('active');
    await expect(requireWorkspaceWriteAccess('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for trial workspace', async () => {
    mockWorkspaceDoc('trial');
    await expect(requireWorkspaceWriteAccess('ws-1')).resolves.toBeUndefined();
  });

  it('throws WorkspaceAccessError for past_due workspace', async () => {
    mockWorkspaceDoc('past_due');
    await expect(requireWorkspaceWriteAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws with PAYMENT_PAST_DUE code for past_due workspace', async () => {
    mockWorkspaceDoc('past_due');
    try {
      await requireWorkspaceWriteAccess('ws-1');
    } catch (err) {
      expect(err).toBeInstanceOf(WorkspaceAccessError);
      expect((err as WorkspaceAccessError).code).toBe('PAYMENT_PAST_DUE');
      expect((err as WorkspaceAccessError).httpStatus).toBe(403);
    }
  });

  it('throws WorkspaceAccessError for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    await expect(requireWorkspaceWriteAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    await expect(requireWorkspaceWriteAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });
});

// ---------------------------------------------------------------------------
// requireWorkspaceReadAccess
// ---------------------------------------------------------------------------

describe('requireWorkspaceReadAccess()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for active workspace', async () => {
    mockWorkspaceDoc('active');
    await expect(requireWorkspaceReadAccess('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for past_due workspace (read allowed in grace period)', async () => {
    mockWorkspaceDoc('past_due');
    await expect(requireWorkspaceReadAccess('ws-1')).resolves.toBeUndefined();
  });

  it('throws WorkspaceAccessError for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    await expect(requireWorkspaceReadAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    await expect(requireWorkspaceReadAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    await expect(requireWorkspaceReadAccess('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });
});

// ---------------------------------------------------------------------------
// WorkspaceAccessError class
// ---------------------------------------------------------------------------

describe('WorkspaceAccessError', () => {
  it('has the correct name property', () => {
    const err = new WorkspaceAccessError('PAYMENT_PAST_DUE', 'past_due');
    expect(err.name).toBe('WorkspaceAccessError');
  });

  it('stores the code passed to constructor', () => {
    const err = new WorkspaceAccessError('SUBSCRIPTION_CANCELED', 'canceled');
    expect(err.code).toBe('SUBSCRIPTION_CANCELED');
  });

  it('stores the status passed to constructor', () => {
    const err = new WorkspaceAccessError('ACCOUNT_SUSPENDED', 'suspended');
    expect(err.status).toBe('suspended');
  });

  it('always has httpStatus 403', () => {
    const err = new WorkspaceAccessError('ACCESS_DENIED', 'unknown');
    expect(err.httpStatus).toBe(403);
  });

  it('is an instance of Error', () => {
    const err = new WorkspaceAccessError('PAYMENT_PAST_DUE', 'past_due');
    expect(err).toBeInstanceOf(Error);
  });

  it('toJSON() returns error, message, and status fields', () => {
    const err = new WorkspaceAccessError('PAYMENT_PAST_DUE', 'past_due');
    const json = err.toJSON();
    expect(json).toHaveProperty('error', 'PAYMENT_PAST_DUE');
    expect(json).toHaveProperty('message');
    expect(typeof json.message).toBe('string');
    expect(json).toHaveProperty('status', 'past_due');
  });

  it('toJSON() error field matches the code', () => {
    const err = new WorkspaceAccessError('SUBSCRIPTION_CANCELED', 'canceled');
    expect(err.toJSON().error).toBe('SUBSCRIPTION_CANCELED');
  });

  it('toJSON() message is user-friendly (not empty)', () => {
    const err = new WorkspaceAccessError('PAYMENT_PAST_DUE', 'past_due');
    expect(err.toJSON().message.length).toBeGreaterThan(0);
  });
});
