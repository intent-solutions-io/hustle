/**
 * POST /api/internal/trial-reminders tests
 *
 * Covers:
 *  - Missing Authorization header → 401
 *  - Wrong bearer token → 401
 *  - Bearer of different length than expected → 401 (timingSafeEqual guard)
 *  - Valid bearer + 0 expiring workspaces → 200 { sent: 0, failed: 0 }
 *  - Valid bearer + 2 expiring workspaces with owners → 200 { sent: 2 }
 *  - Owner missing → workspace skipped, not counted as failure
 *  - sendEmail returns success: false → counted as failed, not crash
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  listWorkspacesEndingTrialWithinWindow: vi.fn(),
  getUserByDefaultWorkspaceIdAdmin: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/db/queries/workspaces", () => ({
  listWorkspacesEndingTrialWithinWindow:
    mocks.listWorkspacesEndingTrialWithinWindow,
}));

vi.mock("@/lib/db/queries/users", () => ({
  getUserByDefaultWorkspaceIdAdmin: mocks.getUserByDefaultWorkspaceIdAdmin,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

import { POST } from "./route";
import { createMockRequest } from "@/test-utils";

const TOKEN = "test-token-with-known-length-32xx";

function makeReq(headers: Record<string, string> = {}) {
  return createMockRequest({
    method: "POST",
    url: "http://localhost/api/internal/trial-reminders",
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.HUSTLE_INTERNAL_TOKEN = TOKEN;
  process.env.NEXTAUTH_URL = "https://hustlestats.io";
});

afterEach(() => {
  delete process.env.HUSTLE_INTERNAL_TOKEN;
  delete process.env.NEXTAUTH_URL;
});

describe("POST /api/internal/trial-reminders — auth gate", () => {
  it("returns 401 when Authorization header missing", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
    expect(mocks.listWorkspacesEndingTrialWithinWindow).not.toHaveBeenCalled();
  });

  it("returns 401 when bearer token is wrong (same length)", async () => {
    const wrong = "wrong-token-with-known-length-32x";
    expect(wrong.length).toBe(TOKEN.length);
    const res = await POST(makeReq({ authorization: `Bearer ${wrong}` }));
    expect(res.status).toBe(401);
    expect(mocks.listWorkspacesEndingTrialWithinWindow).not.toHaveBeenCalled();
  });

  it("returns 401 when bearer token length differs (no timing leak)", async () => {
    const res = await POST(makeReq({ authorization: "Bearer short" }));
    expect(res.status).toBe(401);
    expect(mocks.listWorkspacesEndingTrialWithinWindow).not.toHaveBeenCalled();
  });

  it("returns 401 when scheme is not 'Bearer'", async () => {
    const res = await POST(makeReq({ authorization: `Token ${TOKEN}` }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when HUSTLE_INTERNAL_TOKEN env is unset", async () => {
    delete process.env.HUSTLE_INTERNAL_TOKEN;
    const res = await POST(makeReq({ authorization: `Bearer ${TOKEN}` }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/internal/trial-reminders — happy paths", () => {
  it("returns sent:0 when no workspaces are in the window", async () => {
    mocks.listWorkspacesEndingTrialWithinWindow.mockResolvedValue([]);

    const res = await POST(makeReq({ authorization: `Bearer ${TOKEN}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, sent: 0, failed: 0 });
    expect(mocks.listWorkspacesEndingTrialWithinWindow).toHaveBeenCalledWith(
      3,
      4
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("sends an email per workspace with an owner; returns sent:2", async () => {
    mocks.listWorkspacesEndingTrialWithinWindow.mockResolvedValue([
      { id: "ws-1" },
      { id: "ws-2" },
    ]);
    mocks.getUserByDefaultWorkspaceIdAdmin.mockImplementation(async (wsId) => ({
      id: `owner-of-${wsId}`,
      email: `${wsId}@example.com`,
      firstName: "Owner",
    }));
    mocks.sendEmail.mockResolvedValue({ success: true });

    const res = await POST(makeReq({ authorization: `Bearer ${TOKEN}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, sent: 2, failed: 0 });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);

    const [firstCall] = mocks.sendEmail.mock.calls;
    expect(firstCall[0].to).toBe("ws-1@example.com");
    expect(firstCall[0].subject).toContain("3 days");
    expect(firstCall[0].html).toContain("https://hustlestats.io/billing/plans");
  });

  it("skips workspaces with no owner; counts neither as sent nor failed", async () => {
    mocks.listWorkspacesEndingTrialWithinWindow.mockResolvedValue([
      { id: "ws-no-owner" },
      { id: "ws-good" },
    ]);
    mocks.getUserByDefaultWorkspaceIdAdmin.mockImplementation(async (wsId) =>
      wsId === "ws-good"
        ? { id: "u", email: "good@example.com", firstName: "Good" }
        : null
    );
    mocks.sendEmail.mockResolvedValue({ success: true });

    const res = await POST(makeReq({ authorization: `Bearer ${TOKEN}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, sent: 1, failed: 0 });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("counts sendEmail failures as failed without throwing", async () => {
    mocks.listWorkspacesEndingTrialWithinWindow.mockResolvedValue([
      { id: "ws-1" },
    ]);
    mocks.getUserByDefaultWorkspaceIdAdmin.mockResolvedValue({
      id: "u",
      email: "x@example.com",
      firstName: "X",
    });
    mocks.sendEmail.mockResolvedValue({ success: false, error: "send fail" });

    const res = await POST(makeReq({ authorization: `Bearer ${TOKEN}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, sent: 0, failed: 1 });
  });
});
