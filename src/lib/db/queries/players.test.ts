/**
 * Unit tests for players query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";
import { users } from "@/lib/db/schema/auth";
import { workspaces } from "@/lib/db/schema/workspaces";

describe("players query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let workspaceId: string;
  let qm: typeof import("./players");

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
      createdAt: now,
      updatedAt: now,
    });

    qm = await import("./players");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + list + count + get", async () => {
    const created = await qm.createPlayerAdmin(userId, {
      workspaceId,
      name: "Alice",
      birthday: new Date("2014-01-01"),
      gender: "female",
      primaryPosition: "ST",
      leagueCode: "REC",
      teamClub: "Test FC",
    });
    expect(created.name).toBe("Alice");
    expect(created.position).toBe("ST"); // legacy mirror of primaryPosition

    const list = await qm.getPlayersAdmin(userId);
    expect(list).toHaveLength(1);

    const count = await qm.getPlayersCountAdmin(userId);
    expect(count).toBe(1);

    const fetched = await qm.getPlayerAdmin(userId, created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it("update mutates fields without touching unspecified ones", async () => {
    const created = await qm.createPlayerAdmin(userId, {
      workspaceId,
      name: "Alice",
      birthday: new Date("2014-01-01"),
      gender: "female",
      primaryPosition: "ST",
      leagueCode: "REC",
      teamClub: "Test FC",
    });

    await qm.updatePlayerAdmin(userId, created.id, { teamClub: "New FC" });

    const after = await qm.getPlayerAdmin(userId, created.id);
    expect(after?.teamClub).toBe("New FC");
    expect(after?.name).toBe("Alice");
  });

  it("delete removes the player", async () => {
    const created = await qm.createPlayerAdmin(userId, {
      workspaceId,
      name: "Bye",
      birthday: new Date("2014-01-01"),
      gender: "female",
      primaryPosition: "ST",
      leagueCode: "REC",
      teamClub: "X",
    });
    await qm.deletePlayerAdmin(userId, created.id);
    const after = await qm.getPlayerAdmin(userId, created.id);
    expect(after).toBeNull();
  });

  it("isolates by userId — a second user cannot see the first user's players", async () => {
    const otherUserId = crypto.randomUUID();
    const now = new Date();
    await testDb.insert(users).values({
      id: otherUserId,
      email: `o-${otherUserId}@example.com`,
      name: "O",
      createdAt: now,
      updatedAt: now,
    });

    await qm.createPlayerAdmin(userId, {
      workspaceId,
      name: "Mine",
      birthday: new Date("2014-01-01"),
      gender: "female",
      primaryPosition: "ST",
      leagueCode: "REC",
      teamClub: "X",
    });

    const othersList = await qm.getPlayersAdmin(otherUserId);
    expect(othersList).toHaveLength(0);
  });
});
