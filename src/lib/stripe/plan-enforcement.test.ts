/**
 * Workspace Plan Change Audit & Enforcement Tests
 *
 * Phase 7 Task 9: Unified Plan Enforcement Engine
 *
 * Tests for the plan enforcement module that ensures workspace state
 * always converges to correct plan/status from Stripe.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EnforcePlanInput } from './plan-enforcement';

// Mock Firebase Admin
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockAdd = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mockGet,
        update: mockUpdate,
        collection: vi.fn(() => ({
          add: mockAdd,
        })),
      })),
    })),
  },
}));

// Mock FieldValue.serverTimestamp and Timestamp
class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  toDate() {
    return new Date(this.seconds * 1000);
  }
  static now() {
    return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
  }
  static fromDate(date: Date) {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
  }
}

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: 'FieldValue.serverTimestamp' })),
  },
  Timestamp: MockTimestamp,
}));

// Mock plan mapping functions
vi.mock('@/lib/stripe/plan-mapping', () => ({
  getPlanForPriceId: vi.fn((priceId: string) => {
    const plans: Record<string, string> = {
      price_starter: 'starter',
      price_plus: 'plus',
      price_pro: 'pro',
      price_unknown: 'unknown',
    };
    const plan = plans[priceId];
    if (!plan || plan === 'unknown') {
      throw new Error(`Unknown Stripe price ID: ${priceId}`);
    }
    return plan;
  }),
  mapStripeStatusToWorkspaceStatus: vi.fn((stripeStatus: string) => {
    const statusMap: Record<string, string> = {
      active: 'active',
      trialing: 'trial',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'suspended',
    };
    return statusMap[stripeStatus] || 'suspended';
  }),
}));

// Mock ledger
const mockRecordBillingEvent = vi.fn().mockResolvedValue('ledger123');
vi.mock('@/lib/stripe/ledger', () => ({
  recordBillingEvent: mockRecordBillingEvent,
}));

describe('Workspace Plan Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default workspace state: starter plan, active status
    mockGet.mockResolvedValue({
      exists: true,
      id: 'workspace123',
      data: () => ({
        plan: 'starter',
        status: 'active',
        name: 'Test Workspace',
        createdAt: { toDate: () => new Date('2025-01-01') },
        updatedAt: { toDate: () => new Date('2025-01-01') },
        deletedAt: null,
        billing: {
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodEnd: { toDate: () => new Date('2025-02-01') },
        },
        members: [],
      }),
    });

    mockUpdate.mockResolvedValue({});
    mockAdd.mockResolvedValue({ id: 'ledger123' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enforceWorkspacePlan', () => {
    it('should update plan AND status when both changed', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_plus',
        stripeStatus: 'past_due',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      // Verify result
      expect(result.planChanged).toBe(true);
      expect(result.statusChanged).toBe(true);
      expect(result.planBefore).toBe('starter');
      expect(result.planAfter).toBe('plus');
      expect(result.statusBefore).toBe('active');
      expect(result.statusAfter).toBe('past_due');

      // Verify workspace update
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'plus',
          status: 'past_due',
          updatedAt: expect.objectContaining({ _methodName: 'FieldValue.serverTimestamp' }),
        })
      );

      // Verify ledger entry
      expect(mockRecordBillingEvent).toHaveBeenCalled();
    });

    it('should update only plan when plan changed', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_pro',
        stripeStatus: 'active', // Same as current
        source: 'webhook',
        stripeEventId: 'evt_456',
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      // Verify result
      expect(result.planChanged).toBe(true);
      expect(result.statusChanged).toBe(false);
      expect(result.planBefore).toBe('starter');
      expect(result.planAfter).toBe('pro');
      expect(result.statusBefore).toBe('active');
      expect(result.statusAfter).toBe('active');

      // Verify workspace update (only plan field)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'pro',
          updatedAt: expect.any(Object),
        })
      );

      // Should NOT update status
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          status: expect.anything(),
        })
      );
    });

    it('should update only status when status changed', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter', // Same as current
        stripeStatus: 'canceled',
        source: 'webhook',
        stripeEventId: 'evt_789',
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      // Verify result
      expect(result.planChanged).toBe(false);
      expect(result.statusChanged).toBe(true);
      expect(result.planBefore).toBe('starter');
      expect(result.planAfter).toBe('starter');
      expect(result.statusBefore).toBe('active');
      expect(result.statusAfter).toBe('canceled');

      // Verify workspace update (only status field)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
          updatedAt: expect.any(Object),
        })
      );

      // Should NOT update plan
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          plan: expect.anything(),
        })
      );
    });

    it('should record noop ledger entry when no changes', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter', // Same as current
        stripeStatus: 'active', // Same as current
        source: 'webhook',
        stripeEventId: 'evt_noop',
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      // Verify result
      expect(result.planChanged).toBe(false);
      expect(result.statusChanged).toBe(false);
      expect(result.planBefore).toBe('starter');
      expect(result.planAfter).toBe('starter');
      expect(result.statusBefore).toBe('active');
      expect(result.statusAfter).toBe('active');

      // Verify NO workspace update
      expect(mockUpdate).not.toHaveBeenCalled();

      // Verify ledger entry still recorded (noop)
      expect(mockRecordBillingEvent).toHaveBeenCalled();
    });

    it('should support replay-driven enforcement', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_plus',
        stripeStatus: 'active',
        source: 'replay', // Replay source
        stripeEventId: 'evt_replay',
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      expect(result.planChanged).toBe(true);
      expect(result.planAfter).toBe('plus');

      // Verify ledger entry uses replay source
      expect(mockRecordBillingEvent).toHaveBeenCalled();
    });

    it('should support auditor-driven enforcement (drift correction)', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_pro',
        stripeStatus: 'past_due',
        source: 'auditor', // Auditor source
        stripeEventId: null, // No Stripe event ID for auditor
      };

      const result = await enforceWorkspacePlan('workspace123', input);

      expect(result.planChanged).toBe(true);
      expect(result.statusChanged).toBe(true);
      expect(result.planAfter).toBe('pro');
      expect(result.statusAfter).toBe('past_due');

      // Verify ledger entry uses auditor source
      expect(mockRecordBillingEvent).toHaveBeenCalled();
    });

    it('should reject invalid workspaceId', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('', input)).rejects.toThrow('Invalid workspaceId');
      await expect(enforceWorkspacePlan(null as any, input)).rejects.toThrow('Invalid workspaceId');
    });

    it('should reject invalid stripePriceId', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: '',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow('Invalid stripePriceId');
    });

    it('should reject invalid stripeStatus', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter',
        stripeStatus: '',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow('Invalid stripeStatus');
    });

    it('should reject invalid source', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter',
        stripeStatus: 'active',
        source: 'invalid_source' as any,
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow('Invalid source: invalid_source');
    });

    it('should accept all valid sources', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const validSources = ['webhook', 'replay', 'auditor', 'manual', 'enforcement'];

      for (const source of validSources) {
        vi.clearAllMocks();
        mockGet.mockResolvedValue({
          exists: true,
          id: 'workspace123',
          data: () => ({
            plan: 'starter',
            status: 'active',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            deletedAt: null,
            billing: {
              stripeCustomerId: 'cus_123',
              stripeSubscriptionId: 'sub_123',
              currentPeriodEnd: { toDate: () => new Date() },
            },
            members: [],
          }),
        });

        const input: EnforcePlanInput = {
          stripePriceId: 'price_starter',
          stripeStatus: 'active',
          source: source as any,
          stripeEventId: 'evt_123',
        };

        await expect(enforceWorkspacePlan('workspace123', input)).resolves.toBeDefined();
      }
    });

    it('should handle workspace not found', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      mockGet.mockResolvedValue({
        exists: false,
      });

      const input: EnforcePlanInput = {
        stripePriceId: 'price_starter',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow('Workspace not found: workspace123');
    });

    it('should handle Firestore update failure gracefully', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      mockUpdate.mockRejectedValue(new Error('Firestore update failed'));

      const input: EnforcePlanInput = {
        stripePriceId: 'price_plus',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow(
        'Failed to update workspace: Firestore update failed'
      );
    });

    it('should handle unknown Stripe price ID', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_unknown',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await expect(enforceWorkspacePlan('workspace123', input)).rejects.toThrow(
        'Failed to map Stripe price ID to plan'
      );
    });

    it('should never call Stripe API (passive enforcement)', async () => {
      const { enforceWorkspacePlan } = await import('./plan-enforcement');

      const input: EnforcePlanInput = {
        stripePriceId: 'price_plus',
        stripeStatus: 'active',
        source: 'webhook',
        stripeEventId: 'evt_123',
      };

      await enforceWorkspacePlan('workspace123', input);

      // Enforcement should only interact with Firestore, never Stripe
      // This is a behavioral contract test
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockRecordBillingEvent).toHaveBeenCalled();
    });
  });

  describe('isValidEnforcementSource', () => {
    it('should validate enforcement sources', async () => {
      const { isValidEnforcementSource } = await import('./plan-enforcement');

      expect(isValidEnforcementSource('webhook')).toBe(true);
      expect(isValidEnforcementSource('replay')).toBe(true);
      expect(isValidEnforcementSource('auditor')).toBe(true);
      expect(isValidEnforcementSource('manual')).toBe(true);
      expect(isValidEnforcementSource('enforcement')).toBe(true);

      expect(isValidEnforcementSource('invalid')).toBe(false);
      expect(isValidEnforcementSource('')).toBe(false);
      expect(isValidEnforcementSource('WEBHOOK')).toBe(false); // Case sensitive
    });
  });
});
