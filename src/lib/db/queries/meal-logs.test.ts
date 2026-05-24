/**
 * Unit tests for meal-logs query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("meal-logs query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./meal-logs");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./meal-logs");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("create + list + delete", async () => {
    const created = await qm.createMealLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      mealType: "breakfast",
      description: "Oatmeal + berries",
      calories: 350,
    });

    const list = await qm.getMealLogsAdmin(userId, playerId);
    expect(list.logs).toHaveLength(1);
    expect(list.logs[0].description).toBe("Oatmeal + berries");

    await qm.deleteMealLogAdmin(userId, playerId, created.id);
    const after = await qm.getMealLogsAdmin(userId, playerId);
    expect(after.logs).toHaveLength(0);
  });

  it("filters by mealType", async () => {
    await qm.createMealLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      mealType: "breakfast",
      description: "B",
    });
    await qm.createMealLogAdmin(userId, playerId, {
      date: new Date("2026-05-01").toISOString(),
      mealType: "dinner",
      description: "D",
    });

    const dinners = await qm.getMealLogsAdmin(userId, playerId, { mealType: "dinner" });
    expect(dinners.logs).toHaveLength(1);
    expect(dinners.logs[0].mealType).toBe("dinner");
  });
});
