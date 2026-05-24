/**
 * Stripe Webhook idempotency tests.
 *
 * Asserts the webhook short-circuits duplicate Stripe deliveries via the
 * webhookEvent table without re-running plan enforcement logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";

let testDb: TestDB;
let closeDb: () => void;

const enforceMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe/plan-enforcement", () => ({
  enforceWorkspacePlan: enforceMock,
}));

const stripeMock = vi.hoisted(() => ({
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: { retrieve: vi.fn() },
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => stripeMock,
}));

const baseEvent = {
  id: "evt_test_1",
  type: "customer.subscription.updated",
  created: 1700000000,
  data: {
    object: {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      items: { data: [{ price: { id: "price_starter" } }] },
      current_period_end: 1700100000,
    },
  },
};

beforeEach(async () => {
  const { db, close } = makeTestDb();
  testDb = db;
  closeDb = close;
  mockDbModule(testDb);

  const now = new Date();
  await testDb.insert(authSchema.users).values({
    id: "u-webhook",
    email: "u@example.com",
    name: "U",
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });
  await testDb.insert(workspacesSchema.workspaces).values({
    id: "ws-webhook",
    ownerUserId: "u-webhook",
    name: "WS",
    plan: "starter",
    status: "active",
    billingStripeCustomerId: "cus_1",
    billingStripeSubscriptionId: "sub_1",
    createdAt: now,
    updatedAt: now,
  });

  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

afterEach(() => {
  closeDb();
  vi.resetModules();
});

function buildReq(body: string): NextRequest {
  return new NextRequest("https://example.com/api/billing/webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body,
  });
}

describe("POST /api/billing/webhook idempotency", () => {
  it("processes a fresh event and persists receipt", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue(baseEvent);
    enforceMock.mockResolvedValue({});

    const { POST } = await import("./route");
    const res = await POST(buildReq(JSON.stringify(baseEvent)));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(enforceMock).toHaveBeenCalledTimes(1);

    const { hasProcessedWebhookEvent } = await import(
      "@/lib/db/queries/stripe-billing"
    );
    expect(await hasProcessedWebhookEvent(baseEvent.id)).toBe(true);
  });

  it("short-circuits a duplicate delivery of the same event id", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue(baseEvent);
    enforceMock.mockResolvedValue({});

    const { POST } = await import("./route");

    // First delivery
    await POST(buildReq(JSON.stringify(baseEvent)));
    expect(enforceMock).toHaveBeenCalledTimes(1);

    // Duplicate delivery
    const res2 = await POST(buildReq(JSON.stringify(baseEvent)));
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(body2.duplicate).toBe(true);
    expect(enforceMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when stripe-signature is missing", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("https://example.com/api/billing/webhook", {
      method: "POST",
      body: JSON.stringify(baseEvent),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const { POST } = await import("./route");
    const res = await POST(buildReq("{}"));
    expect(res.status).toBe(400);
  });
});
