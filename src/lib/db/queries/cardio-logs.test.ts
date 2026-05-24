/**
 * Unit tests for cardio-logs query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("cardio-logs query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./cardio-logs");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./cardio-logs");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create auto-computes pace; stats roll up correctly", async () => {
    const created = await qm.createCardioLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      activityType: "run",
      distanceMiles: 3,
      durationMinutes: 24,
    });
    expect(created.avgPacePerMile).toBe("8:00");

    await qm.createCardioLogAdmin(userId, playerId, {
      date: new Date("2026-05-02").toISOString(),
      activityType: "run",
      distanceMiles: 1,
      durationMinutes: 6,
    });

    const stats = await qm.getCardioStatsAdmin(userId, playerId);
    expect(stats.totalRuns).toBe(2);
    expect(stats.totalMiles).toBe(4);
    expect(stats.longestRun).toBe(3);
    expect(stats.fastestPace).toBe("6:00");
  });
});
