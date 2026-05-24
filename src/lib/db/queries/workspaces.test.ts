/**
 * Unit tests for workspaces query module (in-memory SQLite).
 *
 * Particularly important: the schema stores flat columns
 * (billingStripeCustomerId, usageStorageUsedMB, etc.) but callers expect the
 * nested `workspace.billing.*` / `workspace.usage.*` shape. These tests pin
 * that translation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { users } from "@/lib/db/schema/auth";
import { workspaces } from "@/lib/db/schema/workspaces";

describe("workspaces query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let workspaceId: string;
  let qm: typeof import("./workspaces");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);

    userId = crypto.randomUUID();
    workspaceId = crypto.randomUUID();
    const now = new Date();
    await testDb.insert(users).values({
      id: userId,
      email: `u-${userId}@example.com`,
      name: "U",
      createdAt: now,
      updatedAt: now,
    });
    await testDb.insert(workspaces).values({
      id: workspaceId,
      ownerUserId: userId,
      name: "WS",
      plan: "starter",
      status: "active",
      billingStripeCustomerId: "cus_abc",
      billingStripeSubscriptionId: "sub_xyz",
      usagePlayerCount: 1,
      usageStorageUsedMB: 5,
      usageGamesThisMonth: 2,
      createdAt: now,
      updatedAt: now,
    });

    qm = await import("./workspaces");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("hydrates flat columns into nested billing/usage objects", async () => {
    const ws = await qm.getWorkspaceByIdAdmin(workspaceId);
    expect(ws).not.toBeNull();
    expect(ws!.billing.stripeCustomerId).toBe("cus_abc");
    expect(ws!.billing.stripeSubscriptionId).toBe("sub_xyz");
    expect(ws!.usage.playerCount).toBe(1);
    expect(ws!.usage.storageUsedMB).toBe(5);
    expect(ws!.usage.gamesThisMonth).toBe(2);
  });

  it("getByStripeCustomerId resolves by indirect lookup", async () => {
    const ws = await qm.getWorkspaceByStripeCustomerIdAdmin("cus_abc");
    expect(ws?.id).toBe(workspaceId);
  });

  it("increment helpers atomically add to the relevant usage counter", async () => {
    await qm.incrementWorkspacePlayerCountAdmin(workspaceId, 3);
    await qm.incrementWorkspaceGamesThisMonthAdmin(workspaceId, 2);
    await qm.updateWorkspaceStorageUsageAdmin(workspaceId, 10);

    const ws = await qm.getWorkspaceByIdAdmin(workspaceId);
    expect(ws!.usage.playerCount).toBe(4);
    expect(ws!.usage.gamesThisMonth).toBe(4);
    expect(ws!.usage.storageUsedMB).toBe(15);

    // Negative delta clamps at 0
    await qm.updateWorkspaceStorageUsageAdmin(workspaceId, -100);
    const ws2 = await qm.getWorkspaceByIdAdmin(workspaceId);
    expect(ws2!.usage.storageUsedMB).toBe(0);
  });

  it("updateBilling patches only specified fields", async () => {
    await qm.updateWorkspaceBillingAdmin(workspaceId, {
      stripeSubscriptionId: "sub_NEW",
    });
    const ws = await qm.getWorkspaceByIdAdmin(workspaceId);
    expect(ws!.billing.stripeSubscriptionId).toBe("sub_NEW");
    expect(ws!.billing.stripeCustomerId).toBe("cus_abc"); // unchanged
  });

  it("updateStatus changes status without disturbing other fields", async () => {
    await qm.updateWorkspaceStatusAdmin(workspaceId, "past_due");
    const ws = await qm.getWorkspaceByIdAdmin(workspaceId);
    expect(ws!.status).toBe("past_due");
    expect(ws!.plan).toBe("starter");
  });
});
