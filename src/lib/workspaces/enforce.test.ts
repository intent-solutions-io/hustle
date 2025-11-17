/**
 * Workspace Status Enforcement Tests
 *
 * Phase 6 Task 5: Runtime enforcement of workspace status
 *
 * Tests the assertWorkspaceActive() guard function for all workspace statuses.
 */

import { describe, it, expect } from 'vitest';
import {
  assertWorkspaceActive,
  getNextStep,
  getStatusErrorMessage,
  isWorkspaceWritable,
  isWorkspaceReadable,
} from '@/lib/workspaces/enforce';
import { WorkspaceAccessError } from '@/lib/firebase/access-control';
import type { Workspace, WorkspaceStatus } from '@/types/firestore';

// Helper to create a test workspace with specific status
function createTestWorkspace(status: WorkspaceStatus): Workspace {
  return {
    id: 'test-workspace-id',
    ownerUserId: 'test-user-id',
    name: 'Test Workspace',
    plan: 'starter',
    status,
    members: [],
    billing: {
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    usage: {
      playerCount: 5,
      gamesThisMonth: 10,
      storageUsedMB: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('assertWorkspaceActive', () => {
  describe('Allowed statuses', () => {
    it('should allow active workspace', () => {
      const workspace = createTestWorkspace('active');
      expect(() => assertWorkspaceActive(workspace)).not.toThrow();
    });

    it('should allow trial workspace', () => {
      const workspace = createTestWorkspace('trial');
      expect(() => assertWorkspaceActive(workspace)).not.toThrow();
    });
  });

  describe('Blocked statuses', () => {
    it('should block past_due workspace', () => {
      const workspace = createTestWorkspace('past_due');

      expect(() => assertWorkspaceActive(workspace)).toThrow(WorkspaceAccessError);

      try {
        assertWorkspaceActive(workspace);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceAccessError);
        expect((error as WorkspaceAccessError).code).toBe('PAYMENT_PAST_DUE');
        expect((error as WorkspaceAccessError).status).toBe('past_due');
        expect((error as WorkspaceAccessError).httpStatus).toBe(403);
      }
    });

    it('should block canceled workspace', () => {
      const workspace = createTestWorkspace('canceled');

      expect(() => assertWorkspaceActive(workspace)).toThrow(WorkspaceAccessError);

      try {
        assertWorkspaceActive(workspace);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceAccessError);
        expect((error as WorkspaceAccessError).code).toBe('SUBSCRIPTION_CANCELED');
        expect((error as WorkspaceAccessError).status).toBe('canceled');
        expect((error as WorkspaceAccessError).httpStatus).toBe(403);
      }
    });

    it('should block suspended workspace', () => {
      const workspace = createTestWorkspace('suspended');

      expect(() => assertWorkspaceActive(workspace)).toThrow(WorkspaceAccessError);

      try {
        assertWorkspaceActive(workspace);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceAccessError);
        expect((error as WorkspaceAccessError).code).toBe('ACCOUNT_SUSPENDED');
        expect((error as WorkspaceAccessError).status).toBe('suspended');
        expect((error as WorkspaceAccessError).httpStatus).toBe(403);
      }
    });

    it('should block deleted workspace', () => {
      const workspace = createTestWorkspace('deleted');

      expect(() => assertWorkspaceActive(workspace)).toThrow(WorkspaceAccessError);

      try {
        assertWorkspaceActive(workspace);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceAccessError);
        expect((error as WorkspaceAccessError).code).toBe('WORKSPACE_DELETED');
        expect((error as WorkspaceAccessError).status).toBe('deleted');
        expect((error as WorkspaceAccessError).httpStatus).toBe(403);
      }
    });
  });

  describe('Error message structure', () => {
    it('should return structured JSON error for past_due', () => {
      const workspace = createTestWorkspace('past_due');

      try {
        assertWorkspaceActive(workspace);
      } catch (error) {
        const json = (error as WorkspaceAccessError).toJSON();
        expect(json).toHaveProperty('error', 'PAYMENT_PAST_DUE');
        expect(json).toHaveProperty('message');
        expect(json).toHaveProperty('status', 'past_due');
      }
    });
  });
});

