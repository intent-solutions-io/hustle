/**
 * Subscription Lifecycle Ledger
 *
 * Phase 7 Task 8: Full Subscription Lifecycle Ledger
 *
 * Append-only, Firestore-backed ledger for recording all billing-relevant
 * events for a workspace. Provides immutable audit trail for troubleshooting.
 *
 * Collection: workspaces/{workspaceId}/billing_ledger/{eventId}
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

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Ledger event source
 */
export type LedgerEventSource = 'webhook' | 'replay' | 'auditor' | 'manual' | 'enforcement';

/**
 * Ledger event type
 *
 * Describes what happened in this billing event.
 */
export type LedgerEventType =
  // Subscription events
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_deleted'
  | 'subscription_paused'
  | 'subscription_resumed'
  // Payment events
  | 'payment_succeeded'
  | 'payment_failed'
  // Plan changes
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'plan_changed'
  // Status changes
  | 'status_changed'
  | 'workspace_suspended'
  | 'workspace_reactivated'
  // Drift detection
  | 'drift_detected'
  | 'drift_resolved'
  // Admin actions
  | 'manual_adjustment'
  | 'event_replayed';

/**
 * Billing event record
 *
 * Stored in Firestore subcollection: workspaces/{workspaceId}/billing_ledger/{eventId}
 */
export interface BillingLedgerEvent {
  type: LedgerEventType;
  stripeEventId: string | null;
  timestamp: FirebaseFirestore.Timestamp;
  statusBefore: string | null;
  statusAfter: string | null;
  planBefore: string | null;
  planAfter: string | null;
  source: LedgerEventSource;
  note: string | null;
}

/**
 * Input for recording a billing event
 *
 * timestamp is auto-generated via serverTimestamp()
 */
export interface RecordBillingEventInput {
  type: LedgerEventType;
  stripeEventId?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  planBefore?: string | null;
  planAfter?: string | null;
  source: LedgerEventSource;
  note?: string | null;
}

/**
 * Record a billing event in the ledger
 *
 * Writes an append-only record to the workspace's billing_ledger subcollection.
 * This is passive observation - does not modify workspace or Stripe state.
 *
 * @param workspaceId - Workspace ID
 * @param event - Event details
 * @returns Document ID of created ledger entry
 * @throws Error if validation fails or Firestore write fails
 */
export async function recordBillingEvent(
  workspaceId: string,
  event: RecordBillingEventInput
): Promise<string> {
  // 1. Validate required fields
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new Error('Invalid workspaceId: must be non-empty string');
  }

  if (!event.type || typeof event.type !== 'string') {
    throw new Error('Invalid event.type: must be non-empty string');
  }

  if (!event.source || typeof event.source !== 'string') {
    throw new Error('Invalid event.source: must be one of webhook, replay, auditor, manual, enforcement');
  }

  // 2. Validate source enum
  const validSources: LedgerEventSource[] = ['webhook', 'replay', 'auditor', 'manual', 'enforcement'];
  if (!validSources.includes(event.source)) {
    throw new Error(
      `Invalid event.source: ${event.source}. Must be one of: ${validSources.join(', ')}`
    );
  }

  // 3. Build ledger document
  const ledgerDoc: Omit<BillingLedgerEvent, 'timestamp'> & {
    timestamp: FirebaseFirestore.FieldValue;
  } = {
    type: event.type,
    stripeEventId: event.stripeEventId ?? null,
    timestamp: FieldValue.serverTimestamp(),
    statusBefore: event.statusBefore ?? null,
    statusAfter: event.statusAfter ?? null,
    planBefore: event.planBefore ?? null,
    planAfter: event.planAfter ?? null,
    source: event.source,
    note: event.note ?? null,
  };

  // 4. Write to Firestore subcollection (append-only)
  try {
    const docRef = await adminDb
      .collection('workspaces')
      .doc(workspaceId)
      .collection('billing_ledger')
      .add(ledgerDoc);

    console.log('[Ledger] Recorded billing event:', {
      workspaceId,
      eventId: docRef.id,
      type: event.type,
      source: event.source,
    });

    return docRef.id;
  } catch (error: any) {
    console.error('[Ledger] Failed to record billing event:', error.message);
    throw new Error(`Failed to record billing event: ${error.message}`);
  }
}

/**
 * Get billing ledger for a workspace
 *
 * Returns recent billing events in descending timestamp order (newest first).
 * Read-only function for admin dashboard and troubleshooting.
 *
 * @param workspaceId - Workspace ID
 * @param limit - Maximum number of events to return (default: 50)
 * @returns Array of billing ledger events
 */
export async function getBillingLedger(
  workspaceId: string,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const snapshot = await adminDb
      .collection('workspaces')
      .doc(workspaceId)
      .collection('billing_ledger')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as BillingLedgerEvent),
    }));

    return events;
  } catch (error: any) {
    console.error('[Ledger] Failed to get billing ledger:', error.message);
    throw new Error(`Failed to get billing ledger: ${error.message}`);
  }
}

/**
 * Get billing ledger filtered by source
 *
 * Useful for debugging specific integration points (webhooks, replays, etc.)
 *
 * @param workspaceId - Workspace ID
 * @param source - Event source to filter by
 * @param limit - Maximum number of events to return (default: 50)
 * @returns Array of billing ledger events from specified source
 */
export async function getBillingLedgerBySource(
  workspaceId: string,
  source: LedgerEventSource,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const snapshot = await adminDb
      .collection('workspaces')
      .doc(workspaceId)
      .collection('billing_ledger')
      .where('source', '==', source)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as BillingLedgerEvent),
    }));

    return events;
  } catch (error: any) {
    console.error('[Ledger] Failed to get billing ledger by source:', error.message);
    throw new Error(`Failed to get billing ledger by source: ${error.message}`);
  }
}

/**
 * Get billing ledger filtered by event type
 *
 * Useful for tracking specific events (e.g., all payment failures)
 *
 * @param workspaceId - Workspace ID
 * @param type - Event type to filter by
 * @param limit - Maximum number of events to return (default: 50)
 * @returns Array of billing ledger events of specified type
 */
export async function getBillingLedgerByType(
  workspaceId: string,
  type: LedgerEventType,
  limit: number = 50
): Promise<Array<BillingLedgerEvent & { id: string }>> {
  try {
    const snapshot = await adminDb
      .collection('workspaces')
      .doc(workspaceId)
      .collection('billing_ledger')
      .where('type', '==', type)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as BillingLedgerEvent),
    }));

    return events;
  } catch (error: any) {
    console.error('[Ledger] Failed to get billing ledger by type:', error.message);
    throw new Error(`Failed to get billing ledger by type: ${error.message}`);
  }
}
