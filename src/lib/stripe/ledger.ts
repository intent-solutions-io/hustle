/**
 * Subscription Lifecycle Ledger
 *
 * Append-only audit log of billing-relevant events for each workspace.
 * Phase 4.5 migration: backing store changed from the Firestore
 * workspaces/{id}/billing_ledger subcollection to a single SQLite table
 * (`billingLedger`). Public function signatures are preserved so callers
 * (Stripe webhook, auditor, plan-enforcement, replay-events route) keep
 * working unchanged.
 *
 * Usage:
 * ```typescript
 * import { recordBillingEvent } from '@/lib/stripe/ledger';
 *
 * await recordBillingEvent(workspaceId, {
 *   type: 'subscription_updated',
 *   stripeEventId: 'evt_123',
 *   statusBefore: 'active',
 *   statusAfter: 'past_due',
 *   planBefore: 'starter',
 *   planAfter: 'starter',
 *   source: 'webhook',
 *   note: 'Payment failed - moved to grace period',
 * });
 * ```
 */

import {
  insertBillingLedgerEntry,
  listBillingLedger,
  listBillingLedgerBySource,
  listBillingLedgerByType,
  type LedgerEventSource,
  type LedgerEventType,
  type RecordBillingLedgerInput,
  type BillingLedgerRow,
} from "@/lib/db/queries/stripe-billing";

// Re-export the canonical type aliases so existing imports keep working.
export type { LedgerEventSource, LedgerEventType };

/**
 * Billing event row shape returned by the read helpers. Equivalent to the
 * legacy BillingLedgerEvent + id field used during the Firestore era.
 */
export interface BillingLedgerEvent {
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

/**
 * Input for recording a billing event.
 */
export type RecordBillingEventInput = RecordBillingLedgerInput;

function toEvent(row: BillingLedgerRow): BillingLedgerEvent & { id: string } {
  return {
    id: row.id,
    type: row.type,
    stripeEventId: row.stripeEventId,
    timestamp: row.timestamp,
    statusBefore: row.statusBefore,
    statusAfter: row.statusAfter,
    planBefore: row.planBefore,
    planAfter: row.planAfter,
    source: row.source,
    note: row.note,
  };
}

/**
 * Record a billing event in the ledger. Append-only; does not modify any
 * workspace or Stripe state.
 *
 * @param workspaceId - Workspace ID
 * @param event - Event details
 * @returns Row ID of the new ledger entry
 */
export async function recordBillingEvent(
  workspaceId: string,
  event: RecordBillingEventInput
): Promise<string> {
  try {
    const id = await insertBillingLedgerEntry(workspaceId, event);
    console.log("[Ledger] Recorded billing event:", {
      workspaceId,
      eventId: id,
      type: event.type,
      source: event.source,
    });
    return id;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Ledger] Failed to record billing event:", msg);
    throw new Error(`Failed to record billing event: ${msg}`);
  }
}

/**
 * Get the most recent billing events for a workspace, newest first.
 */
export async function getBillingLedger(
  workspaceId: string,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const rows = await listBillingLedger(workspaceId, limit);
    return rows.map(toEvent);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Ledger] Failed to get billing ledger:", msg);
    throw new Error(`Failed to get billing ledger: ${msg}`);
  }
}

/**
 * Filter billing ledger by source.
 */
export async function getBillingLedgerBySource(
  workspaceId: string,
  source: LedgerEventSource,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const rows = await listBillingLedgerBySource(workspaceId, source, limit);
    return rows.map(toEvent);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Ledger] Failed to get billing ledger by source:", msg);
    throw new Error(`Failed to get billing ledger by source: ${msg}`);
  }
}

/**
 * Filter billing ledger by event type.
 */
export async function getBillingLedgerByType(
  workspaceId: string,
  type: LedgerEventType,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const rows = await listBillingLedgerByType(workspaceId, type, limit);
    return rows.map(toEvent);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Ledger] Failed to get billing ledger by type:", msg);
    throw new Error(`Failed to get billing ledger by type: ${msg}`);
  }
}
