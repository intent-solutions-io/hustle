/**
 * Plan Enforcement Tests
 *
 * Uses the in-memory Drizzle harness for the workspace + ledger write side,
 * and stubs the Stripe price-id ↔ plan mapping module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";

let testDb: TestDB;
let closeDb: () => void;
const WORKSPACE_ID = "ws-enforce";
const USER_ID = "user-enforce";

vi.mock("@/lib/stripe/plan-mapping", () => ({
  getPlanForPriceId: vi.fn((priceId: string) => {
    if (priceId === "price_starter") return "starter";
    if (priceId === "price_plus") return "plus";
    throw new Error(`Unknown price ID: ${priceId}`);
  }),
  mapStripeStatusToWorkspaceStatus: vi.fn((status: string) => {
    if (status === "active") return "active";
    if (status === "trialing") return "trial";
    if (status === "past_due") return "past_due";
    if (status === "canceled") return "canceled";
    if (status === "unpaid") return "canceled";
    throw new Error(`Unknown Stripe status: ${status}`);
  }),
}));

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);

  const now = new Date();
  await testDb.insert(authSchema.users).values({
    id: USER_ID,
    email: "user@example.com",
    name: "User",
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });
  await testDb.insert(workspacesSchema.workspaces).values({
    id: WORKSPACE_ID,
    ownerUserId: USER_ID,
    name: "Test Workspace",
    plan: "starter",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
});

afterEach(() => {
  closeDb();
  vi.resetModules();
});

describe("enforceWorkspacePlan", () => {
  it("returns no-op when workspace already in sync", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    const res = await enforceWorkspacePlan(WORKSPACE_ID, {
      stripePriceId: "price_starter",
      stripeStatus: "active",
      source: "webhook",
      stripeEventId: "evt_noop",
    });
    expect(res.planChanged).toBe(false);
    expect(res.statusChanged).toBe(false);
    expect(res.planAfter).toBe("starter");
    expect(res.statusAfter).toBe("active");
  });

  it("updates the plan when Stripe price changes", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    const res = await enforceWorkspacePlan(WORKSPACE_ID, {
      stripePriceId: "price_plus",
      stripeStatus: "active",
      source: "webhook",
      stripeEventId: "evt_upgrade",
    });
    expect(res.planChanged).toBe(true);
    expect(res.planBefore).toBe("starter");
    expect(res.planAfter).toBe("plus");
  });

  it("updates status when Stripe status changes", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    const res = await enforceWorkspacePlan(WORKSPACE_ID, {
      stripePriceId: "price_starter",
      stripeStatus: "past_due",
      source: "webhook",
      stripeEventId: "evt_pastdue",
    });
    expect(res.statusChanged).toBe(true);
    expect(res.statusBefore).toBe("active");
    expect(res.statusAfter).toBe("past_due");
  });

  it("throws for unknown workspace", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    await expect(
      enforceWorkspacePlan("nonexistent", {
        stripePriceId: "price_starter",
        stripeStatus: "active",
        source: "webhook",
        stripeEventId: "x",
      })
    ).rejects.toThrow(/Workspace not found/);
  });

  it("throws for invalid source", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    await expect(
      enforceWorkspacePlan(WORKSPACE_ID, {
        stripePriceId: "price_starter",
        stripeStatus: "active",
        source: "bogus" as never,
        stripeEventId: "x",
      })
    ).rejects.toThrow(/Invalid source/);
  });

  it("throws for unknown Stripe price id", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    await expect(
      enforceWorkspacePlan(WORKSPACE_ID, {
        stripePriceId: "price_unknown",
        stripeStatus: "active",
        source: "webhook",
        stripeEventId: "x",
      })
    ).rejects.toThrow(/Failed to map Stripe price ID to plan/);
  });

  it("records a ledger entry on apply", async () => {
    const { enforceWorkspacePlan } = await import("./plan-enforcement");
    await enforceWorkspacePlan(WORKSPACE_ID, {
      stripePriceId: "price_plus",
      stripeStatus: "active",
      source: "webhook",
      stripeEventId: "evt_upgrade",
    });

    const { getBillingLedger } = await import("./ledger");
    const rows = await getBillingLedger(WORKSPACE_ID, 5);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].source).toBe("webhook");
    expect(rows[0].planAfter).toBe("plus");
  });
});

describe("isValidEnforcementSource", () => {
  it("accepts known sources", async () => {
    const { isValidEnforcementSource } = await import("./plan-enforcement");
    expect(isValidEnforcementSource("webhook")).toBe(true);
    expect(isValidEnforcementSource("replay")).toBe(true);
    expect(isValidEnforcementSource("auditor")).toBe(true);
    expect(isValidEnforcementSource("manual")).toBe(true);
    expect(isValidEnforcementSource("enforcement")).toBe(true);
  });

  it("rejects unknown sources", async () => {
    const { isValidEnforcementSource } = await import("./plan-enforcement");
    expect(isValidEnforcementSource("bogus")).toBe(false);
  });
});
