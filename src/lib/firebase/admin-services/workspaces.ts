/**
 * Firebase Admin SDK - Workspaces Service (Server-Side)
 *
 * Server-side Firestore operations for workspace documents.
 * Used in Next.js server components and API routes.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../admin';
import type { Workspace, WorkspaceDocument } from '@/types/firestore';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return new Date(String(value));
}

function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null;
  return toDate(value);
}

function toWorkspace(id: string, data: WorkspaceDocument): Workspace {
  const raw = data as any;
  return {
    id,
    ...raw,
    billing: {
      stripeCustomerId: raw.billing?.stripeCustomerId ?? null,
      stripeSubscriptionId: raw.billing?.stripeSubscriptionId ?? null,
      currentPeriodEnd: toDateOrNull(raw.billing?.currentPeriodEnd ?? null),
    },
    members: Array.isArray(raw.members)
      ? raw.members.map((m: any) => ({
          ...m,
          addedAt: toDate(m.addedAt),
        }))
      : [],
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
    deletedAt: toDateOrNull(raw.deletedAt ?? null),
  };
}

export async function getWorkspaceByIdAdmin(workspaceId: string): Promise<Workspace | null> {
  const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
  const snap = await workspaceRef.get();
  if (!snap.exists) return null;
  return toWorkspace(snap.id, snap.data() as WorkspaceDocument);
}

export async function getWorkspaceByStripeCustomerIdAdmin(
  stripeCustomerId: string
): Promise<Workspace | null> {
  const snap = await adminDb
    .collection('workspaces')
    .where('billing.stripeCustomerId', '==', stripeCustomerId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toWorkspace(doc.id, doc.data() as WorkspaceDocument);
}

export async function updateWorkspaceBillingAdmin(
  workspaceId: string,
  billing: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (billing.stripeCustomerId !== undefined) {
    updates['billing.stripeCustomerId'] = billing.stripeCustomerId;
  }
  if (billing.stripeSubscriptionId !== undefined) {
    updates['billing.stripeSubscriptionId'] = billing.stripeSubscriptionId;
  }
  if (billing.currentPeriodEnd !== undefined) {
    updates['billing.currentPeriodEnd'] = billing.currentPeriodEnd;
  }

  await adminDb.collection('workspaces').doc(workspaceId).update(updates);
}

export async function updateWorkspaceStatusAdmin(
  workspaceId: string,
  status: WorkspaceDocument['status']
): Promise<void> {
  await adminDb.collection('workspaces').doc(workspaceId).update({
    status,
    updatedAt: new Date(),
  });
}

export async function incrementWorkspacePlayerCountAdmin(
  workspaceId: string,
  delta: number = 1
): Promise<void> {
  const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
  await workspaceRef.update({
    'usage.playerCount': FieldValue.increment(delta),
    updatedAt: new Date(),
  });
}

export async function incrementWorkspaceGamesThisMonthAdmin(
  workspaceId: string,
  delta: number = 1
): Promise<void> {
  const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
  await workspaceRef.update({
    'usage.gamesThisMonth': FieldValue.increment(delta),
    updatedAt: new Date(),
  });
}

export async function updateWorkspaceStorageUsageAdmin(
  workspaceId: string,
  deltaMB: number
): Promise<void> {
  const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
  await workspaceRef.update({
    'usage.storageUsedMB': FieldValue.increment(deltaMB),
    updatedAt: new Date(),
  });
}
