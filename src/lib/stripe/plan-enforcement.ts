/**
 * Workspace Plan Change Audit & Enforcement
 *
 * Phase 7 Task 9: Unified Plan Enforcement Engine
 *
 * Enforces plan changes consistently across Stripe webhooks, workspace documents,
 * ledger, billing auditor, and replay mechanisms.
 *
 * Ensures workspace state always converges to correct plan/status even if:
 * - Stripe webhook delivery is delayed
 * - Webhooks arrive out of order
 * - Webhooks are duplicated
 * - Drift is detected by auditor
 *
 * Usage:
 * ```typescript
 * import { enforceWorkspacePlan } from '@/lib/stripe/plan-enforcement';
 *
 * await enforceWorkspacePlan(workspaceId, {
 *   stripePriceId: 'price_1234',
 *   stripeStatus: 'active',
 *   source: 'webhook',
 *   stripeEventId: 'evt_1234',
 * });
 * ```
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Workspace, WorkspacePlan, WorkspaceStatus } from '@/types/firestore';
import {
  getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus,
} from '@/lib/stripe/plan-mapping';
import { recordBillingEvent, LedgerEventSource } from '@/lib/stripe/ledger';

/**
 * Enforcement input parameters
 */
export interface EnforcePlanInput {
  stripePriceId: string;
  stripeStatus: string; // Stripe subscription status
  source: LedgerEventSource;
  stripeEventId: string | null;
}

/**
 * Enforcement result
 */
export interface EnforcePlanResult {
  workspaceId: string;
  planChanged: boolean;
  statusChanged: boolean;
  planBefore: WorkspacePlan | null;
  planAfter: WorkspacePlan | null;
  statusBefore: WorkspaceStatus | null;
  statusAfter: WorkspaceStatus | null;
  ledgerEventId: string;
}

/**
 * Enforce workspace plan and status based on Stripe data
 *
 * This is the unified, authoritative mechanism for plan changes.
 * Always converges to correct state regardless of webhook order.
 *
 * Responsibilities:
 * 1. Compare workspace.plan with Stripe plan (from price ID)
 * 2. Compare workspace.status with Stripe status
 * 3. If mismatch: update workspace + record delta in ledger
 * 4. If no mismatch: record noop in ledger
 *
 * IMPORTANT: This function NEVER modifies Stripe data.
 * Workspace is source of truth for runtime behavior.
 * Stripe subscription is source of truth for billing.
 *
 * @param workspaceId - Workspace ID to enforce
 * @param input - Enforcement parameters
 * @returns Enforcement result with before/after state
 * @throws Error if workspace not found or validation fails
 */
