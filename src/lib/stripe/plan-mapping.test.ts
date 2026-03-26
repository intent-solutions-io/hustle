/**
 * Stripe Plan Mapping Tests
 *
 * Tests for plan/price ID bidirectional mapping, plan limits,
 * Stripe-to-workspace status mapping, display names, pricing,
 * and feature flags.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Set up env vars before any module is imported so the mapping functions
// can read them at call time (they use process.env inline, not at module load).
beforeAll(() => {
  process.env.STRIPE_PRICE_ID_STARTER = 'price_starter_test';
  process.env.STRIPE_PRICE_ID_PLUS = 'price_plus_test';
  process.env.STRIPE_PRICE_ID_PRO = 'price_pro_test';
});

// ---------------------------------------------------------------------------
// getPriceIdForPlan
// ---------------------------------------------------------------------------

describe('getPriceIdForPlan', () => {
  it('returns the starter price ID', async () => {
    const { getPriceIdForPlan } = await import('./plan-mapping');
    expect(getPriceIdForPlan('starter')).toBe('price_starter_test');
  });

  it('returns the plus price ID', async () => {
    const { getPriceIdForPlan } = await import('./plan-mapping');
    expect(getPriceIdForPlan('plus')).toBe('price_plus_test');
  });

  it('returns the pro price ID', async () => {
    const { getPriceIdForPlan } = await import('./plan-mapping');
    expect(getPriceIdForPlan('pro')).toBe('price_pro_test');
  });

  it('throws for the free plan', async () => {
    const { getPriceIdForPlan } = await import('./plan-mapping');
    expect(() => getPriceIdForPlan('free')).toThrow('Free trial plan has no Stripe price ID');
  });
});

// ---------------------------------------------------------------------------
// getPlanForPriceId
// ---------------------------------------------------------------------------

describe('getPlanForPriceId', () => {
  it('maps starter price ID to starter plan', async () => {
    const { getPlanForPriceId } = await import('./plan-mapping');
    expect(getPlanForPriceId('price_starter_test')).toBe('starter');
  });

  it('maps plus price ID to plus plan', async () => {
    const { getPlanForPriceId } = await import('./plan-mapping');
    expect(getPlanForPriceId('price_plus_test')).toBe('plus');
  });

  it('maps pro price ID to pro plan', async () => {
    const { getPlanForPriceId } = await import('./plan-mapping');
    expect(getPlanForPriceId('price_pro_test')).toBe('pro');
  });

  it('throws for an unknown price ID', async () => {
    const { getPlanForPriceId } = await import('./plan-mapping');
    expect(() => getPlanForPriceId('price_unknown_xyz')).toThrow(
      'Unknown Stripe price ID: price_unknown_xyz'
    );
  });

  it('throws for an empty string price ID', async () => {
    const { getPlanForPriceId } = await import('./plan-mapping');
    expect(() => getPlanForPriceId('')).toThrow('Unknown Stripe price ID:');
  });
});

// ---------------------------------------------------------------------------
// getPlanLimits
// ---------------------------------------------------------------------------

describe('getPlanLimits', () => {
  it('returns correct limits for free plan', async () => {
    const { getPlanLimits } = await import('./plan-mapping');
    const limits = getPlanLimits('free');
    expect(limits).toEqual({
      maxPlayers: 2,
      maxGamesPerMonth: 10,
      storageMB: 100,
    });
  });

  it('returns correct limits for starter plan', async () => {
    const { getPlanLimits } = await import('./plan-mapping');
    const limits = getPlanLimits('starter');
    expect(limits).toEqual({
      maxPlayers: 5,
      maxGamesPerMonth: 50,
      storageMB: 500,
    });
  });

  it('returns correct limits for plus plan', async () => {
    const { getPlanLimits } = await import('./plan-mapping');
    const limits = getPlanLimits('plus');
    expect(limits).toEqual({
      maxPlayers: 15,
      maxGamesPerMonth: 200,
      storageMB: 2048,
    });
  });

  it('returns correct limits for pro plan', async () => {
    const { getPlanLimits } = await import('./plan-mapping');
    const limits = getPlanLimits('pro');
    expect(limits).toEqual({
      maxPlayers: 9999,
      maxGamesPerMonth: 9999,
      storageMB: 10240,
    });
  });
});

// ---------------------------------------------------------------------------
// mapStripeStatusToWorkspaceStatus
// ---------------------------------------------------------------------------

describe('mapStripeStatusToWorkspaceStatus', () => {
  it('maps active → active', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('active')).toBe('active');
  });

  it('maps trialing → trial', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('trialing')).toBe('trial');
  });

  it('maps past_due → past_due', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('past_due')).toBe('past_due');
  });

  it('maps canceled → canceled', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('canceled')).toBe('canceled');
  });

  it('maps unpaid → suspended', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('unpaid')).toBe('suspended');
  });

  it('maps incomplete → past_due', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('incomplete')).toBe('past_due');
  });

  it('maps incomplete_expired → canceled', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('incomplete_expired')).toBe('canceled');
  });

  it('maps paused → suspended', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    expect(mapStripeStatusToWorkspaceStatus('paused')).toBe('suspended');
  });

  it('returns suspended for an unknown status', async () => {
    const { mapStripeStatusToWorkspaceStatus } = await import('./plan-mapping');
    // Cast to any to simulate an undocumented Stripe status
    expect(mapStripeStatusToWorkspaceStatus('some_future_status' as any)).toBe('suspended');
  });
});

// ---------------------------------------------------------------------------
// getPlanDisplayName
// ---------------------------------------------------------------------------

describe('getPlanDisplayName', () => {
  it('returns "Free Trial" for free plan', async () => {
    const { getPlanDisplayName } = await import('./plan-mapping');
    expect(getPlanDisplayName('free')).toBe('Free Trial');
  });

  it('returns "Starter" for starter plan', async () => {
    const { getPlanDisplayName } = await import('./plan-mapping');
    expect(getPlanDisplayName('starter')).toBe('Starter');
  });

  it('returns "Plus" for plus plan', async () => {
    const { getPlanDisplayName } = await import('./plan-mapping');
    expect(getPlanDisplayName('plus')).toBe('Plus');
  });

  it('returns "Pro" for pro plan', async () => {
    const { getPlanDisplayName } = await import('./plan-mapping');
    expect(getPlanDisplayName('pro')).toBe('Pro');
  });
});

// ---------------------------------------------------------------------------
// getPlanPrice
// ---------------------------------------------------------------------------

describe('getPlanPrice', () => {
  it('returns 0 for free plan', async () => {
    const { getPlanPrice } = await import('./plan-mapping');
    expect(getPlanPrice('free')).toBe(0);
  });

  it('returns 9 for starter plan', async () => {
    const { getPlanPrice } = await import('./plan-mapping');
    expect(getPlanPrice('starter')).toBe(9);
  });

  it('returns 19 for plus plan', async () => {
    const { getPlanPrice } = await import('./plan-mapping');
    expect(getPlanPrice('plus')).toBe(19);
  });

  it('returns 39 for pro plan', async () => {
    const { getPlanPrice } = await import('./plan-mapping');
    expect(getPlanPrice('pro')).toBe(39);
  });
});

// ---------------------------------------------------------------------------
// planHasFeature
// ---------------------------------------------------------------------------

describe('planHasFeature', () => {
  it('free plan has game_verification and basic_stats', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('free', 'game_verification')).toBe(true);
    expect(planHasFeature('free', 'basic_stats')).toBe(true);
  });

  it('free plan does not have advanced_analytics', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('free', 'advanced_analytics')).toBe(false);
  });

  it('starter plan has basic features but not advanced_analytics', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('starter', 'game_verification')).toBe(true);
    expect(planHasFeature('starter', 'basic_stats')).toBe(true);
    expect(planHasFeature('starter', 'advanced_analytics')).toBe(false);
  });

  it('plus plan has advanced_analytics in addition to basic features', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('plus', 'advanced_analytics')).toBe(true);
    expect(planHasFeature('plus', 'basic_stats')).toBe(true);
    expect(planHasFeature('plus', 'export_reports')).toBe(false);
  });

  it('pro plan has all features', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('pro', 'game_verification')).toBe(true);
    expect(planHasFeature('pro', 'basic_stats')).toBe(true);
    expect(planHasFeature('pro', 'advanced_analytics')).toBe(true);
    expect(planHasFeature('pro', 'export_reports')).toBe(true);
    expect(planHasFeature('pro', 'priority_support')).toBe(true);
  });

  it('returns false for an unknown feature on any plan', async () => {
    const { planHasFeature } = await import('./plan-mapping');
    expect(planHasFeature('pro', 'nonexistent_feature')).toBe(false);
    expect(planHasFeature('free', 'nonexistent_feature')).toBe(false);
  });
});
