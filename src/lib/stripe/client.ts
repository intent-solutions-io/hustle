/**
 * Stripe Client Configuration
 *
 * Centralized Stripe SDK initialization with lazy loading
 * to avoid build-time errors when env vars are not available.
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Get Stripe client (lazy initialization)
 *
 * Uses lazy initialization to prevent build-time errors
 * when STRIPE_SECRET_KEY is not available.
 */
export function getStripeClient(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
  return _stripe;
}

// Legacy export for backward compatibility
export const stripe = {
  get customers() { return getStripeClient().customers; },
  get subscriptions() { return getStripeClient().subscriptions; },
  get checkout() { return getStripeClient().checkout; },
  get billingPortal() { return getStripeClient().billingPortal; },
  get webhooks() { return getStripeClient().webhooks; },
  get invoices() { return getStripeClient().invoices; },
  get prices() { return getStripeClient().prices; },
  get products() { return getStripeClient().products; },
  get paymentMethods() { return getStripeClient().paymentMethods; },
  get events() { return getStripeClient().events; },
};