describe('getNextStep', () => {
  it('should return "update_payment" for past_due', () => {
    expect(getNextStep('past_due')).toBe('update_payment');
  });

  it('should return "upgrade" for canceled', () => {
    expect(getNextStep('canceled')).toBe('upgrade');
  });

  it('should return "contact_support" for suspended', () => {
    expect(getNextStep('suspended')).toBe('contact_support');
  });

  it('should return "contact_support" for deleted', () => {
    expect(getNextStep('deleted')).toBe('contact_support');
  });

  it('should return null for active', () => {
    expect(getNextStep('active')).toBeNull();
  });

  it('should return null for trial', () => {
    expect(getNextStep('trial')).toBeNull();
  });
});

describe('getStatusErrorMessage', () => {
  it('should return user-friendly message for past_due', () => {
    const message = getStatusErrorMessage('past_due');
    expect(message).toContain('payment');
    expect(message).toContain('past due');
  });

  it('should return user-friendly message for canceled', () => {
    const message = getStatusErrorMessage('canceled');
    expect(message).toContain('canceled');
    expect(message).toContain('reactivate');
  });

  it('should return user-friendly message for suspended', () => {
    const message = getStatusErrorMessage('suspended');
    expect(message).toContain('suspended');
    expect(message).toContain('support');
  });

  it('should return user-friendly message for deleted', () => {
    const message = getStatusErrorMessage('deleted');
    expect(message).toContain('deleted');
  });
});

describe('isWorkspaceWritable', () => {
  it('should return true for active', () => {
    expect(isWorkspaceWritable('active')).toBe(true);
  });

  it('should return true for trial', () => {
    expect(isWorkspaceWritable('trial')).toBe(true);
  });

  it('should return false for past_due', () => {
    expect(isWorkspaceWritable('past_due')).toBe(false);
  });

  it('should return false for canceled', () => {
    expect(isWorkspaceWritable('canceled')).toBe(false);
  });

  it('should return false for suspended', () => {
    expect(isWorkspaceWritable('suspended')).toBe(false);
  });

  it('should return false for deleted', () => {
    expect(isWorkspaceWritable('deleted')).toBe(false);
  });
});

describe('isWorkspaceReadable', () => {
  it('should return true for active', () => {
    expect(isWorkspaceReadable('active')).toBe(true);
  });

  it('should return true for trial', () => {
    expect(isWorkspaceReadable('trial')).toBe(true);
  });

  it('should return true for past_due (grace period)', () => {
    expect(isWorkspaceReadable('past_due')).toBe(true);
  });

  it('should return false for canceled', () => {
    expect(isWorkspaceReadable('canceled')).toBe(false);
  });

  it('should return false for suspended', () => {
    expect(isWorkspaceReadable('suspended')).toBe(false);
  });

  it('should return false for deleted', () => {
    expect(isWorkspaceReadable('deleted')).toBe(false);
  });
});

describe('Integration: API route protection', () => {
  it('should prevent write operations on past_due workspace', () => {
    const workspace = createTestWorkspace('past_due');

    // Simulate API route check
    expect(() => {
      assertWorkspaceActive(workspace);
      // If we get here, write operation would proceed
    }).toThrow(WorkspaceAccessError);
  });

  it('should allow read operations to proceed (checked separately)', () => {
    const workspace = createTestWorkspace('past_due');

    // Read operations don't use assertWorkspaceActive,
    // they use isWorkspaceReadable() instead
    expect(isWorkspaceReadable(workspace.status)).toBe(true);
  });

  it('should block all operations on deleted workspace', () => {
    const workspace = createTestWorkspace('deleted');

    // Write operations blocked
    expect(() => assertWorkspaceActive(workspace)).toThrow(WorkspaceAccessError);

    // Read operations also blocked for deleted status
    expect(isWorkspaceReadable(workspace.status)).toBe(false);
  });
});
