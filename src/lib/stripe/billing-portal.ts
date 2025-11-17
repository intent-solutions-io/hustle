/**
 * Stripe Billing Portal & Invoice Utilities
 *
 * Phase 7 Task 4: Customer Billing Portal & Invoice History
 *
 * Provides utilities for customer-facing billing management:
 * - Stripe Customer Portal session creation
 * - Invoice history retrieval
 */

import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import type { Workspace } from '@/types/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

/**
 * Invoice DTO for dashboard display
 */
export interface InvoiceDTO {
  id: string;
  hostedInvoiceUrl: string | null;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: number;
  periodStart: number | null;
  periodEnd: number | null;
  planName: string | null;
}

/**
 * Get or create Stripe Customer Portal URL
 *
 * Creates a short-lived session URL for the Stripe Customer Portal.
 * Customers can manage payment methods, view invoices, and update subscription.
 *
 * @param workspaceId - Workspace ID
 * @param returnPath - Path to return to after portal session (default: /dashboard/billing)
 * @returns Stripe Customer Portal URL
 * @throws Error if workspace has no stripeCustomerId
 * @throws Error if Stripe API fails
 */
export async function getOrCreateBillingPortalUrl(
  workspaceId: string,
  returnPath: string = '/dashboard/billing'
): Promise<string> {
  try {
    // 1. Get workspace from Firestore
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const workspace = {
      id: workspaceDoc.id,
      ...workspaceDoc.data(),
    } as unknown as Workspace;

    // 2. Ensure workspace has Stripe customer ID
    const customerId = workspace.billing?.stripeCustomerId;

    if (!customerId) {
      throw new Error('Workspace has no Stripe customer ID. Cannot create billing portal session.');
    }

    // 3. Build return URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
      'http://localhost:3000';
    const returnUrl = `${baseUrl}${returnPath}`;

    // 4. Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error: any) {
    console.error('[Billing Portal] Failed to create portal session:', {
      workspaceId,
      error: error.message,
    });
    throw new Error(`Failed to create billing portal session: ${error.message}`);
  }
}

/**
 * List recent invoices for workspace
 *
 * Fetches recent invoices from Stripe and maps to DTOs for dashboard display.
 *
 * @param workspaceId - Workspace ID
 * @param limit - Number of invoices to return (default: 5)
 * @returns Array of invoice DTOs
 * @throws Error if workspace lookup fails
 */
export async function listRecentInvoices(
  workspaceId: string,
  limit: number = 5
): Promise<InvoiceDTO[]> {
  try {
    // 1. Get workspace from Firestore
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const workspace = {
      id: workspaceDoc.id,
      ...workspaceDoc.data(),
    } as unknown as Workspace;

    // 2. Check for Stripe customer ID
    const customerId = workspace.billing?.stripeCustomerId;

    if (!customerId) {
      // No customer ID = no invoices yet (trial workspace)
      console.log('[Billing Portal] Workspace has no Stripe customer ID, returning empty invoice list');
      return [];
    }

    // 3. Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    // 4. Map to DTOs
    return invoices.data.map((invoice) => {
      // Extract plan name from line items
      let planName: string | null = null;
      if (invoice.lines.data.length > 0) {
        const firstLine = invoice.lines.data[0];
        planName =
          firstLine.price?.nickname ||
          firstLine.metadata?.plan ||
          firstLine.description ||
          null;
      }

      return {
        id: invoice.id,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        status: invoice.status || 'draft',
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        created: invoice.created,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        planName,
      };
    });
  } catch (error: any) {
    console.error('[Billing Portal] Failed to list invoices:', {
      workspaceId,
      error: error.message,
    });
    throw new Error(`Failed to list invoices: ${error.message}`);
  }
}
