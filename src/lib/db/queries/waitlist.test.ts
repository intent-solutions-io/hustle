/**
 * Unit tests for waitlist query module (in-memory SQLite).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { makeTestDb, mockDbModule, type TestDB } from "@/test-utils/db";

describe("waitlist query module", () => {
  let testDb: TestDB;
  let close: () => void;
  let qm: typeof import("./waitlist");

  beforeEach(async () => {
    vi.resetModules();
    const made = makeTestDb();
    testDb = made.db;
    close = made.close;
    mockDbModule(testDb);
    qm = await import("./waitlist");
  });

  afterEach(() => {
    close();
    vi.doUnmock("@/lib/db");
  });

  it("isOn returns false for unknown email", async () => {
    expect(await qm.isOnWaitlistAdmin("nobody@example.com")).toBe(false);
  });

  it("add then isOn returns true", async () => {
    await qm.addToWaitlistAdmin({ email: "a@example.com", firstName: "A" });
    expect(await qm.isOnWaitlistAdmin("a@example.com")).toBe(true);

    const fetched = await qm.getWaitlistEntryAdmin("a@example.com");
    expect(fetched?.firstName).toBe("A");
    expect(fetched?.source).toBe("landing_page");
  });

  it("re-adding the same email is idempotent (upsert)", async () => {
    await qm.addToWaitlistAdmin({ email: "b@example.com", source: "first" });
    await qm.addToWaitlistAdmin({ email: "b@example.com", source: "second" });

    const fetched = await qm.getWaitlistEntryAdmin("b@example.com");
    expect(fetched?.source).toBe("second");
  });
});
