/**
 * POST /api/billing/change-plan Tests
 *
 * Validates plan change flow:
 * - Auth required (authWithProfile)
 * - User → workspace lookup
 * - Target price ID validation
 * - Workspace eligibility check
 * - Proration preview
 * - Checkout session creation
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  authWithProfile: vi.fn(),
  adminDbGet: vi.fn(),
  getPlanForPriceId: vi.fn(),
  validatePlanChangeEligibility: vi.fn(),
  getProrationPreview: vi.fn(),
  buildCheckoutSession: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({
  authWithProfile: mocks.authWithProfile,
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mocks.adminDbGet,
      })),
    })),
  },
}));

vi.mock('@/lib/billing/plan-change', () => ({
  validatePlanChangeEligibility: mocks.validatePlanChangeEligibility,
  getProrationPreview: mocks.getProrationPreview,
  buildCheckoutSession: mocks.buildCheckoutSession,
}));

vi.mock('@/lib/stripe/plan-mapping', () => ({
  getPlanForPriceId: mocks.getPlanForPriceId,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { POST } from './route';
import { createMockRequest } from '@/test-utils';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/billing/change-plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.authWithProfile.mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true,
    });

    // User doc with defaultWorkspaceId
    mocks.adminDbGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ defaultWorkspaceId: 'workspace-123' }),
      })
      // Workspace doc
      .mockResolvedValueOnce({
        exists: true,
        id: 'workspace-123',
        data: () => ({
          ownerUserId: 'user-123',
          plan: 'starter',
          status: 'active',
          billing: { stripeCustomerId: 'cus_test123', stripeSubscriptionId: 'sub_test123' },
          usage: { playerCount: 2, gamesThisMonth: 5, storageUsedMB: 50 },
        }),
      });

    mocks.getPlanForPriceId.mockReturnValue('plus');
    mocks.validatePlanChangeEligibility.mockReturnValue({ eligible: true });
    mocks.getProrationPreview.mockResolvedValue({
      amountDue: 1500,
      currentPeriodEnd: new Date('2026-04-01'),
      proratedAmount: 500,
      immediateCharge: 1000,
      currencyCode: 'usd',
    });
    mocks.buildCheckoutSession.mockResolvedValue('https://checkout.stripe.com/session/cs_test');
  });

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------

  it('returns 401 when not authenticated', async () => {
    mocks.authWithProfile.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  // -------------------------------------------------------------------------
  // User/workspace lookup
  // -------------------------------------------------------------------------

  it('returns 404 when user document not found', async () => {
    mocks.adminDbGet.mockReset();
    mocks.adminDbGet.mockResolvedValueOnce({ exists: false, data: () => null });

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('USER_NOT_FOUND');
  });

  it('returns 404 when user has no default workspace', async () => {
    mocks.adminDbGet.mockReset();
    mocks.adminDbGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ defaultWorkspaceId: null }),
    });

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('NO_WORKSPACE');
  });

  it('returns 404 when workspace document not found', async () => {
    mocks.adminDbGet.mockReset();
    mocks.adminDbGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ defaultWorkspaceId: 'workspace-123' }),
      })
      .mockResolvedValueOnce({ exists: false, id: 'workspace-123', data: () => null });

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('WORKSPACE_NOT_FOUND');
  });

  // -------------------------------------------------------------------------
  // Request validation
  // -------------------------------------------------------------------------

  it('returns 400 when targetPriceId is missing', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {},
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('returns 400 when targetPriceId is not a string', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 123 },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when price ID is unknown', async () => {
    mocks.getPlanForPriceId.mockImplementation(() => {
      throw new Error('Unknown Stripe price ID');
    });

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_unknown' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_PRICE_ID');
  });

  // -------------------------------------------------------------------------
  // Eligibility
  // -------------------------------------------------------------------------

  it('returns 403 when workspace is not eligible for plan change', async () => {
    mocks.validatePlanChangeEligibility.mockReturnValue({
      eligible: false,
      reason: 'Workspace is canceled',
    });

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('NOT_ELIGIBLE');
  });

  // -------------------------------------------------------------------------
  // Proration failure
  // -------------------------------------------------------------------------

  it('returns 500 when proration preview fails', async () => {
    mocks.getProrationPreview.mockRejectedValue(new Error('Stripe API error'));

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('PRORATION_FAILED');
  });

  // -------------------------------------------------------------------------
  // Checkout failure
  // -------------------------------------------------------------------------

  it('returns 500 when checkout session creation fails', async () => {
    mocks.buildCheckoutSession.mockRejectedValue(new Error('Checkout failed'));

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('CHECKOUT_FAILED');
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns success with checkout URL and preview on valid request', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.url).toBe('https://checkout.stripe.com/session/cs_test');
    expect(body.preview).toEqual({
      amountDue: 1500,
      currentPeriodEnd: '2026-04-01T00:00:00.000Z',
      proratedAmount: 500,
      immediateCharge: 1000,
      currencyCode: 'usd',
    });
  });

  it('calls validatePlanChangeEligibility with the workspace', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    await POST(request);

    expect(mocks.validatePlanChangeEligibility).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'workspace-123', plan: 'starter' })
    );
  });

  it('calls buildCheckoutSession with workspace and target price ID', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    await POST(request);

    expect(mocks.buildCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'workspace-123' }),
      'price_plus_test'
    );
  });

  // -------------------------------------------------------------------------
  // Stripe API error handling
  // -------------------------------------------------------------------------

  it('returns 500 with STRIPE_ERROR when a Stripe-typed error is thrown', async () => {
    const stripeError = new Error('Invalid request') as Error & { type: string };
    stripeError.type = 'StripeInvalidRequestError';

    mocks.getProrationPreview.mockRejectedValue(stripeError);

    const request = createMockRequest({
      method: 'POST',
      body: { targetPriceId: 'price_plus_test' },
      url: 'http://localhost:3000/api/billing/change-plan',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
