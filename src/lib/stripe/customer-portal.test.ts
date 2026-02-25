/**
 * Stripe Customer Portal Tests
 *
 * Tests for customer-portal.ts utilities:
 * - createCustomerPortalSession
 * - getDefaultReturnUrl
 * - isValidStripeCustomerId
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { withEnv } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const billingPortalSessionsCreate = vi.fn();

  return {
    billingPortalSessionsCreate,
    getStripeClient: vi.fn(() => ({
      billingPortal: {
        sessions: {
          create: billingPortalSessionsCreate,
        },
      },
    })),
  };
});

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: mocks.getStripeClient,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createCustomerPortalSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the billing portal session on success', async () => {
    const { createCustomerPortalSession } = await import('./customer-portal');

    const mockSession = {
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/test',
      customer: 'cus_abc123',
    };
    mocks.billingPortalSessionsCreate.mockResolvedValue(mockSession);

    const result = await createCustomerPortalSession(
      'cus_abc123',
      'https://hustlestats.io/dashboard/settings/billing'
    );

    expect(result).toBe(mockSession);
    expect(mocks.billingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: 'cus_abc123',
      return_url: 'https://hustlestats.io/dashboard/settings/billing',
    });
  });

  it('calls getStripeClient once per invocation', async () => {
    const { createCustomerPortalSession } = await import('./customer-portal');

    mocks.billingPortalSessionsCreate.mockResolvedValue({ id: 'bps_1', url: 'https://x.com' });

    await createCustomerPortalSession('cus_abc123', 'https://example.com/billing');

    expect(mocks.getStripeClient).toHaveBeenCalled();
  });

  it('throws a wrapped error when the Stripe API call fails', async () => {
    const { createCustomerPortalSession } = await import('./customer-portal');

    mocks.billingPortalSessionsCreate.mockRejectedValue(
      new Error('No such customer: cus_bad')
    );

    await expect(
      createCustomerPortalSession('cus_bad', 'https://example.com/billing')
    ).rejects.toThrow('Failed to create customer portal session: No such customer: cus_bad');
  });

  it('preserves the original error message in the thrown error', async () => {
    const { createCustomerPortalSession } = await import('./customer-portal');

    mocks.billingPortalSessionsCreate.mockRejectedValue(
      new Error('Rate limit exceeded')
    );

    const err = await createCustomerPortalSession('cus_x', 'https://x.com').catch((e) => e);
    expect(err.message).toContain('Rate limit exceeded');
  });
});

// ---------------------------------------------------------------------------

describe('getDefaultReturnUrl', () => {
  it('uses NEXTAUTH_URL when it is set', async () => {
    const { getDefaultReturnUrl } = await import('./customer-portal');

    await withEnv(
      {
        NEXTAUTH_URL: 'https://hustlestats.io',
        NEXT_PUBLIC_WEBSITE_DOMAIN: undefined,
      },
      () => {
        expect(getDefaultReturnUrl()).toBe(
          'https://hustlestats.io/dashboard/settings/billing'
        );
      }
    );
  });

  it('falls back to NEXT_PUBLIC_WEBSITE_DOMAIN when NEXTAUTH_URL is not set', async () => {
    const { getDefaultReturnUrl } = await import('./customer-portal');

    await withEnv(
      {
        NEXTAUTH_URL: undefined,
        NEXT_PUBLIC_WEBSITE_DOMAIN: 'https://hustlestats.io',
      },
      () => {
        expect(getDefaultReturnUrl()).toBe(
          'https://hustlestats.io/dashboard/settings/billing'
        );
      }
    );
  });

  it('falls back to localhost:3000 when neither env var is set', async () => {
    const { getDefaultReturnUrl } = await import('./customer-portal');

    await withEnv(
      {
        NEXTAUTH_URL: undefined,
        NEXT_PUBLIC_WEBSITE_DOMAIN: undefined,
      },
      () => {
        expect(getDefaultReturnUrl()).toBe(
          'http://localhost:3000/dashboard/settings/billing'
        );
      }
    );
  });
});

// ---------------------------------------------------------------------------

describe('isValidStripeCustomerId', () => {
  it('returns true for a valid Stripe customer ID', async () => {
    const { isValidStripeCustomerId } = await import('./customer-portal');
    expect(isValidStripeCustomerId('cus_abc123XYZ')).toBe(true);
  });

  it('returns true for a minimal valid ID (cus_ + one char)', async () => {
    const { isValidStripeCustomerId } = await import('./customer-portal');
    expect(isValidStripeCustomerId('cus_A')).toBe(true);
  });

  it('returns false when the cus_ prefix is missing', async () => {
    const { isValidStripeCustomerId } = await import('./customer-portal');
    expect(isValidStripeCustomerId('sub_abc123')).toBe(false);
    expect(isValidStripeCustomerId('abc123')).toBe(false);
  });

  it('returns false for an empty string', async () => {
    const { isValidStripeCustomerId } = await import('./customer-portal');
    expect(isValidStripeCustomerId('')).toBe(false);
  });

  it('returns false when the ID contains invalid characters after the prefix', async () => {
    const { isValidStripeCustomerId } = await import('./customer-portal');
    expect(isValidStripeCustomerId('cus_abc-123')).toBe(false);
    expect(isValidStripeCustomerId('cus_abc 123')).toBe(false);
    expect(isValidStripeCustomerId('cus_abc!')).toBe(false);
  });
});
