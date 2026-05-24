/**
 * Stripe Billing Portal & Invoice Utilities
 *
 * Phase 4.5 migration: workspace lookup moved off Firestore onto Drizzle.
 * Public function signatures unchanged.
 *
 * - getOrCreateBillingPortalUrl()  → short-lived Stripe Customer Portal URL
 * - listRecentInvoices()           → invoice DTOs for dashboard display
 */

import { getStripeClient } from "@/lib/stripe/client";
import { getWorkspaceByIdAdmin } from "@/lib/db/queries/workspaces";

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
 * Get or create Stripe Customer Portal URL.
 *
 * @param workspaceId - Workspace ID
 * @param returnPath - Path to return to after portal session (default: /dashboard/billing)
 * @returns Stripe Customer Portal URL
 * @throws Error if workspace not found, has no stripeCustomerId, or Stripe API fails
 */
export async function getOrCreateBillingPortalUrl(
  workspaceId: string,
  returnPath: string = "/dashboard/billing"
): Promise<string> {
  try {
    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const customerId = workspace.billing?.stripeCustomerId;
    if (!customerId) {
      throw new Error(
        "Workspace has no Stripe customer ID. Cannot create billing portal session."
      );
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
      "http://localhost:3000";
    const returnUrl = `${baseUrl}${returnPath}`;

    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Billing Portal] Failed to create portal session:", {
      workspaceId,
      error: msg,
    });
    throw new Error(`Failed to create billing portal session: ${msg}`);
  }
}

/**
 * List recent invoices for workspace.
 *
 * @param workspaceId - Workspace ID
 * @param limit - Number of invoices to return (default: 5)
 * @returns Array of invoice DTOs (empty array if no Stripe customer yet)
 */
export async function listRecentInvoices(
  workspaceId: string,
  limit: number = 5
): Promise<InvoiceDTO[]> {
  try {
    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    const customerId = workspace.billing?.stripeCustomerId;
    if (!customerId) {
      console.log(
        "[Billing Portal] Workspace has no Stripe customer ID, returning empty invoice list"
      );
      return [];
    }

    const invoices = await getStripeClient().invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data.map((invoice) => {
      let planName: string | null = null;
      if (invoice.lines.data.length > 0) {
        const firstLine = invoice.lines.data[0] as unknown as {
          price?: { nickname?: string | null };
          metadata?: { plan?: string };
          description?: string | null;
        };
        planName =
          firstLine.price?.nickname ||
          firstLine.metadata?.plan ||
          firstLine.description ||
          null;
      }

      return {
        id: invoice.id ?? "",
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        status: invoice.status || "draft",
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        created: invoice.created,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        planName,
      };
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Billing Portal] Failed to list invoices:", {
      workspaceId,
      error: msg,
    });
    throw new Error(`Failed to list invoices: ${msg}`);
  }
}
