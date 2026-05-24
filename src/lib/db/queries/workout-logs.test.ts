/**
 * Unit tests for workout-logs query module (in-memory SQLite).
 *
 * These run under vitest unit-test mode (`pnpm test:unit`) — no emulator
 * dependency. The module-under-test is dynamically imported AFTER the in-memory
 * db is mocked so it picks up the throwaway handle instead of the project's
 * persistent SQLite file.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("workout-logs query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./workout-logs");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./workout-logs");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create then get returns the inserted log", async () => {
    const created = await qm.createWorkoutLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      type: "strength",
      title: "Push day",
      duration: 45,
      exercises: [
        {
          exerciseId: "bench",
          exerciseName: "Bench press",
          targetSets: 3,
          targetReps: "8-12",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, completed: true },
            { setNumber: 2, reps: 10, weight: 135, completed: true },
            { setNumber: 3, reps: 8, weight: 145, completed: true },
          ],
        },
      ],
    });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe("Push day");

    const fetched = await qm.getWorkoutLogAdmin(userId, playerId, created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.duration).toBe(45);
  });

  it("list returns most-recent-first with pagination cursor", async () => {
    for (let i = 0; i < 5; i++) {
      await qm.createWorkoutLogAdmin(userId, playerId, {
        date: new Date(`2026-05-0${i + 1}`).toISOString(),
        type: "strength",
        title: `Day ${i + 1}`,
        duration: 30,
        exercises: [],
      });
    }

    const page1 = await qm.getWorkoutLogsAdmin(userId, playerId, { limit: 2 });
    expect(page1.logs).toHaveLength(2);
    expect(page1.logs[0].title).toBe("Day 5");
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await qm.getWorkoutLogsAdmin(userId, playerId, {
      limit: 2,
      cursor: page1.nextCursor!,
    });
    expect(page2.logs).toHaveLength(2);
    expect(page2.logs[0].title).toBe("Day 3");
  });

  it("update modifies fields and recalculates totalVolume", async () => {
    const log = await qm.createWorkoutLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      type: "strength",
      title: "Original",
      duration: 30,
      exercises: [],
    });

    const updated = await qm.updateWorkoutLogAdmin(userId, playerId, log.id, {
      title: "Updated",
      duration: 60,
      exercises: [
        {
          exerciseId: "squat",
          exerciseName: "Back squat",
          targetSets: 3,
          targetReps: "5",
          sets: [{ setNumber: 1, reps: 5, weight: 200, completed: true }],
        },
      ],
    });

    expect(updated.title).toBe("Updated");
    expect(updated.duration).toBe(60);
    expect(updated.totalVolume).toBe(1000); // 1 set * 5 reps * 200 weight
  });

  it("delete removes the record", async () => {
    const log = await qm.createWorkoutLogAdmin(userId, playerId, {
      date: new Date().toISOString(),
      type: "strength",
      title: "To delete",
      duration: 30,
      exercises: [],
    });

    await qm.deleteWorkoutLogAdmin(userId, playerId, log.id);

    const refetched = await qm.getWorkoutLogAdmin(userId, playerId, log.id);
    expect(refetched).toBeNull();
  });

  it("stats aggregates duration + counts by type", async () => {
    await qm.createWorkoutLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      type: "strength",
      title: "A",
      duration: 60,
      exercises: [],
    });
    await qm.createWorkoutLogAdmin(userId, playerId, {
      date: new Date("2026-05-02").toISOString(),
      type: "conditioning",
      title: "B",
      duration: 30,
      exercises: [],
    });

    const stats = await qm.getWorkoutStatsAdmin(userId, playerId);
    expect(stats.totalWorkouts).toBe(2);
    expect(stats.totalDuration).toBe(90);
    expect(stats.workoutsByType.strength).toBe(1);
    expect(stats.workoutsByType.conditioning).toBe(1);
    expect(stats.averageDuration).toBe(45);
  });
});
