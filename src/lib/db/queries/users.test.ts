/**
 * Unit tests for users query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { users } from "@/lib/db/schema/auth";
import { workspaces } from "@/lib/db/schema/workspaces";

describe("users query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let qm: typeof import("./users");
  let userId: string;

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);

    userId = crypto.randomUUID();
    const now = new Date();
    await testDb.insert(users).values({
      id: userId,
      email: `u-${userId}@example.com`,
      name: "First Last",
      firstName: "First",
      lastName: "Last",
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    });

    qm = await import("./users");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("getUserProfile returns User shape with derived ownedWorkspaces", async () => {
    const user = await qm.getUserProfileAdmin(userId);
    expect(user).not.toBeNull();
    expect(user!.id).toBe(userId);
    expect(user!.firstName).toBe("First");
    expect(user!.lastName).toBe("Last");
    expect(user!.emailVerified).toBe(true);
    expect(user!.ownedWorkspaces).toEqual([]);
  });

  it("ownedWorkspaces reflects workspaces owned by the user", async () => {
    const wsId = crypto.randomUUID();
    const now = new Date();
    await testDb.insert(workspaces).values({
      id: wsId,
      ownerUserId: userId,
      name: "Mine",
      createdAt: now,
      updatedAt: now,
    });

    const user = await qm.getUserProfileAdmin(userId);
    expect(user!.ownedWorkspaces).toEqual([wsId]);
  });

  it("updateUserProfile patches specified fields only", async () => {
    const updated = await qm.updateUserProfileAdmin(userId, {
      firstName: "NewFirst",
      phone: "+1-555-0000",
    });
    expect(updated.firstName).toBe("NewFirst");
    expect(updated.lastName).toBe("Last");
    expect(updated.phone).toBe("+1-555-0000");
  });

  it("returns null for unknown user id", async () => {
    const user = await qm.getUserProfileAdmin(crypto.randomUUID());
    expect(user).toBeNull();
  });
});
