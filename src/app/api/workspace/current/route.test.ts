/**
 * Tests for GET /api/workspace/current
 *
 * In-memory SQLite harness; only authWithProfile is mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import * as authSchema from "@/lib/db/schema/auth";
import * as workspacesSchema from "@/lib/db/schema/workspaces";

const mocks = vi.hoisted(() => ({
  authWithProfile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authWithProfile: mocks.authWithProfile,
}));

let testDb: TestDB;
let closeDb: () => void;
const USER_ID = "user-current";
const WORKSPACE_ID = "ws-current";

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
    defaultWorkspaceId: WORKSPACE_ID,
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

describe("GET /api/workspace/current", () => {
  it("returns 401 when no session", async () => {
    mocks.authWithProfile.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user row missing", async () => {
    mocks.authWithProfile.mockResolvedValue({ uid: "no-such-user", emailVerified: true });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("USER_NOT_FOUND");
  });

  it("returns 404 when user has no default workspace", async () => {
    await testDb
      .update(authSchema.users)
      .set({ defaultWorkspaceId: null })
      .where(eq(authSchema.users.id, USER_ID));
    mocks.authWithProfile.mockResolvedValue({ uid: USER_ID, emailVerified: true });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("NO_WORKSPACE");
  });

  it("returns 404 when workspace not found", async () => {
    await testDb
      .delete(workspacesSchema.workspaces)
      .where(eq(workspacesSchema.workspaces.id, WORKSPACE_ID));
    mocks.authWithProfile.mockResolvedValue({ uid: USER_ID, emailVerified: true });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("WORKSPACE_NOT_FOUND");
  });

  it("returns workspace data on success without exposing stripe ids", async () => {
    mocks.authWithProfile.mockResolvedValue({ uid: USER_ID, emailVerified: true });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.workspace.id).toBe(WORKSPACE_ID);
    expect(body.workspace.name).toBe("Test Workspace");
    expect(body.workspace.plan).toBe("starter");
    expect(body.workspace.status).toBe("active");
    expect(body.workspace.billing).toEqual({ currentPeriodEnd: null });
    expect(body.workspace.usage).toEqual({
      playerCount: 0,
      gamesThisMonth: 0,
      storageUsedMB: 0,
    });
    expect(JSON.stringify(body)).not.toContain("stripeCustomerId");
    expect(JSON.stringify(body)).not.toContain("stripeSubscriptionId");
  });
});
