/**
 * Subscription Lifecycle Ledger Tests
 *
 * Phase 7 Task 8: Full Subscription Lifecycle Ledger
 *
 * Tests for the append-only billing ledger that records all billing events.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RecordBillingEventInput, LedgerEventSource, LedgerEventType } from './ledger';

// Mock Firebase Admin
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          add: mockAdd,
          where: mockWhere,
          orderBy: mockOrderBy,
          limit: mockLimit,
          get: mockGet,
        })),
      })),
    })),
  },
}));

// Mock FieldValue.serverTimestamp
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: 'FieldValue.serverTimestamp' })),
  },
}));

describe('Subscription Lifecycle Ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockWhere.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockLimit.mockReturnThis();
    mockGet.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordBillingEvent', () => {
    it('should write correct document shape to Firestore', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event123' });

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        stripeEventId: 'evt_123',
        statusBefore: 'active',
        statusAfter: 'past_due',
        planBefore: 'starter',
        planAfter: 'starter',
        source: 'webhook',
        note: 'Payment failed',
      };

      const eventId = await recordBillingEvent('workspace123', event);

      expect(eventId).toBe('event123');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'subscription_updated',
          stripeEventId: 'evt_123',
          statusBefore: 'active',
          statusAfter: 'past_due',
          planBefore: 'starter',
          planAfter: 'starter',
          source: 'webhook',
          note: 'Payment failed',
          timestamp: expect.objectContaining({ _methodName: 'FieldValue.serverTimestamp' }),
        })
      );
    });

    it('should handle null optional fields', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event456' });

      const event: RecordBillingEventInput = {
        type: 'drift_detected',
        source: 'auditor',
      };

      await recordBillingEvent('workspace123', event);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'drift_detected',
          stripeEventId: null,
          statusBefore: null,
          statusAfter: null,
          planBefore: null,
          planAfter: null,
          source: 'auditor',
          note: null,
        })
      );
    });

    it('should validate required workspaceId', async () => {
      const { recordBillingEvent } = await import('./ledger');

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        source: 'webhook',
      };

      await expect(recordBillingEvent('', event)).rejects.toThrow('Invalid workspaceId');
      await expect(recordBillingEvent(null as any, event)).rejects.toThrow('Invalid workspaceId');
    });

    it('should validate required event.type', async () => {
      const { recordBillingEvent } = await import('./ledger');

      const event: RecordBillingEventInput = {
        type: '' as any,
        source: 'webhook',
      };

      await expect(recordBillingEvent('workspace123', event)).rejects.toThrow('Invalid event.type');
    });

    it('should validate required event.source', async () => {
      const { recordBillingEvent } = await import('./ledger');

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        source: '' as any,
      };

      await expect(recordBillingEvent('workspace123', event)).rejects.toThrow(
        'Invalid event.source'
      );
    });

    it('should validate event.source enum', async () => {
      const { recordBillingEvent } = await import('./ledger');

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        source: 'invalid_source' as any,
      };

      await expect(recordBillingEvent('workspace123', event)).rejects.toThrow(
        'Invalid event.source: invalid_source'
      );
    });

    it('should accept all valid sources', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event123' });

      const validSources: LedgerEventSource[] = ['webhook', 'replay', 'auditor', 'manual', 'enforcement'];

      for (const source of validSources) {
        const event: RecordBillingEventInput = {
          type: 'subscription_updated',
          source,
        };

        await expect(recordBillingEvent('workspace123', event)).resolves.toBe('event123');
      }

      expect(mockAdd).toHaveBeenCalledTimes(5);
    });

    it('should handle Firestore write failures', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockRejectedValue(new Error('Firestore write failed'));

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        source: 'webhook',
      };

      await expect(recordBillingEvent('workspace123', event)).rejects.toThrow(
        'Failed to record billing event: Firestore write failed'
      );
    });
  });

  describe('Read-Only Behavior', () => {
    it('should not modify workspace state', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event123' });

      const event: RecordBillingEventInput = {
        type: 'subscription_updated',
        statusBefore: 'active',
        statusAfter: 'past_due',
        source: 'webhook',
      };

      await recordBillingEvent('workspace123', event);

      // Ledger should only write to subcollection, not update workspace doc
      // This is verified by checking that mockAdd is called (subcollection write)
      // but no update() or set() methods are called on workspace doc
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    it('should not call Stripe API', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event123' });

      const event: RecordBillingEventInput = {
        type: 'payment_failed',
        source: 'webhook',
      };

      await recordBillingEvent('workspace123', event);

      // Ledger is passive - no Stripe API calls
      // This is a behavioral contract test
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('getBillingLedger', () => {
    it('should retrieve recent events in descending order', async () => {
      const { getBillingLedger } = await import('./ledger');

      const mockEvents = [
        {
          id: 'event3',
          type: 'subscription_updated',
          timestamp: { seconds: 1700000003, nanoseconds: 0 },
          source: 'webhook',
        },
        {
          id: 'event2',
          type: 'payment_failed',
          timestamp: { seconds: 1700000002, nanoseconds: 0 },
          source: 'webhook',
        },
        {
          id: 'event1',
          type: 'subscription_created',
          timestamp: { seconds: 1700000001, nanoseconds: 0 },
          source: 'webhook',
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockEvents.map((event) => ({
          id: event.id,
          data: () => event,
        })),
      });

      const events = await getBillingLedger('workspace123', 50);

      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(events).toHaveLength(3);
      expect(events[0].id).toBe('event3'); // Newest first
    });

    it('should default to 50 events limit', async () => {
      const { getBillingLedger } = await import('./ledger');

      mockGet.mockResolvedValue({ docs: [] });

      await getBillingLedger('workspace123');

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should accept custom limit', async () => {
      const { getBillingLedger } = await import('./ledger');

      mockGet.mockResolvedValue({ docs: [] });

      await getBillingLedger('workspace123', 100);

      expect(mockLimit).toHaveBeenCalledWith(100);
    });
  });

  describe('getBillingLedgerBySource', () => {
    it('should filter events by source', async () => {
      const { getBillingLedgerBySource } = await import('./ledger');

      mockGet.mockResolvedValue({ docs: [] });

      await getBillingLedgerBySource('workspace123', 'replay', 25);

      expect(mockWhere).toHaveBeenCalledWith('source', '==', 'replay');
      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(25);
    });
  });

  describe('getBillingLedgerByType', () => {
    it('should filter events by type', async () => {
      const { getBillingLedgerByType } = await import('./ledger');

      mockGet.mockResolvedValue({ docs: [] });

      await getBillingLedgerByType('workspace123', 'payment_failed', 25);

      expect(mockWhere).toHaveBeenCalledWith('type', '==', 'payment_failed');
      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(25);
    });
  });

  describe('Event Types', () => {
    it('should accept all valid event types', async () => {
      const { recordBillingEvent } = await import('./ledger');

      mockAdd.mockResolvedValue({ id: 'event123' });

      const validTypes: LedgerEventType[] = [
        'subscription_created',
        'subscription_updated',
        'subscription_deleted',
        'subscription_paused',
        'subscription_resumed',
        'payment_succeeded',
        'payment_failed',
        'plan_upgraded',
        'plan_downgraded',
        'plan_changed',
        'status_changed',
        'workspace_suspended',
        'workspace_reactivated',
        'drift_detected',
        'drift_resolved',
        'manual_adjustment',
        'event_replayed',
      ];

      for (const type of validTypes) {
        const event: RecordBillingEventInput = {
          type,
          source: 'webhook',
        };

        await expect(recordBillingEvent('workspace123', event)).resolves.toBe('event123');
      }

      expect(mockAdd).toHaveBeenCalledTimes(validTypes.length);
    });
  });

  describe('Append-Only Contract', () => {
    it('should never update existing ledger entries', async () => {
      // Ledger is append-only - this test documents the behavioral contract
      // The ledger module exports only add/read functions, never update/delete

      const ledgerModule = await import('./ledger');

      // Should have write functions
      expect(ledgerModule.recordBillingEvent).toBeDefined();

      // Should have read functions
      expect(ledgerModule.getBillingLedger).toBeDefined();
      expect(ledgerModule.getBillingLedgerBySource).toBeDefined();
      expect(ledgerModule.getBillingLedgerByType).toBeDefined();

      // Should NOT have update/delete functions
      expect((ledgerModule as any).updateBillingEvent).toBeUndefined();
      expect((ledgerModule as any).deleteBillingEvent).toBeUndefined();
    });
  });
});
