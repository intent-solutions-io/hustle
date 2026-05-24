/**
 * Workspaces Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/workspaces.ts.
 *
 * The legacy `Workspace` type has nested `billing` and `usage` objects, but
 * the schema flattens them into top-level columns (billingStripeCustomerId,
 * usageStorageUsedMB, etc.). Rehydrate on the way out so callers like
 * `workspace.usage.storageUsedMB` and `workspace.billing.stripeCustomerId`
 * keep working without per-call edits.
 *
 * Workspace members live in their own join table (`workspaceMember`).
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema/workspaces";
import type {
  Workspace,
  WorkspaceDocument,
  WorkspaceMember,
} from "@/types/firestore";

type WorkspaceRow = typeof workspaces.$inferSelect;
type MemberRow = typeof workspaceMembers.$inferSelect;

async function listMembers(workspaceId: string): Promise<MemberRow[]> {
  return db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}

function toWorkspaceMember(row: MemberRow): WorkspaceMember & { addedAt: Date } {
  return {
    userId: row.userId,
    email: row.email,
    role: row.role,
    addedAt: row.addedAt,
    addedBy: row.addedBy,
  } as unknown as WorkspaceMember & { addedAt: Date };
}

async function toWorkspace(row: WorkspaceRow): Promise<Workspace> {
  const members = await listMembers(row.id);
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    plan: row.plan,
    status: row.status,
    billing: {
      stripeCustomerId: row.billingStripeCustomerId ?? null,
      stripeSubscriptionId: row.billingStripeSubscriptionId ?? null,
      currentPeriodEnd: row.billingCurrentPeriodEnd ?? null,
    },
    usage: {
      playerCount: row.usagePlayerCount,
      gamesThisMonth: row.usageGamesThisMonth,
      storageUsedMB: row.usageStorageUsedMB,
    },
    members: members.map(toWorkspaceMember),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
  };
}

export async function getWorkspaceByIdAdmin(
  workspaceId: string
): Promise<Workspace | null> {
  const row = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  return row ? toWorkspace(row) : null;
}

export async function getWorkspaceByStripeCustomerIdAdmin(
  stripeCustomerId: string
): Promise<Workspace | null> {
  const row = await db.query.workspaces.findFirst({
    where: eq(workspaces.billingStripeCustomerId, stripeCustomerId),
  });
  return row ? toWorkspace(row) : null;
}

export async function updateWorkspaceBillingAdmin(
  workspaceId: string,
  billing: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  }
): Promise<void> {
  const patch: Partial<typeof workspaces.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (billing.stripeCustomerId !== undefined) {
    patch.billingStripeCustomerId = billing.stripeCustomerId;
  }
  if (billing.stripeSubscriptionId !== undefined) {
    patch.billingStripeSubscriptionId = billing.stripeSubscriptionId;
  }
  if (billing.currentPeriodEnd !== undefined) {
    patch.billingCurrentPeriodEnd = billing.currentPeriodEnd;
  }

  await db.update(workspaces).set(patch).where(eq(workspaces.id, workspaceId));
}

export async function updateWorkspaceStatusAdmin(
  workspaceId: string,
  status: WorkspaceDocument["status"]
): Promise<void> {
  await db
    .update(workspaces)
    .set({ status, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));
}

export async function incrementWorkspacePlayerCountAdmin(
  workspaceId: string,
  delta: number = 1
): Promise<void> {
  await db
    .update(workspaces)
    .set({
      usagePlayerCount: sql`${workspaces.usagePlayerCount} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));
}

export async function incrementWorkspaceGamesThisMonthAdmin(
  workspaceId: string,
  delta: number = 1
): Promise<void> {
  await db
    .update(workspaces)
    .set({
      usageGamesThisMonth: sql`${workspaces.usageGamesThisMonth} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));
}

export async function updateWorkspaceStorageUsageAdmin(
  workspaceId: string,
  deltaMB: number
): Promise<void> {
  await db
    .update(workspaces)
    .set({
      usageStorageUsedMB: sql`max(0, ${workspaces.usageStorageUsedMB} + ${deltaMB})`,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));
}

// Suppress unused import warnings for utilities reserved for future use.
void and;
