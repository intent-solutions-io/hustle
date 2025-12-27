/**
 * Billing Consistency Auditor
 *
 * Phase 7 Task 7: Stripe Event Replay + Billing Consistency Auditor
 * Phase 7 Task 9: Unified Plan Enforcement Engine (integrated)
 *
 * Cross-checks Firestore workspace data against Stripe subscription data
 * to detect drift and inconsistencies.
 *
 * **Auto-Enforcement**: When simple drift is detected (status/plan mismatch),
 * automatically applies enforcement to fix it via enforceWorkspacePlan().
 *
 * Usage:
 * ```typescript
 * import { auditWorkspaceBilling } from '@/lib/stripe/auditor';
 *
 * const report = await auditWorkspaceBilling(workspaceId);
 * if (report.drift) {
 *   console.log('Drift detected:', report.driftReasons);
 *   console.log('Recommended fix:', report.recommendedFix);
 *   // If recommendedFix is 'run_event_replay', enforcement was auto-applied
 * }
 * ```
 */

import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Workspace, WorkspacePlan, WorkspaceStatus } from '@/types/firestore';
import {
  getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus,
} from '@/lib/stripe/plan-mapping';
import { recordBillingEvent } from '@/lib/stripe/ledger';
import { enforceWorkspacePlan } from '@/lib/stripe/plan-enforcement';

/** Safely convert Firestore Timestamp to Date with warning on missing data */
function safeTimestampToDate(
  value: unknown,
  fieldName: string,
  docId: string
): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  console.warn(
    `[auditor] Missing or invalid ${fieldName} for workspace ${docId}, using current time`
  );
  return new Date();
}

/**
 * Audit Report
 *
 * Returned by auditWorkspaceBilling(). Documents current state and any drift.
 */
export interface BillingAuditReport {
  workspaceId: string;

  // Firestore state
  localStatus: WorkspaceStatus;
  localPlan: WorkspacePlan;
  localStripeCustomerId: string | null;
  localStripeSubscriptionId: string | null;

  // Stripe state (null if no subscription)
  stripeStatus: Stripe.Subscription.Status | null;
  stripePlan: WorkspacePlan | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;

  // Drift detection
  drift: boolean;
  driftReasons: string[];

  // Recommended action
  recommendedFix: 'run_event_replay' | 'manual_stripe_review' | null;

  // Audit metadata
  auditedAt: Date;
}

/**
 * Audit workspace billing consistency
 *
 * Compares Firestore workspace data with Stripe subscription data.
 * Detects drift and recommends corrective action.
 *
 * @param workspaceId - Workspace ID to audit
 * @returns Audit report with drift detection
 * @throws Error if workspace not found or Stripe API fails
 */
