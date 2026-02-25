/**
 * Workspace Status Guards Tests
 *
 * Tests granular assertion helpers for workspace lifecycle status:
 * - canWriteWithStatus() / canReadWithStatus() - synchronous boolean helpers
 * - getUpgradePrompt() - user-friendly messages per status
 * - assertWorkspaceActiveOrTrial() - throws for anything other than active/trial
 * - assertWorkspaceNotTerminated() - allows past_due, blocks canceled/suspended/deleted
 * - assertWorkspacePaymentCurrent() - allows active/trial only
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

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: mocks.mockCollection,
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  assertWorkspaceActiveOrTrial,
  assertWorkspaceNotTerminated,
  assertWorkspacePaymentCurrent,
  canWriteWithStatus,
  canReadWithStatus,
  getUpgradePrompt,
} from './guards';
import { WorkspaceAccessError } from '@/lib/firebase/access-control';
import type { WorkspaceStatus } from '@/types/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockWorkspaceDoc(status: WorkspaceStatus, trialEndsAt?: Date | null) {
  mocks.mockGet.mockResolvedValue({
    exists: true,
    id: 'ws-test',
    data: () => ({
      status,
      plan: 'starter',
      billing: { currentPeriodEnd: { toDate: () => new Date('2026-12-31') } },
      ...(trialEndsAt !== undefined
        ? { trialEndsAt: trialEndsAt ? { toDate: () => trialEndsAt } : null }
        : {}),
    }),
  });
}

function mockWorkspaceNotFound() {
  mocks.mockGet.mockResolvedValue({ exists: false });
}

// ---------------------------------------------------------------------------
// canWriteWithStatus
// ---------------------------------------------------------------------------

describe('canWriteWithStatus()', () => {
  it('returns true for active', () => {
    expect(canWriteWithStatus('active')).toBe(true);
  });

  it('returns true for trial', () => {
    expect(canWriteWithStatus('trial')).toBe(true);
  });

  it('returns false for past_due', () => {
    expect(canWriteWithStatus('past_due')).toBe(false);
  });

  it('returns false for canceled', () => {
    expect(canWriteWithStatus('canceled')).toBe(false);
  });

  it('returns false for suspended', () => {
    expect(canWriteWithStatus('suspended')).toBe(false);
  });

  it('returns false for deleted', () => {
    expect(canWriteWithStatus('deleted')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canReadWithStatus
// ---------------------------------------------------------------------------

describe('canReadWithStatus()', () => {
  it('returns true for active', () => {
    expect(canReadWithStatus('active')).toBe(true);
  });

  it('returns true for trial', () => {
    expect(canReadWithStatus('trial')).toBe(true);
  });

  it('returns true for past_due (grace period)', () => {
    expect(canReadWithStatus('past_due')).toBe(true);
  });

  it('returns false for canceled', () => {
    expect(canReadWithStatus('canceled')).toBe(false);
  });

  it('returns false for suspended', () => {
    expect(canReadWithStatus('suspended')).toBe(false);
  });

  it('returns false for deleted', () => {
    expect(canReadWithStatus('deleted')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getUpgradePrompt
// ---------------------------------------------------------------------------

describe('getUpgradePrompt()', () => {
  it('returns a message mentioning payment for past_due', () => {
    const message = getUpgradePrompt('past_due');
    expect(message.toLowerCase()).toContain('payment');
    expect(message.length).toBeGreaterThan(0);
  });

  it('returns a message mentioning cancellation for canceled', () => {
    const message = getUpgradePrompt('canceled');
    expect(message.toLowerCase()).toMatch(/cancel/);
  });

  it('returns a message mentioning support for suspended', () => {
    const message = getUpgradePrompt('suspended');
    expect(message.toLowerCase()).toContain('support');
  });

  it('returns a message mentioning deleted for deleted', () => {
    const message = getUpgradePrompt('deleted');
    expect(message.toLowerCase()).toContain('deleted');
  });

  it('returns a message mentioning trial/upgrade for trial', () => {
    const message = getUpgradePrompt('trial');
    expect(message.toLowerCase()).toMatch(/trial|upgrade/);
  });

  it('returns a non-empty default message for active', () => {
    const message = getUpgradePrompt('active');
    expect(message.length).toBeGreaterThan(0);
  });

  it('returns different messages for different statuses', () => {
    const messages = new Set([
      getUpgradePrompt('past_due'),
      getUpgradePrompt('canceled'),
      getUpgradePrompt('suspended'),
      getUpgradePrompt('deleted'),
      getUpgradePrompt('trial'),
    ]);
    // At least 3 distinct messages among the 5 error statuses
    expect(messages.size).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// assertWorkspaceActiveOrTrial
// ---------------------------------------------------------------------------

describe('assertWorkspaceActiveOrTrial()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for active workspace', async () => {
    mockWorkspaceDoc('active');
    await expect(assertWorkspaceActiveOrTrial('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for trial workspace with no expiry', async () => {
    mockWorkspaceDoc('trial', null);
    await expect(assertWorkspaceActiveOrTrial('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for trial workspace with future expiry', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    mockWorkspaceDoc('trial', future);
    await expect(assertWorkspaceActiveOrTrial('ws-1')).resolves.toBeUndefined();
  });

  it('throws WorkspaceAccessError for trial workspace with expired trial', async () => {
    const past = new Date(Date.now() - 1000);
    mockWorkspaceDoc('trial', past);
    await expect(assertWorkspaceActiveOrTrial('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for past_due workspace', async () => {
    mockWorkspaceDoc('past_due');
    await expect(assertWorkspaceActiveOrTrial('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws with PAYMENT_PAST_DUE code for past_due', async () => {
    mockWorkspaceDoc('past_due');
    try {
      await assertWorkspaceActiveOrTrial('ws-1');
    } catch (err) {
      expect(err).toBeInstanceOf(WorkspaceAccessError);
      expect((err as WorkspaceAccessError).code).toBe('PAYMENT_PAST_DUE');
    }
  });

  it('throws WorkspaceAccessError for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    await expect(assertWorkspaceActiveOrTrial('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    await expect(assertWorkspaceActiveOrTrial('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    await expect(assertWorkspaceActiveOrTrial('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError when workspace is not found', async () => {
    mockWorkspaceNotFound();
    await expect(assertWorkspaceActiveOrTrial('missing-ws')).rejects.toThrow(WorkspaceAccessError);
  });

  it('thrown error has httpStatus 403', async () => {
    mockWorkspaceDoc('canceled');
    try {
      await assertWorkspaceActiveOrTrial('ws-1');
    } catch (err) {
      expect((err as WorkspaceAccessError).httpStatus).toBe(403);
    }
  });
});

// ---------------------------------------------------------------------------
// assertWorkspaceNotTerminated
// ---------------------------------------------------------------------------

describe('assertWorkspaceNotTerminated()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for active workspace', async () => {
    mockWorkspaceDoc('active');
    await expect(assertWorkspaceNotTerminated('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for trial workspace', async () => {
    mockWorkspaceDoc('trial', null);
    await expect(assertWorkspaceNotTerminated('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for past_due workspace (grace period allowed)', async () => {
    mockWorkspaceDoc('past_due');
    await expect(assertWorkspaceNotTerminated('ws-1')).resolves.toBeUndefined();
  });

  it('throws WorkspaceAccessError for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    await expect(assertWorkspaceNotTerminated('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    await expect(assertWorkspaceNotTerminated('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    await expect(assertWorkspaceNotTerminated('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError when workspace is not found', async () => {
    mockWorkspaceNotFound();
    await expect(assertWorkspaceNotTerminated('missing-ws')).rejects.toThrow(WorkspaceAccessError);
  });

  it('thrown error for canceled has SUBSCRIPTION_CANCELED code', async () => {
    mockWorkspaceDoc('canceled');
    try {
      await assertWorkspaceNotTerminated('ws-1');
    } catch (err) {
      expect((err as WorkspaceAccessError).code).toBe('SUBSCRIPTION_CANCELED');
    }
  });

  it('thrown error for suspended has ACCOUNT_SUSPENDED code', async () => {
    mockWorkspaceDoc('suspended');
    try {
      await assertWorkspaceNotTerminated('ws-1');
    } catch (err) {
      expect((err as WorkspaceAccessError).code).toBe('ACCOUNT_SUSPENDED');
    }
  });
});

// ---------------------------------------------------------------------------
// assertWorkspacePaymentCurrent
// ---------------------------------------------------------------------------

describe('assertWorkspacePaymentCurrent()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for active workspace', async () => {
    mockWorkspaceDoc('active');
    await expect(assertWorkspacePaymentCurrent('ws-1')).resolves.toBeUndefined();
  });

  it('does not throw for trial workspace', async () => {
    mockWorkspaceDoc('trial', null);
    await expect(assertWorkspacePaymentCurrent('ws-1')).resolves.toBeUndefined();
  });

  it('throws WorkspaceAccessError for past_due workspace', async () => {
    mockWorkspaceDoc('past_due');
    await expect(assertWorkspacePaymentCurrent('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws with PAYMENT_PAST_DUE code for past_due', async () => {
    mockWorkspaceDoc('past_due');
    try {
      await assertWorkspacePaymentCurrent('ws-1');
    } catch (err) {
      expect((err as WorkspaceAccessError).code).toBe('PAYMENT_PAST_DUE');
    }
  });

  it('throws WorkspaceAccessError for canceled workspace', async () => {
    mockWorkspaceDoc('canceled');
    await expect(assertWorkspacePaymentCurrent('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for suspended workspace', async () => {
    mockWorkspaceDoc('suspended');
    await expect(assertWorkspacePaymentCurrent('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError for deleted workspace', async () => {
    mockWorkspaceDoc('deleted');
    await expect(assertWorkspacePaymentCurrent('ws-1')).rejects.toThrow(WorkspaceAccessError);
  });

  it('throws WorkspaceAccessError when workspace is not found', async () => {
    mockWorkspaceNotFound();
    await expect(assertWorkspacePaymentCurrent('missing-ws')).rejects.toThrow(WorkspaceAccessError);
  });
});
