/**
 * Unit tests for practice-logs query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("practice-logs query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./practice-logs");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./practice-logs");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + stats: counts focus-area frequency", async () => {
    await qm.createPracticeLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      practiceType: "team_practice",
      durationMinutes: 90,
      focusAreas: ["passing", "shooting"],
      intensity: 4,
      enjoyment: 5,
    });
    await qm.createPracticeLogAdmin(userId, playerId, {
      date: new Date("2026-05-02").toISOString(),
      practiceType: "individual",
      durationMinutes: 60,
      focusAreas: ["shooting"],
      intensity: 3,
      enjoyment: 4,
    });

    const stats = await qm.getPracticeStatsAdmin(userId, playerId);
    expect(stats.totalPractices).toBe(2);
    expect(stats.totalDuration).toBe(150);
    expect(stats.focusAreaFrequency.shooting).toBe(2);
    expect(stats.focusAreaFrequency.passing).toBe(1);
    expect(stats.avgIntensity).toBe(3.5);
  });

  it("list filters by focusArea correctly", async () => {
    await qm.createPracticeLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      practiceType: "team_practice",
      durationMinutes: 90,
      focusAreas: ["passing"],
    });
    await qm.createPracticeLogAdmin(userId, playerId, {
      date: new Date("2026-05-02").toISOString(),
      practiceType: "individual",
      durationMinutes: 60,
      focusAreas: ["shooting"],
    });

    const passing = await qm.getPracticeLogsAdmin(userId, playerId, {
      focusArea: "passing",
    });
    expect(passing.logs).toHaveLength(1);
    expect(passing.logs[0].focusAreas).toEqual(["passing"]);
  });
});
