/**
 * Unit tests for biometrics query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("biometrics query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./biometrics");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./biometrics");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + get returns the inserted log", async () => {
    const created = await qm.createBiometricsLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      restingHeartRate: 55,
      sleepHours: 7.5,
      source: "manual",
    });

    expect(created.restingHeartRate).toBe(55);
    expect(created.sleepHours).toBe(7.5);

    const fetched = await qm.getBiometricsLogAdmin(userId, playerId, created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it("trends computes averages rounded to expected precision", async () => {
    for (const [day, rhr] of [[1, 50], [2, 60], [3, 70]] as const) {
      await qm.createBiometricsLogAdmin(userId, playerId, {
        date: new Date(`2026-05-0${day}`).toISOString(),
        restingHeartRate: rhr,
        sleepHours: 8.0,
        source: "manual",
      });
    }

    const trends = await qm.getBiometricsTrendsAdmin(userId, playerId);
    expect(trends.dataPoints).toBe(3);
    expect(trends.avgRestingHeartRate).toBe(60);
    expect(trends.avgSleepHours).toBe(8);
  });

  it("getByDate finds the right day's log", async () => {
    await qm.createBiometricsLogAdmin(userId, playerId, {
      date: new Date("2026-05-01T12:30:00").toISOString(),
      restingHeartRate: 55,
      source: "manual",
    });

    const found = await qm.getBiometricsLogByDateAdmin(
      userId,
      playerId,
      new Date("2026-05-01T08:00:00")
    );
    expect(found?.restingHeartRate).toBe(55);

    const notFound = await qm.getBiometricsLogByDateAdmin(
      userId,
      playerId,
      new Date("2026-06-01")
    );
    expect(notFound).toBeNull();
  });
});
