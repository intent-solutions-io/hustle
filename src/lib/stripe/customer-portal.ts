/**
 * Stripe Customer Portal Utilities
 *
 * Phase 7 Task 1: Customer Portal Integration
 *
 * Helper functions for creating and managing Stripe Customer Portal sessions.
 * The Customer Portal allows customers to:
 * - Update payment method
 * - View invoices and download receipts
 * - Cancel subscription
 * - Resume subscription
 * - View subscription details
 */

import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

/**
 * Create a Stripe Customer Portal session
 *
 * This function creates a secure session URL that redirects the customer
 * to the Stripe-hosted Customer Portal for self-service billing management.
 *
 * @param customerId - Stripe customer ID (from workspace.billing.stripeCustomerId)
 * @param returnUrl - URL to redirect to after portal session (typically dashboard)
 * @returns Stripe Customer Portal session object with URL
 * @throws Error if Stripe API call fails
 *
 * @example
 * ```typescript
 * const session = await createCustomerPortalSession(
 *   'cus_abc123',
 *   'https://example.com/dashboard/settings/billing'
 * );
 * // Redirect user to: session.url
 * ```
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error: any) {
    console.error('[Stripe Customer Portal] Failed to create session:', error.message);
    throw new Error(`Failed to create customer portal session: ${error.message}`);
  }
}

/**
 * Get default return URL for Customer Portal
 *
 * @returns Default dashboard URL for return_url parameter
 */
export function getDefaultReturnUrl(): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || 'http://localhost:3000';
  return `${baseUrl}/dashboard/settings/billing`;
}

/**
 * Validate customer ID format
 *
 * @param customerId - Stripe customer ID to validate
 * @returns true if valid Stripe customer ID format
 */
export function isValidStripeCustomerId(customerId: string): boolean {
  return /^cus_[a-zA-Z0-9]+$/.test(customerId);
}
