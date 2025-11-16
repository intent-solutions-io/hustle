/**
 * Workspace Service
 *
 * Firestore CRUD operations for workspaces (tenant/billing entities).
 * Each workspace represents a billable customer with players, games, and usage tracking.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config';
import type { Workspace, WorkspaceDocument, WorkspacePlan, WorkspaceStatus } from '@/types/firestore';

/**
 * Convert Firestore WorkspaceDocument to client-side Workspace
 */
function convertWorkspaceDocument(id: string, data: WorkspaceDocument): Workspace {
  return {
    id,
    ownerUserId: data.ownerUserId,
    name: data.name,
    plan: data.plan,
    status: data.status,
    billing: {
      stripeCustomerId: data.billing.stripeCustomerId,
      stripeSubscriptionId: data.billing.stripeSubscriptionId,
      currentPeriodEnd: data.billing.currentPeriodEnd
        ? (data.billing.currentPeriodEnd as Timestamp).toDate()
        : null,
    },
    usage: data.usage,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : null,
  };
}

/**
 * Create a new workspace for a user
 *
 * @param userId - Firebase UID of the workspace owner
 * @param plan - Initial subscription plan (default: 'free')
 * @param name - Workspace display name (optional, defaults to user's name)
 * @returns Created workspace
 */
export async function createWorkspaceForUser(
  userId: string,
  plan: WorkspacePlan = 'free',
  name?: string
): Promise<Workspace> {
  const workspaceRef = doc(collection(db, 'workspaces'));
  const workspaceId = workspaceRef.id;

  // Calculate trial end date (14 days from now)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  const workspaceData: WorkspaceDocument = {
    ownerUserId: userId,
    name: name || `Workspace ${workspaceId.slice(0, 8)}`,
    plan,
    status: plan === 'free' ? 'trial' : 'active',
    billing: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: plan === 'free' ? Timestamp.fromDate(trialEndDate) : null,
    },
    usage: {
      playerCount: 0,
      gamesThisMonth: 0,
      storageUsedMB: 0,
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    deletedAt: null,
  };

  await setDoc(workspaceRef, workspaceData);

  return {
    id: workspaceId,
    ...workspaceData,
    billing: {
      ...workspaceData.billing,
      currentPeriodEnd: workspaceData.billing.currentPeriodEnd
        ? workspaceData.billing.currentPeriodEnd.toDate()
        : null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

/**
 * Get workspace by ID
 *
 * @param workspaceId - Workspace document ID
 * @returns Workspace or null if not found
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    return null;
  }

  return convertWorkspaceDocument(workspaceSnap.id, workspaceSnap.data() as WorkspaceDocument);
}

/**
 * List all workspaces owned by a user
 *
 * @param userId - Firebase UID
 * @returns Array of workspaces
 */
export async function listWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const workspacesRef = collection(db, 'workspaces');
  const q = query(
    workspacesRef,
    where('ownerUserId', '==', userId),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    convertWorkspaceDocument(doc.id, doc.data() as WorkspaceDocument)
  );
}

/**
 * Update workspace plan tier
 *
 * @param workspaceId - Workspace document ID
 * @param plan - New plan tier
 */
export async function updateWorkspacePlan(
  workspaceId: string,
  plan: WorkspacePlan
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    plan,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update workspace status
 *
 * @param workspaceId - Workspace document ID
 * @param status - New lifecycle status
 */
export async function updateWorkspaceStatus(
  workspaceId: string,
  status: WorkspaceStatus
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update workspace billing information (from Stripe webhook)
 *
 * @param workspaceId - Workspace document ID
 * @param billing - Billing data from Stripe
 */
export async function updateWorkspaceBilling(
  workspaceId: string,
  billing: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  }
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  const updates: any = {
    updatedAt: serverTimestamp(),
  };

  if (billing.stripeCustomerId) {
    updates['billing.stripeCustomerId'] = billing.stripeCustomerId;
  }
  if (billing.stripeSubscriptionId) {
    updates['billing.stripeSubscriptionId'] = billing.stripeSubscriptionId;
  }
  if (billing.currentPeriodEnd) {
    updates['billing.currentPeriodEnd'] = Timestamp.fromDate(billing.currentPeriodEnd);
  }

  await updateDoc(workspaceRef, updates);
}

/**
 * Increment player count for workspace
 *
 * @param workspaceId - Workspace document ID
 */
export async function incrementPlayerCount(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    'usage.playerCount': increment(1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Decrement player count for workspace
 *
 * @param workspaceId - Workspace document ID
 */
export async function decrementPlayerCount(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    'usage.playerCount': increment(-1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Increment games this month counter
 *
 * @param workspaceId - Workspace document ID
 */
export async function incrementGamesThisMonth(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    'usage.gamesThisMonth': increment(1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reset monthly game count (called by scheduled Cloud Function)
 *
 * @param workspaceId - Workspace document ID
 */
export async function resetMonthlyGameCount(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    'usage.gamesThisMonth': 0,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deactivate workspace (soft delete)
 *
 * @param workspaceId - Workspace document ID
 */
export async function deactivateWorkspace(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    status: 'deleted',
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get workspace by Stripe customer ID
 *
 * @param stripeCustomerId - Stripe customer ID
 * @returns Workspace or null if not found
 */
export async function getWorkspaceByStripeCustomerId(
  stripeCustomerId: string
): Promise<Workspace | null> {
  const workspacesRef = collection(db, 'workspaces');
  const q = query(
    workspacesRef,
    where('billing.stripeCustomerId', '==', stripeCustomerId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return convertWorkspaceDocument(doc.id, doc.data() as WorkspaceDocument);
}

/**
 * Update workspace name
 *
 * @param workspaceId - Workspace document ID
 * @param name - New workspace name
 */
export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    name,
    updatedAt: serverTimestamp(),
  });
}
