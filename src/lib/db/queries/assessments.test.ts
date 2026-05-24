/**
 * Unit tests for assessments query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("assessments query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./assessments");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./assessments");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + get + update + delete round trip", async () => {
    const created = await qm.createAssessmentAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      testType: "vertical_jump",
      value: 24,
      unit: "inches",
    });
    expect(created.value).toBe(24);

    const fetched = await qm.getAssessmentAdmin(userId, playerId, created.id);
    expect(fetched?.testType).toBe("vertical_jump");

    const updated = await qm.updateAssessmentAdmin(userId, playerId, created.id, {
      value: 26,
    });
    expect(updated.value).toBe(26);

    await qm.deleteAssessmentAdmin(userId, playerId, created.id);
    const gone = await qm.getAssessmentAdmin(userId, playerId, created.id);
    expect(gone).toBeNull();
  });

  it("getLatestAssessmentsByType returns most-recent per test type", async () => {
    await qm.createAssessmentAdmin(userId, playerId, {
      date: new Date("2026-04-01").toISOString(),
      testType: "vertical_jump",
      value: 20,
      unit: "inches",
    });
    await qm.createAssessmentAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      testType: "vertical_jump",
      value: 24,
      unit: "inches",
    });
    await qm.createAssessmentAdmin(userId, playerId, {
      date: new Date("2026-05-15").toISOString(),
      testType: "plank_hold",
      value: 60,
      unit: "seconds",
    });

    const latest = await qm.getLatestAssessmentsByTypeAdmin(userId, playerId);
    expect(latest.vertical_jump?.value).toBe(24);
    expect(latest.plank_hold?.value).toBe(60);
    expect(latest["40_yard_dash"]).toBeNull();
  });
});
