/**
 * Stripe billing helpers (Drizzle / SQLite)
 *
 * Phase 4.5 migration. Cross-cutting helpers used by the Stripe webhook,
 * the billing portal, the auditor, the replay tool, and the workspace
 * guards. Workspace CRUD lives in src/lib/db/queries/workspaces.ts — this
 * module only adds Stripe-shaped helpers + the webhook idempotency log +
 * the billing ledger.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema/workspaces";
import { webhookEvents, billingLedger } from "@/lib/db/schema/billing";
import { users } from "@/lib/db/schema/auth";

// ---------------------------------------------------------------------------
// Workspace updates (Stripe-shape patches)
// ---------------------------------------------------------------------------

/**
 * Update a workspace's status (string column constrained by WorkspaceStatus).
 * Idempotent for the same value; bumps updatedAt.
 */
export async function updateWorkspaceStatus(
  workspaceId: string,
  status: string
): Promise<void> {
  await db
    .update(workspaces)
    .set({ status: status as never, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));
}

/**
 * Update a workspace's plan (string column constrained by WorkspacePlan).
 */
export async function updateWorkspacePlan(
  workspaceId: string,
  plan: string
): Promise<void> {
  await db
    .update(workspaces)
    .set({ plan: plan as never, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));
}

/**
 * Update billing-side fields on a workspace. All fields optional; only the
 * ones passed are written, mirroring the Firebase services contract.
 */
export async function updateWorkspaceBillingFields(
  workspaceId: string,
  patch: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
    subscriptionStatus?: string | null;
    lastPaymentFailedAt?: Date | null;
    canceledAt?: Date | null;
    trialEndsAt?: Date | null;
  }
): Promise<void> {
  const updates: Partial<typeof workspaces.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.stripeCustomerId !== undefined) {
    updates.billingStripeCustomerId = patch.stripeCustomerId;
  }
  if (patch.stripeSubscriptionId !== undefined) {
    updates.billingStripeSubscriptionId = patch.stripeSubscriptionId;
  }
  if (patch.currentPeriodEnd !== undefined) {
    updates.billingCurrentPeriodEnd = patch.currentPeriodEnd;
  }
  if (patch.subscriptionStatus !== undefined) {
    updates.billingSubscriptionStatus = patch.subscriptionStatus;
  }
  if (patch.lastPaymentFailedAt !== undefined) {
    updates.billingLastPaymentFailedAt = patch.lastPaymentFailedAt;
  }
  if (patch.canceledAt !== undefined) {
    updates.billingCanceledAt = patch.canceledAt;
  }
  if (patch.trialEndsAt !== undefined) {
    updates.trialEndsAt = patch.trialEndsAt;
  }

  await db.update(workspaces).set(updates).where(eq(workspaces.id, workspaceId));
}

/**
 * Find the workspace owner by workspace id. Used by the webhook to attach
 * a user email to outbound notification emails.
 */
export async function getWorkspaceOwnerUser(
  workspaceId: string
): Promise<{ id: string; email: string | null; firstName: string | null } | null> {
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (!ws) return null;
  const u = await db.query.users.findFirst({ where: eq(users.id, ws.ownerUserId) });
  if (!u) return null;
  return { id: u.id, email: u.email ?? null, firstName: u.firstName ?? null };
}

// ---------------------------------------------------------------------------
// Webhook idempotency
// ---------------------------------------------------------------------------

/**
 * Check whether a Stripe event id has already been seen. Used at the very
 * top of the webhook handler — duplicate deliveries become no-ops.
 */
export async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
  const row = await db.query.webhookEvents.findFirst({
    where: eq(webhookEvents.id, eventId),
  });
  return Boolean(row?.processedAt);
}

/**
 * Record receipt of a webhook event (idempotent insert; on duplicate id this
 * is a no-op so concurrent deliveries don't race).
 */
export async function recordWebhookEventReceipt(
  eventId: string,
  type: string,
  payload?: string
): Promise<void> {
  await db
    .insert(webhookEvents)
    .values({ id: eventId, type, payload: payload ?? null })
    .onConflictDoNothing();
}