export async function auditWorkspaceBilling(
  workspaceId: string
): Promise<BillingAuditReport> {
  // 1. Fetch workspace from Firestore
  const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

  if (!workspaceDoc.exists) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const workspaceData = workspaceDoc.data();
  const workspace = {
    id: workspaceDoc.id,
    ...workspaceData,
    // Convert Firestore Timestamps to Dates (with warning on missing data)
    createdAt: safeTimestampToDate(workspaceData?.createdAt, 'createdAt', workspaceId),
    updatedAt: safeTimestampToDate(workspaceData?.updatedAt, 'updatedAt', workspaceId),
    deletedAt: workspaceData?.deletedAt?.toDate() || null,
    billing: {
      stripeCustomerId: workspaceData?.billing?.stripeCustomerId || null,
      stripeSubscriptionId: workspaceData?.billing?.stripeSubscriptionId || null,
      currentPeriodEnd: workspaceData?.billing?.currentPeriodEnd?.toDate() || null,
    },
    members: (workspaceData?.members || []).map((member: { addedAt?: unknown; [key: string]: unknown }) => ({
      ...member,
      addedAt: safeTimestampToDate(member.addedAt, 'member.addedAt', workspaceId),
    })),
  } as unknown as Workspace;

  // 2. Initialize audit report with Firestore state
  const report: BillingAuditReport = {
    workspaceId,
    localStatus: workspace.status,
    localPlan: workspace.plan,
    localStripeCustomerId: workspace.billing.stripeCustomerId,
    localStripeSubscriptionId: workspace.billing.stripeSubscriptionId,
    stripeStatus: null,
    stripePlan: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: null,
    drift: false,
    driftReasons: [],
    recommendedFix: null,
    auditedAt: new Date(),
  };

  // 3. If no Stripe subscription ID, check if workspace should have one
  if (!workspace.billing.stripeSubscriptionId) {
    // Free plan workspaces shouldn't have subscriptions
    if (workspace.plan === 'free') {
      // No drift - free plan correctly has no subscription
      return report;
    }

    // Non-free plan without subscription = drift
    report.drift = true;
    report.driftReasons.push(
      `Workspace is on ${workspace.plan} plan but has no Stripe subscription ID`
    );
    report.recommendedFix = 'manual_stripe_review';
    return report;
  }

  // 4. Fetch Stripe subscription
  let subscription: Stripe.Subscription;
  try {
    subscription = await getStripeClient().subscriptions.retrieve(workspace.billing.stripeSubscriptionId);
  } catch (error: any) {
    // Subscription not found in Stripe
    report.drift = true;
    report.driftReasons.push(
      `Stripe subscription ${workspace.billing.stripeSubscriptionId} not found (may be deleted)`
    );
    report.recommendedFix = 'manual_stripe_review';
    return report;
  }

  // 5. Extract Stripe state
  report.stripeStatus = subscription.status;
  report.stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Get price ID from subscription (first line item)
  const priceId = subscription.items.data[0]?.price?.id || null;
  report.stripePriceId = priceId;

  // Map price ID to plan
  if (priceId) {
    try {
      report.stripePlan = getPlanForPriceId(priceId);
    } catch (error) {
      // Unknown price ID
      report.drift = true;
      report.driftReasons.push(`Unknown Stripe price ID: ${priceId}`);
      report.recommendedFix = 'manual_stripe_review';
    }
  }

  // 6. Detect drift

  // 6a. Status drift
  const expectedLocalStatus = mapStripeStatusToWorkspaceStatus(subscription.status);
  if (workspace.status !== expectedLocalStatus) {
    report.drift = true;
    report.driftReasons.push(
      `Status mismatch: Firestore=${workspace.status}, Stripe=${subscription.status} (expected ${expectedLocalStatus})`
    );
  }

  // 6b. Plan drift
  if (report.stripePlan && workspace.plan !== report.stripePlan) {
    report.drift = true;
    report.driftReasons.push(
      `Plan mismatch: Firestore=${workspace.plan}, Stripe=${report.stripePlan}`
    );
  }

  // 6c. Active subscription but canceled workspace
  if (subscription.status === 'active' && workspace.status === 'canceled') {
    report.drift = true;
    report.driftReasons.push(
      'Stripe subscription is active but workspace is canceled'
    );
  }

  // 6d. Canceled subscription but active workspace
  if (subscription.status === 'canceled' && workspace.status === 'active') {
    report.drift = true;
    report.driftReasons.push(
      'Stripe subscription is canceled but workspace is active'
    );
  }

  // 6e. Active subscription but suspended workspace
  if (subscription.status === 'active' && workspace.status === 'suspended') {
    report.drift = true;
    report.driftReasons.push(
      'Stripe subscription is active but workspace is suspended'
    );
  }

  // 6f. Suspended status but not past_due/unpaid in Stripe
  if (
    workspace.status === 'suspended' &&
    subscription.status !== 'past_due' &&
    subscription.status !== 'unpaid'
  ) {
    report.drift = true;
    report.driftReasons.push(
      `Workspace suspended but Stripe status is ${subscription.status} (expected past_due or unpaid)`
    );
  }

  // 7. Recommend fix strategy
  if (report.drift) {
    // If only status/plan drift, event replay can fix it
    const hasOnlyStatusOrPlanDrift = report.driftReasons.every(
      (reason) =>
        reason.includes('Status mismatch') || reason.includes('Plan mismatch')
    );

    if (hasOnlyStatusOrPlanDrift) {
      report.recommendedFix = 'run_event_replay';
    } else {
      // Complex drift (missing subscription, unknown price ID, etc.)
      report.recommendedFix = 'manual_stripe_review';
    }

    // 8. Apply automatic enforcement if drift can be fixed (Phase 7 Task 9)
    if (
      report.recommendedFix === 'run_event_replay' &&
      report.stripePriceId &&
      report.stripeStatus
    ) {
      // Drift is simple (status/plan mismatch) and can be automatically fixed
      await enforceWorkspacePlan(workspaceId, {
        stripePriceId: report.stripePriceId,
        stripeStatus: report.stripeStatus,
        source: 'auditor',
        stripeEventId: null, // No specific Stripe event triggered this
      });
    }

    // 9. Record drift detection in ledger (Phase 7 Task 8)
    // Note: enforceWorkspacePlan also records in ledger, creating full audit trail
    await recordBillingEvent(workspaceId, {
      type: 'drift_detected',
      stripeEventId: null,
      statusBefore: workspace.status,
      statusAfter: report.stripeStatus
        ? mapStripeStatusToWorkspaceStatus(report.stripeStatus)
        : null,
      planBefore: workspace.plan,
      planAfter: report.stripePlan,
      source: 'auditor',
      note: `Drift detected: ${report.driftReasons.join('; ')}. Recommended fix: ${report.recommendedFix}${report.recommendedFix === 'run_event_replay' ? ' (auto-applied via enforcement)' : ''}`,
    });
  }

  return report;
}

/**
 * Audit multiple workspaces
 *
 * Convenience function to audit all workspaces with Stripe subscriptions.
 * Useful for periodic drift detection.
 *
 * @returns Array of audit reports for workspaces with drift
 */
export async function auditAllWorkspaces(): Promise<BillingAuditReport[]> {
  const workspacesSnapshot = await adminDb
    .collection('workspaces')
    .where('billing.stripeSubscriptionId', '!=', null)
    .get();

  const reports: BillingAuditReport[] = [];

  for (const doc of workspacesSnapshot.docs) {
    try {
      const report = await auditWorkspaceBilling(doc.id);
      if (report.drift) {
        reports.push(report);
      }
    } catch (error: any) {
      console.error(`Failed to audit workspace ${doc.id}:`, error.message);
      // Continue auditing other workspaces
    }
  }

  return reports;
}
