/**
 * Billing Portal Helpers Tests
 *
 * Uses the in-memory Drizzle harness for workspace state, with a stubbed
 * Stripe client so we only assert the workspace-lookup glue + DTO mapping.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";

let testDb: TestDB;
let closeDb: () => void;
const WORKSPACE_ID = "ws-portal";
const USER_ID = "user-portal";

const stripeMock = vi.hoisted(() => ({
  billingPortal: { sessions: { create: vi.fn() } },
  invoices: { list: vi.fn() },
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => stripeMock,
}));

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);
  vi.clearAllMocks();

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
    name: "Test WS",
    plan: "starter",
    status: "active",
    billingStripeCustomerId: "cus_test123",
    createdAt: now,
    updatedAt: now,
  });
});

afterEach(() => {
  closeDb();
  vi.resetModules();
});

describe("getOrCreateBillingPortalUrl", () => {
  it("returns the portal URL produced by Stripe", async () => {
    stripeMock.billingPortal.sessions.create.mockResolvedValue({
      url: "https://stripe.example.com/portal/abc",
    });
    const { getOrCreateBillingPortalUrl } = await import("./billing-portal");
    const url = await getOrCreateBillingPortalUrl(WORKSPACE_ID, "/dashboard/x");
    expect(url).toBe("https://stripe.example.com/portal/abc");
    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_test123",
      return_url: expect.stringContaining("/dashboard/x"),
    });
  });

  it("throws if workspace not found", async () => {
    const { getOrCreateBillingPortalUrl } = await import("./billing-portal");
    await expect(getOrCreateBillingPortalUrl("nope")).rejects.toThrow(
      /Failed to create billing portal session/
    );
  });

  it("throws if workspace has no Stripe customer ID", async () => {
    await testDb
      .update(workspacesSchema.workspaces)
      .set({ billingStripeCustomerId: null });
    const { getOrCreateBillingPortalUrl } = await import("./billing-portal");
    await expect(getOrCreateBillingPortalUrl(WORKSPACE_ID)).rejects.toThrow(
      /Failed to create billing portal session/
    );
  });
});

describe("listRecentInvoices", () => {
  it("maps Stripe invoices to DTOs", async () => {
    stripeMock.invoices.list.mockResolvedValue({
      data: [
        {
          id: "in_1",
          hosted_invoice_url: "https://stripe.example.com/inv/1",
          status: "paid",
          amount_paid: 1900,
          amount_due: 0,
          currency: "usd",
          created: 1700000000,
          period_start: 1699000000,
          period_end: 1700000000,
          lines: {
            data: [
              {
                price: { nickname: "Starter" },
                metadata: {},
                description: "Starter line",
              },
            ],
          },
        },
      ],
    });
    const { listRecentInvoices } = await import("./billing-portal");
    const result = await listRecentInvoices(WORKSPACE_ID, 5);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "in_1",
      status: "paid",
      amountPaid: 1900,
      planName: "Starter",
    });
  });

  it("returns empty array when workspace has no customer ID", async () => {
    await testDb
      .update(workspacesSchema.workspaces)
      .set({ billingStripeCustomerId: null });
    const { listRecentInvoices } = await import("./billing-portal");
    const result = await listRecentInvoices(WORKSPACE_ID);
    expect(result).toEqual([]);
    expect(stripeMock.invoices.list).not.toHaveBeenCalled();
  });
});