/**
 * Mark a webhook event as fully processed.
 */
export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  await db
    .update(webhookEvents)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvents.id, eventId));
}

/**
 * Record an error during webhook processing (does not mark processed).
 */
export async function recordWebhookEventError(
  eventId: string,
  error: string
): Promise<void> {
  await db
    .update(webhookEvents)
    .set({ error })
    .where(eq(webhookEvents.id, eventId));
}

// ---------------------------------------------------------------------------
// Billing ledger
// ---------------------------------------------------------------------------

export type LedgerEventSource =
  | "webhook"
  | "replay"
  | "auditor"
  | "manual"
  | "enforcement";

export type LedgerEventType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_deleted"
  | "subscription_paused"
  | "subscription_resumed"
  | "payment_succeeded"
  | "payment_failed"
  | "plan_upgraded"
  | "plan_downgraded"
  | "plan_changed"
  | "status_changed"
  | "workspace_suspended"
  | "workspace_reactivated"
  | "drift_detected"
  | "drift_resolved"
  | "manual_adjustment"
  | "event_replayed";

export interface RecordBillingLedgerInput {
  type: LedgerEventType;
  stripeEventId?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  planBefore?: string | null;
  planAfter?: string | null;
  source: LedgerEventSource;
  note?: string | null;
}

export interface BillingLedgerRow {
  id: string;
  workspaceId: string;
  type: string;
  stripeEventId: string | null;
  timestamp: Date;
  statusBefore: string | null;
  statusAfter: string | null;
  planBefore: string | null;
  planAfter: string | null;
  source: string;
  note: string | null;
}

const VALID_SOURCES: LedgerEventSource[] = [
  "webhook",
  "replay",
  "auditor",
  "manual",
  "enforcement",
];

export async function insertBillingLedgerEntry(
  workspaceId: string,
  event: RecordBillingLedgerInput
): Promise<string> {
  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("Invalid workspaceId: must be non-empty string");
  }
  if (!event.type || typeof event.type !== "string") {
    throw new Error("Invalid event.type: must be non-empty string");
  }
  if (!event.source || !VALID_SOURCES.includes(event.source)) {
    throw new Error(
      `Invalid event.source: ${event.source}. Must be one of: ${VALID_SOURCES.join(", ")}`
    );
  }

  const [row] = await db
    .insert(billingLedger)
    .values({
      workspaceId,
      type: event.type,
      stripeEventId: event.stripeEventId ?? null,
      statusBefore: event.statusBefore ?? null,
      statusAfter: event.statusAfter ?? null,
      planBefore: event.planBefore ?? null,
      planAfter: event.planAfter ?? null,
      source: event.source,
      note: event.note ?? null,
    })
    .returning({ id: billingLedger.id });
  return row.id;
}

export async function listBillingLedger(
  workspaceId: string,
  limit: number = 50
): Promise<BillingLedgerRow[]> {
  return db
    .select()
    .from(billingLedger)
    .where(eq(billingLedger.workspaceId, workspaceId))
    .orderBy(desc(billingLedger.timestamp))
    .limit(limit);
}

export async function listBillingLedgerBySource(
  workspaceId: string,
  source: LedgerEventSource,
  limit: number = 50
): Promise<BillingLedgerRow[]> {
  return db
    .select()
    .from(billingLedger)
    .where(
      and(eq(billingLedger.workspaceId, workspaceId), eq(billingLedger.source, source))
    )
    .orderBy(desc(billingLedger.timestamp))
    .limit(limit);
}

export async function listBillingLedgerByType(
  workspaceId: string,
  type: LedgerEventType,
  limit: number = 50
): Promise<BillingLedgerRow[]> {
  return db
    .select()
    .from(billingLedger)
    .where(
      and(eq(billingLedger.workspaceId, workspaceId), eq(billingLedger.type, type))
    )
    .orderBy(desc(billingLedger.timestamp))
    .limit(limit);
}
