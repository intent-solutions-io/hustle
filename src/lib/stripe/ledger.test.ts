/**
 * Subscription Lifecycle Ledger Tests (Drizzle-backed)
 *
 * Hits a real in-memory SQLite via the test-utils db harness — no Stripe
 * mocks needed because the ledger is local-only.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";

let testDb: TestDB;
let closeDb: () => void;
const FIXED_WORKSPACE_ID = "ws-ledger-test";
const FIXED_USER_ID = "user-ledger-test";

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);

  const now = new Date();
  await testDb.insert(authSchema.users).values({
    id: FIXED_USER_ID,
    email: "owner@example.com",
    name: "Owner",
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });
  await testDb.insert(workspacesSchema.workspaces).values({
    id: FIXED_WORKSPACE_ID,
    ownerUserId: FIXED_USER_ID,
    name: "Test WS",
    createdAt: now,
    updatedAt: now,
  });
});

afterEach(() => {
  closeDb();
  vi.resetModules();
});

describe("Ledger", () => {
  it("records a billing event and returns an id", async () => {
    const { recordBillingEvent, getBillingLedger } = await import("./ledger");
    const id = await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "subscription_updated",
      stripeEventId: "evt_1",
      statusBefore: "active",
      statusAfter: "past_due",
      planBefore: "starter",
      planAfter: "starter",
      source: "webhook",
      note: "Payment failed",
    });
    expect(id).toMatch(/.+/);

    const rows = await getBillingLedger(FIXED_WORKSPACE_ID, 10);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("subscription_updated");
    expect(rows[0].source).toBe("webhook");
    expect(rows[0].note).toBe("Payment failed");
    expect(rows[0].timestamp).toBeInstanceOf(Date);
  });

  it("returns ledger entries newest first", async () => {
    const { recordBillingEvent, getBillingLedger } = await import("./ledger");
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "plan_changed",
      source: "webhook",
    });
    // Ensure clock advances enough for the integer timestamp to differ.
    await new Promise((r) => setTimeout(r, 10));
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "drift_detected",
      source: "auditor",
    });

    const rows = await getBillingLedger(FIXED_WORKSPACE_ID, 10);
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe("drift_detected");
    expect(rows[1].type).toBe("plan_changed");
  });

  it("filters by source", async () => {
    const { recordBillingEvent, getBillingLedgerBySource } = await import("./ledger");
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "plan_changed",
      source: "webhook",
    });
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "plan_changed",
      source: "replay",
    });

    const webhookRows = await getBillingLedgerBySource(FIXED_WORKSPACE_ID, "webhook");
    expect(webhookRows).toHaveLength(1);
    expect(webhookRows[0].source).toBe("webhook");
  });

  it("filters by type", async () => {
    const { recordBillingEvent, getBillingLedgerByType } = await import("./ledger");
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "plan_changed",
      source: "webhook",
    });
    await recordBillingEvent(FIXED_WORKSPACE_ID, {
      type: "drift_detected",
      source: "auditor",
    });

    const driftRows = await getBillingLedgerByType(FIXED_WORKSPACE_ID, "drift_detected");
    expect(driftRows).toHaveLength(1);
    expect(driftRows[0].type).toBe("drift_detected");
  });

  it("rejects invalid source enum", async () => {
    const { recordBillingEvent } = await import("./ledger");
    await expect(
      recordBillingEvent(FIXED_WORKSPACE_ID, {
        type: "plan_changed",
        source: "bogus" as never,
      })
    ).rejects.toThrow(/Invalid event.source/);
  });

  it("rejects empty workspace id", async () => {
    const { recordBillingEvent } = await import("./ledger");
    await expect(
      recordBillingEvent("", { type: "plan_changed", source: "webhook" })
    ).rejects.toThrow(/Invalid workspaceId/);
  });
});
