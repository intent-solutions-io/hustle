/**
 * Stripe Compat Utilities Tests
 *
 * Tests for compat.ts helper functions that adapt to Stripe API shape changes:
 * - getSubscriptionCurrentPeriodEndUnix
 * - getSubscriptionCurrentPeriodEndDate
 * - getInvoiceSubscriptionId
 */

import { describe, it, expect } from 'vitest';
import {
  getSubscriptionCurrentPeriodEndUnix,
  getSubscriptionCurrentPeriodEndDate,
  getInvoiceSubscriptionId,
} from './compat';
import type Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Helpers to build minimal subscription / invoice shapes
// ---------------------------------------------------------------------------

function makeSubscription(
  items: Array<{ current_period_end?: unknown }>
): Stripe.Subscription {
  return {
    items: {
      data: items as Stripe.SubscriptionItem[],
    },
  } as unknown as Stripe.Subscription;
}

function makeInvoice(parent?: unknown): Stripe.Invoice {
  return { parent } as unknown as Stripe.Invoice;
}

// ---------------------------------------------------------------------------
// getSubscriptionCurrentPeriodEndUnix
// ---------------------------------------------------------------------------

describe('getSubscriptionCurrentPeriodEndUnix', () => {
  it('returns the period end for a subscription with a single item', () => {
    const sub = makeSubscription([{ current_period_end: 1_700_000_000 }]);
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBe(1_700_000_000);
  });

  it('returns the earliest period end when multiple items exist', () => {
    const sub = makeSubscription([
      { current_period_end: 1_700_000_200 },
      { current_period_end: 1_700_000_100 }, // earliest
      { current_period_end: 1_700_000_300 },
    ]);
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBe(1_700_000_100);
  });

  it('returns null when items array is empty', () => {
    const sub = makeSubscription([]);
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBeNull();
  });

  it('filters out non-number values and returns null when all are invalid', () => {
    const sub = makeSubscription([
      { current_period_end: 'not-a-number' },
      { current_period_end: null },
      { current_period_end: undefined },
    ]);
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBeNull();
  });

  it('filters out non-number values and returns the valid one', () => {
    const sub = makeSubscription([
      { current_period_end: 'bad' },
      { current_period_end: 1_700_000_000 },
    ]);
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBe(1_700_000_000);
  });

  it('filters out Infinity and NaN values', () => {
    const sub = makeSubscription([
      { current_period_end: Infinity },
      { current_period_end: NaN },
      { current_period_end: 1_700_000_000 },
    ]);
    // Infinity is typeof number but not Number.isFinite; NaN is also not finite
    expect(getSubscriptionCurrentPeriodEndUnix(sub)).toBe(1_700_000_000);
  });
});

// ---------------------------------------------------------------------------
// getSubscriptionCurrentPeriodEndDate
// ---------------------------------------------------------------------------

describe('getSubscriptionCurrentPeriodEndDate', () => {
  it('converts a unix timestamp to a Date', () => {
    const unix = 1_700_000_000;
    const sub = makeSubscription([{ current_period_end: unix }]);
    const result = getSubscriptionCurrentPeriodEndDate(sub);

    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(unix * 1000);
  });

  it('returns null when there are no valid period-end values', () => {
    const sub = makeSubscription([]);
    expect(getSubscriptionCurrentPeriodEndDate(sub)).toBeNull();
  });

  it('returns the date for the earliest period when multiple items exist', () => {
    const sub = makeSubscription([
      { current_period_end: 1_700_000_200 },
      { current_period_end: 1_700_000_050 },
    ]);
    const result = getSubscriptionCurrentPeriodEndDate(sub);
    expect(result!.getTime()).toBe(1_700_000_050 * 1000);
  });
});

// ---------------------------------------------------------------------------
// getInvoiceSubscriptionId
// ---------------------------------------------------------------------------

describe('getInvoiceSubscriptionId', () => {
  it('returns the subscription ID when it is a string', () => {
    const invoice = makeInvoice({
      subscription_details: { subscription: 'sub_abc123' },
    });
    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_abc123');
  });

  it('returns the id when subscription is an object with an id property', () => {
    const invoice = makeInvoice({
      subscription_details: { subscription: { id: 'sub_obj_id' } },
    });
    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_obj_id');
  });

  it('returns null when subscription_details.subscription is null', () => {
    const invoice = makeInvoice({
      subscription_details: { subscription: null },
    });
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });

  it('returns null when subscription_details.subscription is undefined', () => {
    const invoice = makeInvoice({
      subscription_details: { subscription: undefined },
    });
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });

  it('returns null when parent is null', () => {
    const invoice = makeInvoice(null);
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });

  it('returns null when parent is undefined', () => {
    const invoice = makeInvoice(undefined);
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });

  it('returns null when subscription_details is missing from parent', () => {
    const invoice = makeInvoice({});
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });
});
