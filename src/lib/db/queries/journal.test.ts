/**
 * Unit tests for journal query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("journal query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./journal");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./journal");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + get + recent + delete round trip", async () => {
    const created = await qm.createJournalEntryAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      content: "Felt good.",
      context: "daily_journal",
      moodTag: "good",
    });

    const fetched = await qm.getJournalEntryAdmin(userId, playerId, created.id);
    expect(fetched?.content).toBe("Felt good.");

    const recent = await qm.getRecentJournalEntriesAdmin(userId, playerId, 5);
    expect(recent).toHaveLength(1);

    await qm.deleteJournalEntryAdmin(userId, playerId, created.id);
    const gone = await qm.getJournalEntryAdmin(userId, playerId, created.id);
    expect(gone).toBeNull();
  });

  it("linked-workout filter returns only entries with that workoutId", async () => {
    await qm.createJournalEntryAdmin(userId, playerId, {
      date: new Date().toISOString(),
      content: "linked",
      context: "workout_reflection",
      linkedWorkoutId: "w-1",
    });
    await qm.createJournalEntryAdmin(userId, playerId, {
      date: new Date().toISOString(),
      content: "unlinked",
      context: "daily_journal",
    });

    const linked = await qm.getJournalEntriesByWorkoutAdmin(userId, playerId, "w-1");
    expect(linked).toHaveLength(1);
    expect(linked[0].content).toBe("linked");
  });
});
