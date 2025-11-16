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
  arrayUnion,
  arrayRemove,
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
    members: data.members.map((m) => ({
      ...m,
      addedAt: (m.addedAt as Timestamp).toDate(),
    })),
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
 * @param ownerEmail - Owner's email for members array
 * @returns Created workspace
 */
export async function createWorkspaceForUser(
  userId: string,
  plan: WorkspacePlan = 'free',
  name?: string,
  ownerEmail?: string
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
    members: ownerEmail
      ? [
          {
            userId,
            email: ownerEmail,
            role: 'owner',
            addedAt: serverTimestamp() as Timestamp,
            addedBy: userId,
          },
        ]
      : [],
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
    members: workspaceData.members.map((m) => ({
      ...m,
      addedAt: new Date(),
    })),
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

/**
 * Update workspace storage usage (Phase 6 Task 5: Storage & Uploads)
 *
 * @param workspaceId - Workspace document ID
 * @param deltaMB - Change in storage (positive for increase, negative for decrease)
 */
export async function updateWorkspaceStorageUsage(
  workspaceId: string,
  deltaMB: number
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    'usage.storageUsedMB': increment(deltaMB),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Alias for getWorkspaceById (convenience for storage service)
 */
export const getWorkspace = getWorkspaceById;

/**
 * Add member to workspace (Phase 6 Task 6: Collaborators)
 *
 * @param workspaceId - Workspace document ID
 * @param member - Member to add (userId, email, role)
 * @param addedBy - Firebase UID of user adding the member
 */
export async function addWorkspaceMember(
  workspaceId: string,
  member: {
    userId: string;
    email: string;
    role: 'admin' | 'member' | 'viewer'; // Cannot add another owner
  },
  addedBy: string
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    members: arrayUnion({
      userId: member.userId,
      email: member.email,
      role: member.role,
      addedAt: serverTimestamp(),
      addedBy,
    }),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove member from workspace (Phase 6 Task 6: Collaborators)
 *
 * @param workspaceId - Workspace document ID
 * @param userId - Firebase UID of member to remove
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  // First, get the workspace to find the member to remove
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Find member to remove
  const memberToRemove = workspace.members.find((m) => m.userId === userId);
  if (!memberToRemove) {
    throw new Error('Member not found in workspace');
  }

  // Cannot remove owner
  if (memberToRemove.role === 'owner') {
    throw new Error('Cannot remove workspace owner');
  }

  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    members: arrayRemove({
      userId: memberToRemove.userId,
      email: memberToRemove.email,
      role: memberToRemove.role,
      addedAt: Timestamp.fromDate(memberToRemove.addedAt),
      addedBy: memberToRemove.addedBy,
    }),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update member role (Phase 6 Task 6: Collaborators)
 *
 * @param workspaceId - Workspace document ID
 * @param userId - Firebase UID of member
 * @param newRole - New role to assign
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'viewer' // Cannot change to owner
): Promise<void> {
  // First, get the workspace to find the member
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Find member
  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) {
    throw new Error('Member not found in workspace');
  }

  // Cannot change owner role
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role');
  }

  // Remove old member and add with new role
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    members: arrayRemove({
      userId: member.userId,
      email: member.email,
      role: member.role,
      addedAt: Timestamp.fromDate(member.addedAt),
      addedBy: member.addedBy,
    }),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(workspaceRef, {
    members: arrayUnion({
      userId: member.userId,
      email: member.email,
      role: newRole,
      addedAt: Timestamp.fromDate(member.addedAt), // Keep original addedAt
      addedBy: member.addedBy,
    }),
    updatedAt: serverTimestamp(),
  });
}
