/**
 * Access Control Utilities
 *
 * Phase 7: Subscription Compliance Enforcement
 *
 * Server-side utilities for checking workspace subscription status
 * and enforcing access rules based on billing state.
 */

import { adminDb } from './admin';
import type { WorkspaceStatus } from '@/types/firestore';

/**
 * Access decision result
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  status?: WorkspaceStatus;
  workspaceId?: string;
}

/**
 * Workspace access rules by status
 */
const ACCESS_RULES: Record<WorkspaceStatus, { read: boolean; write: boolean }> = {
  active: { read: true, write: true },
  trial: { read: true, write: true },
  past_due: { read: true, write: false }, // Grace period: reads only
  canceled: { read: false, write: false }, // No access after cancellation
  suspended: { read: false, write: false }, // Account issues, no access
  deleted: { read: false, write: false }, // Soft-deleted, no access
};

/**
 * Check if workspace status allows the requested operation
 *
 * This function should be called at the start of every API route that modifies data.
 *
 * @param workspaceId - Workspace document ID
 * @param isWriteOperation - true for POST/PUT/DELETE, false for GET
 * @returns Access check result with allowed status and reason
 */
export async function checkWorkspaceAccess(
  workspaceId: string,
  isWriteOperation: boolean = true
): Promise<AccessCheckResult> {
  try {
    // Fetch workspace from Firestore
    const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
    const workspaceSnap = await workspaceRef.get();

    if (!workspaceSnap.exists) {
      return {
        allowed: false,
        reason: 'WORKSPACE_NOT_FOUND',
        workspaceId,
      };
    }

    const workspace = workspaceSnap.data();
    const status = workspace?.status as WorkspaceStatus;

    if (!status) {
      return {
        allowed: false,
        reason: 'INVALID_WORKSPACE_STATUS',
        workspaceId,
      };
    }

    // Check access rules
    const rules = ACCESS_RULES[status];
    const allowed = isWriteOperation ? rules.write : rules.read;

    // Log access denial
    if (!allowed) {
      console.warn(
        `[ACCESS CONTROL] Access denied: workspace=${workspaceId}, status=${status}, operation=${isWriteOperation ? 'write' : 'read'}`
      );

      // Return structured denial reason
      return {
        allowed: false,
        reason: getAccessDenialReason(status),
        status,
        workspaceId,
      };
    }

    return {
      allowed: true,
      status,
      workspaceId,
    };
  } catch (error: any) {
    console.error('[ACCESS CONTROL] Error checking workspace access:', error.message);
    return {
      allowed: false,
      reason: 'ACCESS_CHECK_FAILED',
    };
  }
}

/**
 * Get user-friendly denial reason based on workspace status
 */
function getAccessDenialReason(status: WorkspaceStatus): string {
  switch (status) {
    case 'past_due':
      return 'PAYMENT_PAST_DUE';
    case 'canceled':
      return 'SUBSCRIPTION_CANCELED';
    case 'suspended':
      return 'ACCOUNT_SUSPENDED';
    case 'deleted':
      return 'WORKSPACE_DELETED';
    default:
      return 'ACCESS_DENIED';
  }
}

/**
 * Get user-friendly error message for access denial
 *
 * @param reason - Access denial reason code
 * @returns Human-readable error message
 */
export function getAccessDenialMessage(reason: string): string {
  switch (reason) {
    case 'PAYMENT_PAST_DUE':
      return 'Your payment is past due. Please update your payment method to continue creating content.';
    case 'SUBSCRIPTION_CANCELED':
      return 'Your subscription has been canceled. Please reactivate your subscription to continue.';
    case 'ACCOUNT_SUSPENDED':
      return 'Your account has been suspended. Please contact support for assistance.';
    case 'WORKSPACE_DELETED':
      return 'This workspace has been deleted and is no longer accessible.';
    case 'WORKSPACE_NOT_FOUND':
      return 'Workspace not found. Please contact support if you believe this is an error.';
    default:
      return 'Access denied. Please check your subscription status or contact support.';
  }
}

/**
 * Require workspace write access
 *
 * Helper function that throws an error if write access is not allowed.
 * Use this at the start of API routes that create/update/delete resources.
 *
 * @param workspaceId - Workspace document ID
 * @throws Error with structured response if access denied
 */
export async function requireWorkspaceWriteAccess(workspaceId: string): Promise<void> {
  const accessCheck = await checkWorkspaceAccess(workspaceId, true);

  if (!accessCheck.allowed) {
    throw new WorkspaceAccessError(
      accessCheck.reason || 'ACCESS_DENIED',
      accessCheck.status || 'unknown'
    );
  }
}

/**
 * Require workspace read access
 *
 * Helper function that throws an error if read access is not allowed.
 * Use this at the start of API routes that read workspace data.
 *
 * @param workspaceId - Workspace document ID
 * @throws Error with structured response if access denied
 */
export async function requireWorkspaceReadAccess(workspaceId: string): Promise<void> {
  const accessCheck = await checkWorkspaceAccess(workspaceId, false);

  if (!accessCheck.allowed) {
    throw new WorkspaceAccessError(
      accessCheck.reason || 'ACCESS_DENIED',
      accessCheck.status || 'unknown'
    );
  }
}

/**
 * Custom error for workspace access denials
 *
 * Thrown when subscription status blocks access.
 * Includes structured error code and status for client handling.
 */
export class WorkspaceAccessError extends Error {
  public readonly code: string;
  public readonly status: string;
  public readonly httpStatus: number;

  constructor(code: string, status: string) {
    super(getAccessDenialMessage(code));
    this.name = 'WorkspaceAccessError';
    this.code = code;
    this.status = status;
    this.httpStatus = 403; // Forbidden
  }

  /**
   * Convert to JSON response
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      status: this.status,
    };
  }
}
