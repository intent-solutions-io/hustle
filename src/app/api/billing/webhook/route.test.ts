/**
 * Stripe Webhook Handler Tests
 *
 * Tests for POST /api/billing/webhook
 * Verifies signature validation, event routing, and error handling.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createMockRequest,
  createMockWorkspace,
  createMockStripeSubscription,
  createMockStripeEvent,
  createMockStripeInvoice,
  createMockCheckoutSession,
  createMockStripeClient,
} from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mock state shared across vi.mock factories
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const stripeClient = {
    customers: { create: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
    subscriptions: { retrieve: vi.fn(), update: vi.fn(), cancel: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    invoices: { list: vi.fn(), createPreview: vi.fn() },
    prices: { retrieve: vi.fn() },
    events: { list: vi.fn() },
  };

  return {
    stripeClient,
    getStripeClient: vi.fn(() => stripeClient),
    getWorkspaceByStripeCustomerId: vi.fn(),
    updateWorkspaceBilling: vi.fn(),
    updateWorkspaceStatus: vi.fn(),
    getPlanForPriceId: vi.fn(),
    mapStripeStatusToWorkspaceStatus: vi.fn(),
    recordBillingEvent: vi.fn(),
    enforceWorkspacePlan: vi.fn(),
  };
});

vi.mock('@/lib/stripe/client', () => ({
  getStripeClient: mocks.getStripeClient,
}));

vi.mock('@/lib/firebase/services/workspaces', () => ({
  getWorkspaceByStripeCustomerId: mocks.getWorkspaceByStripeCustomerId,
  updateWorkspaceBilling: mocks.updateWorkspaceBilling,
  updateWorkspaceStatus: mocks.updateWorkspaceStatus,
}));

vi.mock('@/lib/stripe/plan-mapping', () => ({
  getPlanForPriceId: mocks.getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus: mocks.mapStripeStatusToWorkspaceStatus,
}));

vi.mock('@/lib/stripe/ledger', () => ({
  recordBillingEvent: mocks.recordBillingEvent,
}));

vi.mock('@/lib/stripe/plan-enforcement', () => ({
  enforceWorkspacePlan: mocks.enforceWorkspacePlan,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookRequest(body: string, signature: string | null = 'sig_test') {
  const headers: Record<string, string> = {};
  if (signature !== null) {
    headers['stripe-signature'] = signature;
  }
  return createMockRequest({
    method: 'POST',
    body,
    headers,
    url: 'http://localhost:3000/api/billing/webhook',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/billing/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    // Default: constructEvent succeeds (happy path overridden per test)
    mocks.stripeClient.webhooks.constructEvent.mockImplementation(
      (_body: string, _sig: string, _secret: string) => {
        throw new Error('No event configured - override per test');
      }
    );

    // Default happy-path downstream mocks
    mocks.enforceWorkspacePlan.mockResolvedValue({ ledgerEventId: 'led_123' });
    mocks.updateWorkspaceBilling.mockResolvedValue(undefined);
    mocks.updateWorkspaceStatus.mockResolvedValue(undefined);
    mocks.recordBillingEvent.mockResolvedValue('led_123');
    mocks.getPlanForPriceId.mockReturnValue('starter');
    mocks.mapStripeStatusToWorkspaceStatus.mockReturnValue('active');
  });

  // -------------------------------------------------------------------------
  // Signature validation
  // -------------------------------------------------------------------------

  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const { POST } = await import('./route');

      const request = makeWebhookRequest('{}', null);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Missing signature');
    });

    it('returns 400 when stripe-signature is invalid', async () => {
      const { POST } = await import('./route');

      mocks.stripeClient.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload');
      });

      const request = makeWebhookRequest('{}', 'bad_sig');
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid signature');
    });

    it('calls constructEvent with raw body, signature, and webhook secret', async () => {
      const { POST } = await import('./route');

      const body = JSON.stringify({ type: 'customer.subscription.updated' });
      const event = createMockStripeEvent(
        'customer.subscription.updated',
        createMockStripeSubscription()
      );
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(
        createMockWorkspace()
      );

      const request = makeWebhookRequest(body, 't=123,v1=abc');
      await POST(request);

      expect(mocks.stripeClient.webhooks.constructEvent).toHaveBeenCalledWith(
        body,
        't=123,v1=abc',
        'whsec_test'
      );
    });
  });

  // -------------------------------------------------------------------------
  // checkout.session.completed
  // -------------------------------------------------------------------------

  describe('checkout.session.completed', () => {
    it('returns 200 silently when workspaceId is missing from metadata', async () => {
      const { POST } = await import('./route');

      const session = createMockCheckoutSession({ metadata: {} });
      const event = createMockStripeEvent('checkout.session.completed', session);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('returns 200 silently when subscriptionId is missing', async () => {
      const { POST } = await import('./route');

      const session = createMockCheckoutSession({ subscription: null });
      const event = createMockStripeEvent('checkout.session.completed', session);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('happy path: retrieves subscription and enforces plan', async () => {
      const { POST } = await import('./route');

      const sub = createMockStripeSubscription({ status: 'active' });
      const session = createMockCheckoutSession({
        metadata: { workspaceId: 'workspace-123' },
        customer: 'cus_test123',
        subscription: 'sub_test123',
      });
      const event = createMockStripeEvent('checkout.session.completed', session, {
        id: 'evt_checkout_test',
      });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.stripeClient.subscriptions.retrieve.mockResolvedValue(sub);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.stripeClient.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123');
      expect(mocks.enforceWorkspacePlan).toHaveBeenCalledWith(
        'workspace-123',
        expect.objectContaining({
          stripePriceId: 'price_starter_test',
          stripeStatus: 'active',
          source: 'webhook',
          stripeEventId: 'evt_checkout_test',
        })
      );
    });

    it('happy path: calls updateWorkspaceBilling with customerId and subscriptionId', async () => {
      const { POST } = await import('./route');

      const periodEnd = Math.floor(Date.now() / 1000) + 86400;
      const sub = createMockStripeSubscription({ current_period_end: periodEnd });
      const session = createMockCheckoutSession({
        customer: 'cus_abc',
        subscription: 'sub_abc',
        metadata: { workspaceId: 'workspace-123' },
      });
      const event = createMockStripeEvent('checkout.session.completed', session);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.stripeClient.subscriptions.retrieve.mockResolvedValue(sub);

      await POST(makeWebhookRequest('{}'));

      expect(mocks.updateWorkspaceBilling).toHaveBeenCalledWith(
        'workspace-123',
        expect.objectContaining({
          stripeCustomerId: 'cus_abc',
          stripeSubscriptionId: 'sub_abc',
          currentPeriodEnd: expect.any(Date),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // customer.subscription.updated
  // -------------------------------------------------------------------------

  describe('customer.subscription.updated', () => {
    it('returns 200 silently when workspace not found', async () => {
      const { POST } = await import('./route');

      const sub = createMockStripeSubscription({ customer: 'cus_unknown' });
      const event = createMockStripeEvent('customer.subscription.updated', sub);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(null);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('happy path: enforces plan and updates billing period', async () => {
      const { POST } = await import('./route');

      const periodEnd = Math.floor(Date.now() / 1000) + 86400;
      const sub = createMockStripeSubscription({
        id: 'sub_updated',
        status: 'active',
        current_period_end: periodEnd,
      });
      const event = createMockStripeEvent('customer.subscription.updated', sub, {
        id: 'evt_sub_updated',
      });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const workspace = createMockWorkspace({ id: 'workspace-456' });
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(workspace);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({
          stripeStatus: 'active',
          source: 'webhook',
          stripeEventId: 'evt_sub_updated',
        })
      );
      expect(mocks.updateWorkspaceBilling).toHaveBeenCalledWith(
        'workspace-456',
        expect.objectContaining({ currentPeriodEnd: expect.any(Date) })
      );
    });
  });

  // -------------------------------------------------------------------------
  // customer.subscription.deleted
  // -------------------------------------------------------------------------

  describe('customer.subscription.deleted', () => {
    it('returns 200 when workspace not found', async () => {
      const { POST } = await import('./route');

      const sub = createMockStripeSubscription({ customer: 'cus_gone' });
      const event = createMockStripeEvent('customer.subscription.deleted', sub);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(null);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('happy path: enforces plan with status=canceled and updates periodEnd', async () => {
      const { POST } = await import('./route');

      const periodEnd = Math.floor(Date.now() / 1000) + 86400;
      const sub = createMockStripeSubscription({
        status: 'canceled',
        current_period_end: periodEnd,
      });
      const event = createMockStripeEvent('customer.subscription.deleted', sub, {
        id: 'evt_sub_deleted',
      });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const workspace = createMockWorkspace({ id: 'workspace-789' });
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(workspace);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).toHaveBeenCalledWith(
        'workspace-789',
        expect.objectContaining({
          stripeStatus: 'canceled',
          source: 'webhook',
        })
      );
      expect(mocks.updateWorkspaceBilling).toHaveBeenCalledWith(
        'workspace-789',
        expect.objectContaining({ currentPeriodEnd: new Date(periodEnd * 1000) })
      );
    });
  });

  // -------------------------------------------------------------------------
  // invoice.payment_failed
  // -------------------------------------------------------------------------

  describe('invoice.payment_failed', () => {
    it('returns 200 silently when invoice has no subscription (one-time payment)', async () => {
      const { POST } = await import('./route');

      const invoice = createMockStripeInvoice({ subscription: null, parent: null });
      const event = createMockStripeEvent('invoice.payment_failed', invoice);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.getWorkspaceByStripeCustomerId).not.toHaveBeenCalled();
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('returns 200 when workspace not found', async () => {
      const { POST } = await import('./route');

      const invoice = createMockStripeInvoice({ subscription: 'sub_fail' });
      const event = createMockStripeEvent('invoice.payment_failed', invoice);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(null);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('happy path: retrieves subscription and enforces plan with status=past_due', async () => {
      const { POST } = await import('./route');

      const sub = createMockStripeSubscription({ status: 'past_due' });
      const invoice = createMockStripeInvoice({
        customer: 'cus_test123',
        subscription: 'sub_test123',
      });
      const event = createMockStripeEvent('invoice.payment_failed', invoice, {
        id: 'evt_pay_fail',
      });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const workspace = createMockWorkspace({ id: 'workspace-100' });
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(workspace);
      mocks.stripeClient.subscriptions.retrieve.mockResolvedValue(sub);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.stripeClient.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123');
      expect(mocks.enforceWorkspacePlan).toHaveBeenCalledWith(
        'workspace-100',
        expect.objectContaining({
          stripeStatus: 'past_due',
          source: 'webhook',
          stripeEventId: 'evt_pay_fail',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // invoice.payment_succeeded
  // -------------------------------------------------------------------------

  describe('invoice.payment_succeeded', () => {
    it('returns 200 silently when invoice has no subscription', async () => {
      const { POST } = await import('./route');

      const invoice = createMockStripeInvoice({ subscription: null, parent: null });
      const event = createMockStripeEvent('invoice.payment_succeeded', invoice);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('returns 200 when workspace not found', async () => {
      const { POST } = await import('./route');

      const invoice = createMockStripeInvoice({ subscription: 'sub_ok' });
      const event = createMockStripeEvent('invoice.payment_succeeded', invoice);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(null);

      const response = await POST(makeWebhookRequest('{}'));

      expect(response.status).toBe(200);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
    });

    it('happy path: enforces plan with status=active and updates billing period', async () => {
      const { POST } = await import('./route');

      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
      const sub = createMockStripeSubscription({
        status: 'active',
        current_period_end: periodEnd,
      });
      const invoice = createMockStripeInvoice({
        customer: 'cus_test123',
        subscription: 'sub_test123',
        amount_paid: 900,
      });
      const event = createMockStripeEvent('invoice.payment_succeeded', invoice, {
        id: 'evt_pay_ok',
      });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const workspace = createMockWorkspace({ id: 'workspace-200' });
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(workspace);
      mocks.stripeClient.subscriptions.retrieve.mockResolvedValue(sub);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).toHaveBeenCalledWith(
        'workspace-200',
        expect.objectContaining({
          stripeStatus: 'active',
          source: 'webhook',
          stripeEventId: 'evt_pay_ok',
        })
      );
      expect(mocks.updateWorkspaceBilling).toHaveBeenCalledWith(
        'workspace-200',
        expect.objectContaining({ currentPeriodEnd: new Date(periodEnd * 1000) })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Unhandled / error cases
  // -------------------------------------------------------------------------

  describe('unhandled event types', () => {
    it('returns 200 for unhandled event type without invoking handlers', async () => {
      const { POST } = await import('./route');

      const event = createMockStripeEvent('customer.created', { id: 'cus_new' });
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(mocks.enforceWorkspacePlan).not.toHaveBeenCalled();
      expect(mocks.updateWorkspaceBilling).not.toHaveBeenCalled();
    });
  });

  describe('internal errors', () => {
    it('returns 500 when an unexpected error is thrown during event handling', async () => {
      const { POST } = await import('./route');

      const sub = createMockStripeSubscription();
      const event = createMockStripeEvent('customer.subscription.updated', sub);
      mocks.stripeClient.webhooks.constructEvent.mockReturnValue(event);
      mocks.getWorkspaceByStripeCustomerId.mockResolvedValue(createMockWorkspace());
      mocks.enforceWorkspacePlan.mockRejectedValue(new Error('Firestore exploded'));

      const response = await POST(makeWebhookRequest('{}'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Webhook processing failed');
    });
  });
});