export async function enforceWorkspacePlan(
  workspaceId: string,
  input: EnforcePlanInput
): Promise<EnforcePlanResult> {
  // 1. Validate inputs
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new Error('Invalid workspaceId: must be non-empty string');
  }

  if (!input.stripePriceId || typeof input.stripePriceId !== 'string') {
    throw new Error('Invalid stripePriceId: must be non-empty string');
  }

  if (!input.stripeStatus || typeof input.stripeStatus !== 'string') {
    throw new Error('Invalid stripeStatus: must be non-empty string');
  }

  if (!input.source || typeof input.source !== 'string') {
    throw new Error('Invalid source: must be one of webhook, replay, auditor, manual, enforcement');
  }

  const validSources: LedgerEventSource[] = ['webhook', 'replay', 'auditor', 'manual', 'enforcement'];
  if (!validSources.includes(input.source)) {
    throw new Error(
      `Invalid source: ${input.source}. Must be one of: ${validSources.join(', ')}`
    );
  }

  // 2. Fetch workspace from Firestore
  const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

  if (!workspaceDoc.exists) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const workspaceData = workspaceDoc.data();
  const workspace = {
    id: workspaceDoc.id,
    ...workspaceData,
    createdAt: workspaceData?.createdAt?.toDate() || new Date(),
    updatedAt: workspaceData?.updatedAt?.toDate() || new Date(),
    deletedAt: workspaceData?.deletedAt?.toDate() || null,
    billing: {
      stripeCustomerId: workspaceData?.billing?.stripeCustomerId || null,
      stripeSubscriptionId: workspaceData?.billing?.stripeSubscriptionId || null,
      currentPeriodEnd: workspaceData?.billing?.currentPeriodEnd?.toDate() || null,
    },
    members: (workspaceData?.members || []).map((member: any) => ({
      ...member,
      addedAt: member.addedAt?.toDate() || new Date(),
    })),
  } as unknown as Workspace;

  // 3. Map Stripe data to workspace types
  let targetPlan: WorkspacePlan;
  try {
    targetPlan = getPlanForPriceId(input.stripePriceId);
  } catch (error: any) {
    throw new Error(`Failed to map Stripe price ID to plan: ${error.message}`);
  }

  let targetStatus: WorkspaceStatus;
  try {
    targetStatus = mapStripeStatusToWorkspaceStatus(input.stripeStatus as any);
  } catch (error: any) {
    throw new Error(`Failed to map Stripe status to workspace status: ${error.message}`);
  }

  // 4. Detect deltas
  const planBefore = workspace.plan;
  const statusBefore = workspace.status;
  const planChanged = planBefore !== targetPlan;
  const statusChanged = statusBefore !== targetStatus;

  console.log('[Plan Enforcement]', {
    workspaceId,
    source: input.source,
    planBefore,
    targetPlan,
    planChanged,
    statusBefore,
    targetStatus,
    statusChanged,
  });

  // 5. Update workspace if mismatch detected
  if (planChanged || statusChanged) {
    // Update Firestore workspace document
    const updates: Partial<Workspace> = {
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    if (planChanged) {
      updates.plan = targetPlan;
    }

    if (statusChanged) {
      updates.status = targetStatus;
    }

    try {
      await adminDb.collection('workspaces').doc(workspaceId).update(updates);
    } catch (error: any) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }

    // Record delta in ledger
    const ledgerEventId = await recordBillingEvent(workspaceId, {
      type: 'plan_changed', // Use existing ledger event type
      stripeEventId: input.stripeEventId,
      statusBefore,
      statusAfter: statusChanged ? targetStatus : statusBefore,
      planBefore,
      planAfter: planChanged ? targetPlan : planBefore,
      source: input.source,
      note: `Plan enforcement: ${planChanged ? `${planBefore}→${targetPlan}` : 'plan unchanged'}, ${statusChanged ? `${statusBefore}→${targetStatus}` : 'status unchanged'}`,
    });

    console.log('[Plan Enforcement] Applied changes:', {
      workspaceId,
      planBefore,
      planAfter: targetPlan,
      statusBefore,
      statusAfter: targetStatus,
      ledgerEventId,
    });

    return {
      workspaceId,
      planChanged,
      statusChanged,
      planBefore,
      planAfter: targetPlan,
      statusBefore,
      statusAfter: targetStatus,
      ledgerEventId,
    };
  } else {
    // No changes needed - record noop in ledger
    const ledgerEventId = await recordBillingEvent(workspaceId, {
      type: 'plan_changed', // Same type, but note indicates noop
      stripeEventId: input.stripeEventId,
      statusBefore,
      statusAfter: statusBefore,
      planBefore,
      planAfter: planBefore,
      source: input.source,
      note: 'Plan enforcement: no changes (workspace already in sync with Stripe)',
    });

    console.log('[Plan Enforcement] No changes needed:', {
      workspaceId,
      plan: planBefore,
      status: statusBefore,
      ledgerEventId,
    });

    return {
      workspaceId,
      planChanged: false,
      statusChanged: false,
      planBefore,
      planAfter: planBefore,
      statusBefore,
      statusAfter: statusBefore,
      ledgerEventId,
    };
  }
}

/**
 * Validate enforcement source
 *
 * Helper function to ensure source is valid before calling enforceWorkspacePlan()
 *
 * @param source - Event source to validate
 * @returns true if valid
 */
export function isValidEnforcementSource(source: string): source is LedgerEventSource {
  const validSources: LedgerEventSource[] = ['webhook', 'replay', 'auditor', 'manual', 'enforcement'];
  return validSources.includes(source as LedgerEventSource);
}
