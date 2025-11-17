/**
 * Workspace Health Dashboard Loader
 *
 * Phase 7 Task 2: Workspace Health Dashboard Section
 *
 * Server-side function to fetch workspace health data including:
 * - Workspace status and plan
 * - Billing information and next action
 * - Usage metrics (players, games, pending verifications)
 * - Sync status (Stripe <-> Firestore)
 * - Email verification status
 */

import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import type { Workspace, WorkspaceStatus, WorkspacePlan } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

/**
 * Workspace Health Data Shape
 */
export interface WorkspaceHealthData {
  workspace: {
    id: string;
    status: WorkspaceStatus;
    plan: WorkspacePlan;
    currentPeriodEnd: string | null; // ISO date string
    nextBillingAction: 'none' | 'update_payment' | 'reactivate' | 'contact_support';
    usage: {
      players: number;
      games: number;
      pendingVerifications: number;
    };
    sync: {
      stripeLastSyncAt: string | null; // ISO date string
      firestoreLastUpdateAt: string; // ISO date string
    };
    emailVerified: boolean;
  };
}

/**
 * Get workspace health data for current user
 *
 * Server-side function for dashboard health page.
 *
 * @returns Workspace health data or null if user not authenticated
 * @throws Error if workspace fetch fails
 */
export async function getWorkspaceHealth(): Promise<WorkspaceHealthData | null> {
  // 1. Authenticate user
  const dashboardUser = await getDashboardUser();

  if (!dashboardUser) {
    return null;
  }

  // 2. Get user document
  const userDoc = await adminDb.collection('users').doc(dashboardUser.uid).get();

  if (!userDoc.exists) {
    throw new Error('User document not found');
  }

  const userData = userDoc.data();
  const defaultWorkspaceId = userData?.defaultWorkspaceId;

  if (!defaultWorkspaceId) {
    throw new Error('User has no default workspace');
  }

  // 3. Get workspace document
  const workspaceDoc = await adminDb.collection('workspaces').doc(defaultWorkspaceId).get();

  if (!workspaceDoc.exists) {
    throw new Error('Workspace not found');
  }

  const workspaceData = workspaceDoc.data();

  if (!workspaceData) {
    throw new Error('Workspace data is null');
  }

  const workspace = {
    id: workspaceDoc.id,
    ...workspaceData,
  } as Workspace & { id: string };

  // 4. Get player count (from workspace.usage.playerCount denormalized field)
  const playerCount = workspaceData.usage?.playerCount || 0;

  // 5. Get games count (from workspace.usage.gamesThisMonth denormalized field)
  const gamesCount = workspaceData.usage?.gamesThisMonth || 0;

  // 6. Count pending verifications across all players
  const pendingVerifications = await countPendingVerifications(dashboardUser.uid);

  // 7. Get Stripe subscription to confirm sync (if customer ID exists)
  let stripeLastSyncAt: string | null = null;
  const stripeCustomerId = workspaceData.billing?.stripeCustomerId;

  if (stripeCustomerId) {
    try {
      // Fetch subscription from Stripe
      const subscription = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 1,
        status: 'all',
      });

      if (subscription.data.length > 0) {
        // Use subscription updated timestamp as last sync
        stripeLastSyncAt = new Date(subscription.data[0].created * 1000).toISOString();
      }
    } catch (error: any) {
      console.error('[Workspace Health] Failed to fetch Stripe subscription:', error.message);
      // Don't throw - sync check is optional
    }
  }

  // 8. Get Firestore last update timestamp
  const firestoreLastUpdateAt = workspaceData.updatedAt
    ? (workspaceData.updatedAt as Timestamp).toDate().toISOString()
    : new Date().toISOString();

  // 9. Calculate next billing action based on status
  const nextBillingAction = getNextBillingAction(workspaceData.status);

  // 10. Get email verification status from user
  const emailVerified = dashboardUser.emailVerified || false;

  // 11. Return health data
  return {
    workspace: {
      id: workspace.id,
      status: workspaceData.status,
      plan: workspaceData.plan,
      currentPeriodEnd: workspaceData.billing?.currentPeriodEnd
        ? (workspaceData.billing.currentPeriodEnd as Timestamp).toDate().toISOString()
        : null,
      nextBillingAction,
      usage: {
        players: playerCount,
        games: gamesCount,
        pendingVerifications,
      },
      sync: {
        stripeLastSyncAt,
        firestoreLastUpdateAt,
      },
      emailVerified,
    },
  };
}

/**
 * Count pending verifications across all players for a user
 *
 * @param userId - Firebase UID
 * @returns Count of unverified games
 */
async function countPendingVerifications(userId: string): Promise<number> {
  try {
    // Get all players for user
    const playersSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('players')
      .get();

    if (playersSnapshot.empty) {
      return 0;
    }

    // Count unverified games across all players
    let totalPendingVerifications = 0;

    for (const playerDoc of playersSnapshot.docs) {
      const unverifiedGamesSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('players')
        .doc(playerDoc.id)
        .collection('games')
        .where('verified', '==', false)
        .count()
        .get();

      totalPendingVerifications += unverifiedGamesSnapshot.data().count;
    }

    return totalPendingVerifications;
  } catch (error: any) {
    console.error('[Workspace Health] Failed to count pending verifications:', error.message);
    return 0; // Return 0 on error, don't throw
  }
}

/**
 * Determine next billing action based on workspace status
 *
 * @param status - Current workspace status
 * @returns Next action user should take
 */
function getNextBillingAction(
  status: WorkspaceStatus
): 'none' | 'update_payment' | 'reactivate' | 'contact_support' {
  switch (status) {
    case 'active':
    case 'trial':
      return 'none';

    case 'past_due':
      return 'update_payment';

    case 'canceled':
      return 'reactivate';

    case 'suspended':
    case 'deleted':
      return 'contact_support';

    default:
      return 'none';
  }
}
