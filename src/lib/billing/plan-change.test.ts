/**
 * Plan Change Tests
 *
 * Phase 7 Task 3: Self-Service Plan Changes
 *
 * Tests for:
 * - getAvailablePlans()
 * - validatePlanChangeEligibility()
 * - getProrationPreview()
 * - buildCheckoutSession()
 * - /api/billing/change-plan route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workspace, WorkspaceStatus } from '@/types/firestore';
import {
  getAvailablePlans,
  validatePlanChangeEligibility,
  getProrationPreview,
  buildCheckoutSession,
} from '@/lib/billing/plan-change';

// Mock plan-mapping module
vi.mock('@/lib/stripe/plan-mapping', () => ({
  getPriceIdForPlan: (plan: string) => {
    const priceIds: Record<string, string> = {
      starter: 'price_starter_test',
      plus: 'price_plus_test',
      pro: 'price_pro_test',
    };
    return priceIds[plan] || `price_${plan}_test`;
  },
  getPlanForPriceId: (priceId: string) => {
    const plans: Record<string, string> = {
      price_starter_test: 'starter',
      price_starter: 'starter',
      price_plus_test: 'plus',
      price_plus: 'plus',
      price_pro_test: 'pro',
      price_pro: 'pro',
    };
    const plan = plans[priceId];
    if (!plan) {
      throw new Error(`Unknown Stripe price ID: ${priceId}`);
    }
    return plan;
  },
  getPlanDisplayName: (plan: string) => {
    const names: Record<string, string> = {
      starter: 'Starter',
      plus: 'Plus',
      pro: 'Pro',
    };
    return names[plan] || plan;
  },
  getPlanPrice: (plan: string) => {
    const prices: Record<string, number> = {
      free: 0,
      starter: 9,
      plus: 19,
      pro: 39,
    };
    return prices[plan] || 0;
  },
  getPlanLimits: (plan: string) => {
    const limits: Record<string, any> = {
      starter: { maxPlayers: 5, maxGamesPerMonth: 50, storageMB: 500 },
      plus: { maxPlayers: 15, maxGamesPerMonth: 200, storageMB: 2048 },
      pro: { maxPlayers: 9999, maxGamesPerMonth: 9999, storageMB: 10240 },
    };
    return limits[plan];
  },
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    subscriptions: {
      retrieve: vi.fn(),
    },
    invoices: {
      retrieveUpcoming: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  };

  return {
    default: vi.fn(() => mockStripe),
  };
});

// Mock workspace factory
function createMockWorkspace(status: WorkspaceStatus, plan: 'starter' | 'plus' | 'pro' = 'starter'): Workspace {
  return {
    id: 'workspace-123',
    name: 'Test Workspace',
    plan,
    status,
    billing: {
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripePriceId: 'price_starter',
      currentPeriodStart: new Date('2025-01-01'),
      currentPeriodEnd: new Date('2025-02-01'),
      cancelAtPeriodEnd: false,
      lastSyncedAt: new Date(),
    },
    usage: {
      playerCount: 5,
      gamesThisMonth: 10,
      storageUsedMB: 50,
    },
    limits: {
      maxPlayers: 10,
      maxGamesPerMonth: 50,
      storageMB: 500,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  } as Workspace;
}

describe('getAvailablePlans', () => {
  it('should return all three plans with correct metadata', () => {
    const workspace = createMockWorkspace('active', 'starter');
    const plans = getAvailablePlans(workspace);

    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.plan)).toEqual(['starter', 'plus', 'pro']);
    expect(plans.every((p) => p.priceId && p.displayName && p.monthlyPrice >= 0)).toBe(true);
  });

  it('should mark current plan correctly', () => {
    const workspace = createMockWorkspace('active', 'plus');
    const plans = getAvailablePlans(workspace);

    const currentPlan = plans.find((p) => p.isCurrent);
    expect(currentPlan?.plan).toBe('plus');
  });

  it('should classify upgrades and downgrades correctly', () => {
    const workspace = createMockWorkspace('active', 'plus');
    const plans = getAvailablePlans(workspace);

    const starter = plans.find((p) => p.plan === 'starter');
    const plus = plans.find((p) => p.plan === 'plus');
    const pro = plans.find((p) => p.plan === 'pro');

    expect(starter?.changeType).toBe('downgrade'); // Plus → Starter
    expect(plus?.changeType).toBe('current'); // Current plan
    expect(pro?.changeType).toBe('upgrade'); // Plus → Pro
  });

  it('should include plan limits', () => {
    const workspace = createMockWorkspace('active', 'starter');
    const plans = getAvailablePlans(workspace);

    plans.forEach((plan) => {
      expect(plan.limits).toHaveProperty('maxPlayers');
      expect(plan.limits).toHaveProperty('maxGamesPerMonth');
      expect(plan.limits).toHaveProperty('storageMB');
    });
  });
});

describe('validatePlanChangeEligibility', () => {
  it('should allow plan change for active workspace', () => {
    const workspace = createMockWorkspace('active');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should allow plan change for past_due workspace', () => {
    const workspace = createMockWorkspace('past_due');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should block plan change for canceled workspace', () => {
    const workspace = createMockWorkspace('canceled');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('canceled');
  });

  it('should block plan change for suspended workspace', () => {
    const workspace = createMockWorkspace('suspended');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('suspended');
  });

  it('should block plan change for deleted workspace', () => {
    const workspace = createMockWorkspace('deleted');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('deleted');
  });

  it('should block plan change for trial workspace', () => {
    const workspace = createMockWorkspace('trial');
    const result = validatePlanChangeEligibility(workspace);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('trial');
  });
});

describe('getProrationPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return proration preview for upgrade', async () => {
    const workspace = createMockWorkspace('active', 'starter');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    // Mock subscription retrieve
    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      current_period_end: 1738368000, // Feb 1, 2025
      items: {
        data: [
          {
            id: 'si_test123',
            price: {
              id: 'price_starter',
            },
          },
        ],
      },
    } as any);

    // Mock upcoming invoice
    vi.spyOn(stripe.invoices, 'retrieveUpcoming').mockResolvedValue({
      amount_due: 1500, // $15.00 prorated
      currency: 'usd',
    } as any);

    const preview = await getProrationPreview(workspace, 'price_plus');

    expect(preview.amountDue).toBe(1500);
    expect(preview.currencyCode).toBe('USD');
    expect(preview.immediateCharge).toBe(true); // Upgrade
    expect(preview.currentPeriodEnd).toBeInstanceOf(Date);
  });

  it('should return proration preview for downgrade', async () => {
    const workspace = createMockWorkspace('active', 'pro');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    // Mock subscription retrieve
    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      current_period_end: 1738368000,
      items: {
        data: [
          {
            id: 'si_test123',
            price: {
              id: 'price_pro',
            },
          },
        ],
      },
    } as any);

    // Mock upcoming invoice (negative for credit)
    vi.spyOn(stripe.invoices, 'retrieveUpcoming').mockResolvedValue({
      amount_due: -1000, // -$10.00 credit
      currency: 'usd',
    } as any);

    const preview = await getProrationPreview(workspace, 'price_starter');

    expect(preview.amountDue).toBe(-1000);
    expect(preview.immediateCharge).toBe(false); // Downgrade
  });

  it('should throw error if workspace has no subscription', async () => {
    const workspace = createMockWorkspace('trial');
    workspace.billing.stripeSubscriptionId = undefined as any;

    await expect(getProrationPreview(workspace, 'price_plus')).rejects.toThrow(
      'no Stripe subscription'
    );
  });

  it('should handle Stripe API errors gracefully', async () => {
    const workspace = createMockWorkspace('active', 'starter');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    // Mock Stripe error
    vi.spyOn(stripe.subscriptions, 'retrieve').mockRejectedValue(
      new Error('Subscription not found')
    );

    await expect(getProrationPreview(workspace, 'price_plus')).rejects.toThrow(
      'Failed to calculate proration'
    );
  });
});

describe('buildCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create checkout session with correct parameters', async () => {
    const workspace = createMockWorkspace('active', 'starter');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    // Mock checkout session creation
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    } as any);

    const url = await buildCheckoutSession(workspace, 'price_plus');

    expect(url).toBe('https://checkout.stripe.com/pay/cs_test123');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test123',
        mode: 'subscription',
        line_items: [{ price: 'price_plus', quantity: 1 }],
        payment_method_collection: 'if_required',
      })
    );
  });

  it('should include workspace metadata', async () => {
    const workspace = createMockWorkspace('active', 'starter');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    } as any);

    await buildCheckoutSession(workspace, 'price_plus');

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          workspaceId: 'workspace-123',
          action: 'plan_change',
        },
      })
    );
  });

  it('should throw error if workspace has no customer ID', async () => {
    const workspace = createMockWorkspace('trial');
    workspace.billing.stripeCustomerId = undefined as any;
    workspace.billing.stripeSubscriptionId = undefined as any;

    await expect(buildCheckoutSession(workspace, 'price_plus')).rejects.toThrow(
      'no Stripe customer or subscription'
    );
  });

  it('should handle Stripe API errors gracefully', async () => {
    const workspace = createMockWorkspace('active', 'starter');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    vi.spyOn(stripe.checkout.sessions, 'create').mockRejectedValue(
      new Error('Customer not found')
    );

    await expect(buildCheckoutSession(workspace, 'price_plus')).rejects.toThrow(
      'Failed to create checkout session'
    );
  });
});

describe('Integration: Plan Change Flow', () => {
  it('should complete full plan change flow for eligible workspace', async () => {
    const workspace = createMockWorkspace('active', 'starter');

    // 1. Check eligibility
    const eligibility = validatePlanChangeEligibility(workspace);
    expect(eligibility.eligible).toBe(true);

    // 2. Get available plans
    const plans = getAvailablePlans(workspace);
    expect(plans.length).toBeGreaterThan(0);

    // 3. Select target plan (upgrade to Plus)
    const targetPlan = plans.find((p) => p.plan === 'plus');
    expect(targetPlan).toBeDefined();

    // 4. Get proration preview (mocked)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('test_key', { apiVersion: '2025-01-27.acacia' });

    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      current_period_end: 1738368000,
      items: { data: [{ id: 'si_test123', price: { id: 'price_starter' } }] },
    } as any);

    vi.spyOn(stripe.invoices, 'retrieveUpcoming').mockResolvedValue({
      amount_due: 1500,
      currency: 'usd',
    } as any);

    const preview = await getProrationPreview(workspace, targetPlan!.priceId);
    expect(preview.amountDue).toBeGreaterThan(0); // Upgrade charges money

    // 5. Build checkout session (mocked)
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    } as any);

    const checkoutUrl = await buildCheckoutSession(workspace, targetPlan!.priceId);
    expect(checkoutUrl).toContain('checkout.stripe.com');
  });

  it('should reject plan change for suspended workspace', () => {
    const workspace = createMockWorkspace('suspended', 'starter');

    const eligibility = validatePlanChangeEligibility(workspace);
    expect(eligibility.eligible).toBe(false);

    // Should not proceed to get plans if not eligible
    const plans = getAvailablePlans(workspace);
    expect(plans.find((p) => !p.isCurrent)).toBeDefined(); // Plans still returned for display
  });
});
