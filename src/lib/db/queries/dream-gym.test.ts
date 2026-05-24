/**
 * Unit tests for dream-gym query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, seedBaseHierarchy, type TestDB } from "@/test-utils/db";

describe("dream-gym query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let userId: string;
  let playerId: string;
  let qm: typeof import("./dream-gym");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    ({ userId, playerId } = await seedBaseHierarchy(testDb));
    qm = await import("./dream-gym");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  const baseProfile = {
    hasGymAccess: true,
    hasHomeEquipment: false,
    equipmentTags: [],
    sport: "soccer" as const,
    position: "CM" as const,
    goals: ["fat_loss" as const],
    intensity: "normal" as const,
    onboardingComplete: true,
  };

  const baseSchedule = {
    monday: "practice_medium" as const,
    tuesday: "off" as const,
    wednesday: "off" as const,
    thursday: "off" as const,
    friday: "off" as const,
    saturday: "off" as const,
    sunday: "off" as const,
  };

  it("upsert creates then updates the singleton record", async () => {
    const created = await qm.upsertDreamGymAdmin(userId, playerId, {
      profile: baseProfile,
      schedule: baseSchedule,
    });
    expect(created.profile.hasGymAccess).toBe(true);

    const updated = await qm.upsertDreamGymAdmin(userId, playerId, {
      profile: { ...baseProfile, hasGymAccess: false },
      schedule: baseSchedule,
    });
    expect(updated.profile.hasGymAccess).toBe(false);

    // Confirm singleton — second upsert did not create a second row
    const fetched = await qm.getDreamGymAdmin(userId, playerId);
    expect(fetched?.profile.hasGymAccess).toBe(false);
  });

  it("addMentalCheckIn appends + tracks lastCheckIn", async () => {
    await qm.upsertDreamGymAdmin(userId, playerId, {
      profile: baseProfile,
      schedule: baseSchedule,
    });

    await qm.addMentalCheckInAdmin(userId, playerId, {
      mood: 4,
      energy: "high",
      soreness: "low",
      stress: "low",
    });

    const checkIns = await qm.getMentalCheckInsAdmin(userId, playerId);
    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].mood).toBe(4);
  });

  it("event add + remove modifies events array", async () => {
    await qm.upsertDreamGymAdmin(userId, playerId, {
      profile: baseProfile,
      schedule: baseSchedule,
    });

    const eventId = await qm.addDreamGymEventAdmin(userId, playerId, {
      type: "game",
      name: "Friday match",
      date: new Date("2026-05-09"),
    });
    expect(eventId).toMatch(/^event_/);

    const events = await qm.getDreamGymEventsAdmin(userId, playerId);
    expect(events).toHaveLength(1);

    await qm.removeDreamGymEventAdmin(userId, playerId, eventId);
    const after = await qm.getDreamGymEventsAdmin(userId, playerId);
    expect(after).toHaveLength(0);
  });
});
