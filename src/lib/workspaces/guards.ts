/**
 * Workspace Status Guards
 *
 * Phase 6 Task 1: Status-specific access enforcement utilities
 *
 * These guards provide granular assertion helpers for different workspace states.
 * Use these at the start of API routes to enforce subscription compliance.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { WorkspaceStatus, WorkspaceDocument } from '@/types/firestore';
import { WorkspaceAccessError } from '@/lib/firebase/access-control';

/**
 * Workspace with full data for status checks
 */
interface WorkspaceStatusCheck {
  id: string;
  status: WorkspaceStatus;
  plan: string;
  trialEndsAt?: Date | null;
  currentPeriodEnd?: Date | null;
}

/**
 * Assert workspace is active OR trial (full write access)
 *
 * Use this for operations that require a paying or trial subscription.
 * Blocks: past_due, canceled, suspended, deleted
 *
 * @param workspaceId - Workspace document ID
 * @throws WorkspaceAccessError if not active or trial
 *
 * @example
 * ```typescript
 * await assertWorkspaceActiveOrTrial(workspace.id);
 * // Proceed with player/game creation
 * ```
 */
export async function assertWorkspaceActiveOrTrial(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  if (workspace.status !== 'active' && workspace.status !== 'trial') {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }

  // Additional trial expiration check
  if (workspace.status === 'trial' && workspace.trialEndsAt) {
    const now = new Date();
    if (now > workspace.trialEndsAt) {
      throw new WorkspaceAccessError('TRIAL_EXPIRED', 'trial');
    }
  }
}

/**
 * Assert workspace is NOT canceled/suspended/deleted (grace period allowed)
 *
 * Use this for read operations that should allow past_due accounts.
 * Blocks: canceled, suspended, deleted
 * Allows: active, trial, past_due
 *
 * @param workspaceId - Workspace document ID
 * @throws WorkspaceAccessError if canceled/suspended/deleted
 *
 * @example
 * ```typescript
 * await assertWorkspaceNotTerminated(workspace.id);
 * // Allow viewing existing players/games during grace period
 * ```
 */
export async function assertWorkspaceNotTerminated(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  const terminatedStatuses: WorkspaceStatus[] = ['canceled', 'suspended', 'deleted'];
  if (terminatedStatuses.includes(workspace.status)) {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }
}

/**
 * Assert workspace is NOT past_due (payment required)
 *
 * Use this for operations that should not allow grace period accounts.
 * Blocks: past_due, canceled, suspended, deleted
 * Allows: active, trial
 *
 * @param workspaceId - Workspace document ID
 * @throws WorkspaceAccessError if payment past due or worse
 *
 * @example
 * ```typescript
 * await assertWorkspacePaymentCurrent(workspace.id);
 * // Proceed with premium features (exports, uploads, etc.)
 * ```
 */
export async function assertWorkspacePaymentCurrent(workspaceId: string): Promise<void> {
  const workspace = await getWorkspaceStatus(workspaceId);

  const paymentRequiredStatuses: WorkspaceStatus[] = ['past_due', 'canceled', 'suspended', 'deleted'];
  if (paymentRequiredStatuses.includes(workspace.status)) {
    throw new WorkspaceAccessError(
      getStatusErrorCode(workspace.status),
      workspace.status
    );
  }
}

/**
 * Get workspace status information
 *
 * @param workspaceId - Workspace document ID
 * @returns Workspace status check object
 * @throws WorkspaceAccessError if workspace not found
 */
async function getWorkspaceStatus(workspaceId: string): Promise<WorkspaceStatusCheck> {
  const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
  const workspaceSnap = await workspaceRef.get();

  if (!workspaceSnap.exists) {
    throw new WorkspaceAccessError('WORKSPACE_NOT_FOUND', 'unknown');
  }

  const data = workspaceSnap.data() as WorkspaceDocument;

  return {
    id: workspaceSnap.id,
    status: data.status,
    plan: data.plan,
    trialEndsAt: data.trialEndsAt?.toDate() || null,
    currentPeriodEnd: data.billing?.currentPeriodEnd?.toDate() || null,
  };
}

/**
 * Map workspace status to error code
 */
function getStatusErrorCode(status: WorkspaceStatus): string {
  switch (status) {
    case 'past_due':
      return 'PAYMENT_PAST_DUE';
    case 'canceled':
      return 'SUBSCRIPTION_CANCELED';
    case 'suspended':
      return 'ACCOUNT_SUSPENDED';
    case 'deleted':
      return 'WORKSPACE_DELETED';
    case 'trial':
      return 'TRIAL_EXPIRED';
    default:
      return 'ACCESS_DENIED';
  }
}

/**
 * Check if workspace status allows write operations
 *
 * This is a helper for client-side checks (non-throwing version).
 *
 * @param status - Workspace status
 * @returns true if write operations allowed
 */
export function canWriteWithStatus(status: WorkspaceStatus): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * Check if workspace status allows read operations
 *
 * This is a helper for client-side checks (non-throwing version).
 *
 * @param status - Workspace status
 * @returns true if read operations allowed
 */
export function canReadWithStatus(status: WorkspaceStatus): boolean {
  return status === 'active' || status === 'trial' || status === 'past_due';
}

/**
 * Get user-friendly upgrade prompt based on workspace status
 *
 * @param status - Workspace status
 * @returns Upgrade prompt message
 */
export function getUpgradePrompt(status: WorkspaceStatus): string {
  switch (status) {
    case 'past_due':
      return 'Your payment is past due. Please update your payment method to continue creating content.';
    case 'canceled':
      return 'Your subscription has been canceled. Reactivate your subscription to continue using Hustle.';
    case 'suspended':
      return 'Your account has been suspended. Please contact support to resolve this issue.';
    case 'deleted':
      return 'This workspace has been deleted and is no longer accessible.';
    case 'trial':
      return 'Your trial has expired. Upgrade to a paid plan to continue using Hustle.';
    default:
      return 'Upgrade your subscription to access this feature.';
  }
}
