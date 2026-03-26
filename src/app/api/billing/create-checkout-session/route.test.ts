/**
 * Create Checkout Session Route Tests
 *
 * Tests for POST /api/billing/create-checkout-session
 * Covers auth enforcement, workspace ownership, Stripe customer creation,
 * checkout session creation, error handling, and billing feature flag.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createMockRequest,
  createMockSession,
  createMockWorkspace,
} from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const customersCreate = vi.fn();
  const checkoutSessionsCreate = vi.fn();

  return {
    // Auth
    auth: vi.fn(),

    // Workspace services
    getWorkspaceById: vi.fn(),
    updateWorkspaceBilling: vi.fn(),

    // Stripe internals
    customersCreate,
    checkoutSessionsCreate,
    getStripeClient: vi.fn(() => ({
      customers: { create: customersCreate },
      checkout: { sessions: { create: checkoutSessionsCreate } },
    })),
  };
});

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/services/workspaces', () => ({
  getWorkspaceById: mocks.getWorkspaceById,
  updateWorkspaceBilling: mocks.updateWorkspaceBilling,
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: mocks.getStripeClient,
}));

// ---------------------------------------------------------------------------
// Request factory
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown> = {}) {
  return createMockRequest({
    method: 'POST',
    body,
    url: 'http://localhost:3000/api/billing/create-checkout-session',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/billing/create-checkout-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.BILLING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_WEBSITE_DOMAIN = 'https://hustlestats.io';

    // Default happy-path session (authenticated, verified user)
    mocks.auth.mockResolvedValue(
      createMockSession({ id: 'user-123', email: 'coach@example.com' })
    );

    // Default workspace owned by the authenticated user
    mocks.getWorkspaceById.mockResolvedValue(
      createMockWorkspace({
        id: 'workspace-123',
        ownerUserId: 'user-123',
        billing: { stripeCustomerId: 'cus_existing123' },
      })
    );

    // Default Stripe checkout session
    mocks.checkoutSessionsCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    });

    mocks.updateWorkspaceBilling.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Billing feature flag
  // -------------------------------------------------------------------------

  describe('billing feature flag', () => {
    it('returns 503 with BILLING_DISABLED when billing is turned off', async () => {
      process.env.BILLING_ENABLED = 'false';

      const { POST } = await import('./route');
      const response = await POST(makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' }));
      const json = await response.json();

      expect(response.status).toBe(503);
      expect(json.error).toBe('BILLING_DISABLED');
    });

    it('proceeds normally when BILLING_ENABLED is "true"', async () => {
      process.env.BILLING_ENABLED = 'true';

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );

      // Expect NOT 503
      expect(response.status).not.toBe(503);
    });
  });

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------

  describe('authentication', () => {
    it('returns 401 when the user is not authenticated', async () => {
      mocks.auth.mockResolvedValue(null);

      const { POST } = await import('./route');
      const response = await POST(makeRequest({ workspaceId: 'workspace-123', priceId: 'price_x' }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  // -------------------------------------------------------------------------
  // Request validation
  // -------------------------------------------------------------------------

  describe('request body validation', () => {
    it('returns 400 when workspaceId is missing', async () => {
      const { POST } = await import('./route');
      const response = await POST(makeRequest({ priceId: 'price_starter_test' }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid request');
    });

    it('returns 400 when priceId is missing', async () => {
      const { POST } = await import('./route');
      const response = await POST(makeRequest({ workspaceId: 'workspace-123' }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid request');
    });

    it('returns 400 when both fields are empty strings', async () => {
      const { POST } = await import('./route');
      const response = await POST(makeRequest({ workspaceId: '', priceId: '' }));
      const json = await response.json();

      expect(response.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // Workspace access
  // -------------------------------------------------------------------------

  describe('workspace access', () => {
    it('returns 404 when workspace is not found', async () => {
      mocks.getWorkspaceById.mockResolvedValue(null);

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-missing', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Workspace not found');
    });

    it('returns 403 when the authenticated user is not the workspace owner', async () => {
      mocks.getWorkspaceById.mockResolvedValue(
        createMockWorkspace({ id: 'workspace-123', ownerUserId: 'different-user-999' })
      );

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toMatch(/Forbidden/i);
    });
  });

  // -------------------------------------------------------------------------
  // Happy paths
  // -------------------------------------------------------------------------

  describe('happy path: existing Stripe customer', () => {
    it('creates checkout session using existing customerId and returns session URL', async () => {
      // Workspace already has a Stripe customer ID
      mocks.getWorkspaceById.mockResolvedValue(
        createMockWorkspace({
          id: 'workspace-123',
          ownerUserId: 'user-123',
          billing: { stripeCustomerId: 'cus_existing123' },
        })
      );

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.sessionUrl).toBe('https://checkout.stripe.com/pay/cs_test123');
      expect(json.sessionId).toBe('cs_test123');

      // Should NOT create a new Stripe customer
      expect(mocks.customersCreate).not.toHaveBeenCalled();

      // Checkout session should use the existing customer ID
      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing123',
          mode: 'subscription',
          line_items: [{ price: 'price_starter_test', quantity: 1 }],
        })
      );
    });

    it('embeds workspaceId and userId in session metadata', async () => {
      const { POST } = await import('./route');
      await POST(makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' }));

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            workspaceId: 'workspace-123',
            userId: 'user-123',
          }),
        })
      );
    });

    it('uses NEXT_PUBLIC_WEBSITE_DOMAIN for success/cancel URLs', async () => {
      const { POST } = await import('./route');
      await POST(makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' }));

      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://hustlestats.io/dashboard?checkout=success',
          cancel_url: 'https://hustlestats.io/dashboard?checkout=canceled',
        })
      );
    });
  });

  describe('happy path: no existing Stripe customer', () => {
    it('creates a new Stripe customer, saves the ID, then creates the checkout session', async () => {
      mocks.getWorkspaceById.mockResolvedValue(
        createMockWorkspace({
          id: 'workspace-123',
          ownerUserId: 'user-123',
          billing: { stripeCustomerId: null as unknown as string },
        })
      );

      mocks.customersCreate.mockResolvedValue({ id: 'cus_brandnew456' });
      mocks.checkoutSessionsCreate.mockResolvedValue({
        id: 'cs_new123',
        url: 'https://checkout.stripe.com/pay/cs_new123',
      });

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.sessionUrl).toBe('https://checkout.stripe.com/pay/cs_new123');

      // Stripe customer must be created with correct metadata
      expect(mocks.customersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'coach@example.com',
          metadata: expect.objectContaining({
            workspaceId: 'workspace-123',
            userId: 'user-123',
          }),
        })
      );

      // The new customer ID must be saved before creating checkout
      expect(mocks.updateWorkspaceBilling).toHaveBeenCalledWith(
        'workspace-123',
        expect.objectContaining({ stripeCustomerId: 'cus_brandnew456' })
      );

      // Checkout session must use new customer ID
      expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_brandnew456' })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Stripe error handling
  // -------------------------------------------------------------------------

  describe('Stripe errors', () => {
    it('returns 400 for StripeCardError', async () => {
      const cardError = Object.assign(new Error('Your card was declined'), {
        type: 'StripeCardError',
      });
      mocks.checkoutSessionsCreate.mockRejectedValue(cardError);

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Card error');
      expect(json.details).toContain('Your card was declined');
    });

    it('returns 400 for StripeInvalidRequestError', async () => {
      const invalidErr = Object.assign(new Error('No such price: price_bad'), {
        type: 'StripeInvalidRequestError',
      });
      mocks.checkoutSessionsCreate.mockRejectedValue(invalidErr);

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_bad' })
      );
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid request to Stripe');
    });

    it('returns 500 for unexpected internal errors', async () => {
      mocks.checkoutSessionsCreate.mockRejectedValue(new Error('Network timeout'));

      const { POST } = await import('./route');
      const response = await POST(
        makeRequest({ workspaceId: 'workspace-123', priceId: 'price_starter_test' })
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
