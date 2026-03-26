/**
 * Integration Tests: Plan Enforcement Engine
 *
 * Tests enforceWorkspacePlan() against real Firestore Emulator data.
 * Validates that the enforcement engine correctly reads workspace state,
 * detects plan/status mismatches, applies updates to Firestore, and
 * delegates ledger recording.
 *
 * Mocked:
 * - @/lib/stripe/plan-mapping  — price ID and status mapping (avoids env var coupling)
 * - @/lib/stripe/ledger        — billing event recording (subcollection write side-effect)
 *
 * Real:
 * - Firestore Emulator         — workspace reads and plan/status updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedWorkspace,
  readDoc,
} from '@/test-utils/integration';

// ---------------------------------------------------------------------------
// Module mocks — must appear before any module imports that transitively
// load plan-mapping or ledger.
// ---------------------------------------------------------------------------

vi.mock('@/lib/stripe/plan-mapping', () => ({
  getPlanForPriceId: vi.fn((priceId: string) => {
    const map: Record<string, string> = {
      'price_starter': 'starter',
      'price_plus': 'plus',
      'price_pro': 'pro',
    };
    const plan = map[priceId];
    if (!plan) throw new Error(`Unknown price: ${priceId}`);
    return plan;
  }),
  mapStripeStatusToWorkspaceStatus: vi.fn((status: string) => {
    const map: Record<string, string> = {
      'active': 'active',
      'trialing': 'trial',
      'past_due': 'past_due',
      'canceled': 'canceled',
    };
    const wsStatus = map[status];
    if (!wsStatus) throw new Error(`Unknown status: ${status}`);
    return wsStatus;
  }),
}));

vi.mock('@/lib/stripe/ledger', () => ({
  recordBillingEvent: vi.fn().mockResolvedValue('ledger-event-123'),
}));

// ---------------------------------------------------------------------------
// Subject under test — imported after mocks are registered
// ---------------------------------------------------------------------------

import {
  enforceWorkspacePlan,
  type EnforcePlanInput,
} from './plan-enforcement';
import { recordBillingEvent } from '@/lib/stripe/ledger';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_USER_ID = 'test-user-plan-enforcement';

/** Base valid input pointing at the starter plan. */
const BASE_INPUT: EnforcePlanInput = {
  stripePriceId: 'price_starter',
  stripeStatus: 'active',
  source: 'webhook',
  stripeEventId: 'evt_test_001',
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('enforceWorkspacePlan() (Integration)', () => {
  let workspaceId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    // Default workspace: plan=starter, status=active
    workspaceId = await seedWorkspace(TEST_USER_ID, {
      plan: 'starter',
      status: 'active',
    });
  });

  // -------------------------------------------------------------------------
  // Input validation — these checks run before any Firestore access
  // -------------------------------------------------------------------------

  it('throws for an empty workspaceId', async () => {
    await expect(
      enforceWorkspacePlan('', BASE_INPUT)
    ).rejects.toThrow('Invalid workspaceId');
  });

  it('throws for a missing (null) workspaceId', async () => {
    await expect(
      enforceWorkspacePlan(null as unknown as string, BASE_INPUT)
    ).rejects.toThrow('Invalid workspaceId');
  });

  it('throws for an empty stripePriceId', async () => {
    await expect(
      enforceWorkspacePlan(workspaceId, { ...BASE_INPUT, stripePriceId: '' })
    ).rejects.toThrow('Invalid stripePriceId');
  });

  it('throws for a non-existent workspace', async () => {
    await expect(
      enforceWorkspacePlan('workspace-does-not-exist', BASE_INPUT)
    ).rejects.toThrow('Workspace not found: workspace-does-not-exist');
  });

  it('throws for an unknown Stripe price ID (mock propagates the error)', async () => {
    await expect(
      enforceWorkspacePlan(workspaceId, {
        ...BASE_INPUT,
        stripePriceId: 'price_unknown',
      })
    ).rejects.toThrow('Failed to map Stripe price ID to plan');
  });

  it('throws for an invalid source value', async () => {
    await expect(
      enforceWorkspacePlan(workspaceId, {
        ...BASE_INPUT,
        source: 'robot' as EnforcePlanInput['source'],
      })
    ).rejects.toThrow('Invalid source: robot');
  });

  // -------------------------------------------------------------------------
  // No-op path — workspace already matches Stripe state
  // -------------------------------------------------------------------------

  it('returns planChanged=false and statusChanged=false when workspace is in sync', async () => {
    const result = await enforceWorkspacePlan(workspaceId, {
      stripePriceId: 'price_starter', // matches plan=starter
      stripeStatus: 'active',         // matches status=active
      source: 'webhook',
      stripeEventId: 'evt_noop',
    });

    expect(result.planChanged).toBe(false);
    expect(result.statusChanged).toBe(false);
    expect(result.planBefore).toBe('starter');
    expect(result.planAfter).toBe('starter');
    expect(result.statusBefore).toBe('active');
    expect(result.statusAfter).toBe('active');
  });

  it('records a noop ledger entry even when there are no changes', async () => {
    await enforceWorkspacePlan(workspaceId, BASE_INPUT);

    expect(recordBillingEvent).toHaveBeenCalledOnce();
    expect(recordBillingEvent).toHaveBeenCalledWith(
      workspaceId,
      expect.objectContaining({
        note: expect.stringContaining('no changes'),
        source: 'webhook',
      })
    );
  });

  it('does not write to the workspace document when there are no changes', async () => {
    const before = await readDoc(`workspaces/${workspaceId}`);

    await enforceWorkspacePlan(workspaceId, BASE_INPUT);

    // updatedAt is set by FieldValue.serverTimestamp() only on an update call,
    // so comparing the raw Firestore timestamps tells us if an update happened.
    const after = await readDoc(`workspaces/${workspaceId}`);
    expect(after!.updatedAt).toEqual(before!.updatedAt);
  });

  // -------------------------------------------------------------------------
  // Plan-change path
  // -------------------------------------------------------------------------

  it('updates workspace plan in Firestore when mismatch detected (starter → plus)', async () => {
    const result = await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      stripePriceId: 'price_plus',
      stripeStatus: 'active', // status unchanged
    });

    expect(result.planChanged).toBe(true);
    expect(result.statusChanged).toBe(false);
    expect(result.planBefore).toBe('starter');
    expect(result.planAfter).toBe('plus');

    const doc = await readDoc(`workspaces/${workspaceId}`);
    expect(doc!.plan).toBe('plus');
    expect(doc!.status).toBe('active'); // untouched
  });

  it('updates workspace plan in Firestore when upgrading (starter → pro)', async () => {
    await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      stripePriceId: 'price_pro',
    });

    const doc = await readDoc(`workspaces/${workspaceId}`);
    expect(doc!.plan).toBe('pro');
  });

  // -------------------------------------------------------------------------
  // Status-change path
  // -------------------------------------------------------------------------

  it('updates workspace status in Firestore when mismatch detected (active → past_due)', async () => {
    const result = await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      stripePriceId: 'price_starter', // plan unchanged
      stripeStatus: 'past_due',
    });

    expect(result.planChanged).toBe(false);
    expect(result.statusChanged).toBe(true);
    expect(result.statusBefore).toBe('active');
    expect(result.statusAfter).toBe('past_due');

    const doc = await readDoc(`workspaces/${workspaceId}`);
    expect(doc!.status).toBe('past_due');
    expect(doc!.plan).toBe('starter'); // untouched
  });

  // -------------------------------------------------------------------------
  // Dual-change path
  // -------------------------------------------------------------------------

  it('updates both plan and status simultaneously when both are mismatched', async () => {
    const result = await enforceWorkspacePlan(workspaceId, {
      stripePriceId: 'price_pro',
      stripeStatus: 'canceled',
      source: 'auditor',
      stripeEventId: null,
    });

    expect(result.planChanged).toBe(true);
    expect(result.statusChanged).toBe(true);
    expect(result.planBefore).toBe('starter');
    expect(result.planAfter).toBe('pro');
    expect(result.statusBefore).toBe('active');
    expect(result.statusAfter).toBe('canceled');

    const doc = await readDoc(`workspaces/${workspaceId}`);
    expect(doc!.plan).toBe('pro');
    expect(doc!.status).toBe('canceled');
  });

  // -------------------------------------------------------------------------
  // Ledger delegation on plan change
  // -------------------------------------------------------------------------

  it('records a ledger event when the plan changes', async () => {
    await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      stripePriceId: 'price_plus',
    });

    expect(recordBillingEvent).toHaveBeenCalledOnce();
    expect(recordBillingEvent).toHaveBeenCalledWith(
      workspaceId,
      expect.objectContaining({
        type: 'plan_changed',
        source: 'webhook',
        planBefore: 'starter',
        planAfter: 'plus',
        stripeEventId: 'evt_test_001',
      })
    );
  });

  it('returns the ledger event ID from the mock', async () => {
    const result = await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      stripePriceId: 'price_plus',
    });

    expect(result.ledgerEventId).toBe('ledger-event-123');
  });

  // -------------------------------------------------------------------------
  // Source field forwarded to ledger
  // -------------------------------------------------------------------------

  it('forwards the source field to the ledger call', async () => {
    await enforceWorkspacePlan(workspaceId, {
      ...BASE_INPUT,
      source: 'auditor',
      stripeEventId: null,
    });

    expect(recordBillingEvent).toHaveBeenCalledWith(
      workspaceId,
      expect.objectContaining({ source: 'auditor' })
    );
  });

  it('accepts all valid source values without throwing', async () => {
    const sources: Array<EnforcePlanInput['source']> = [
      'webhook',
      'replay',
      'auditor',
      'manual',
      'enforcement',
    ];

    for (const source of sources) {
      vi.clearAllMocks();
      // Re-seed a fresh workspace for each iteration so state is clean
      await clearEmulators();
      await seedUserProfile(TEST_USER_ID);
      workspaceId = await seedWorkspace(TEST_USER_ID, {
        plan: 'starter',
        status: 'active',
      });

      const result = await enforceWorkspacePlan(workspaceId, {
        ...BASE_INPUT,
        source,
        stripeEventId: null,
      });

      expect(result.workspaceId).toBe(workspaceId);
    }
  });

  // -------------------------------------------------------------------------
  // Result shape
  // -------------------------------------------------------------------------

  it('returns the correct before/after snapshot in the result object', async () => {
    workspaceId = await (async () => {
      await clearEmulators();
      await seedUserProfile(TEST_USER_ID);
      return seedWorkspace(TEST_USER_ID, { plan: 'plus', status: 'trial' });
    })();

    const result = await enforceWorkspacePlan(workspaceId, {
      stripePriceId: 'price_starter',
      stripeStatus: 'past_due',
      source: 'replay',
      stripeEventId: 'evt_replay_007',
    });

    expect(result).toMatchObject({
      workspaceId,
      planChanged: true,
      statusChanged: true,
      planBefore: 'plus',
      planAfter: 'starter',
      statusBefore: 'trial',
      statusAfter: 'past_due',
      ledgerEventId: 'ledger-event-123',
    });
  });
});
