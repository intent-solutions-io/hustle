/**
 * Unit tests for the local FS storage layer.
 *
 * Uses a per-test tmp dir as STORAGE_ROOT so we never touch /data/uploads.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  uploadPlayerPhotoLocal,
  uploadUserPhotoLocal,
  deletePhotoLocal,
  extractLocalPath,
  resolveServePath,
  getStorageRoot,
} from "./local";

function makeFile(name: string, body: string, type = "image/png"): File {
  return new File([new TextEncoder().encode(body)], name, { type });
}

describe("local storage layer", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hustle-storage-test-"));
    process.env.STORAGE_ROOT = tmpRoot;
  });

  afterEach(async () => {
    delete process.env.STORAGE_ROOT;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("getStorageRoot reflects env override", () => {
    expect(getStorageRoot()).toBe(tmpRoot);
  });

  it("uploadPlayerPhotoLocal lands the file under {userId}/players/{playerId}/", async () => {
    const result = await uploadPlayerPhotoLocal({
      file: makeFile("avatar.png", "x".repeat(1024)),
      userId: "user-1",
      playerId: "player-2",
    });

    expect(result.url).toMatch(
      /^\/api\/storage\/serve\/user-1\/players\/player-2\/[a-f0-9-]+\.png$/
    );
    expect(result.path).toMatch(/^user-1\/players\/player-2\/[a-f0-9-]+\.png$/);
    expect(result.size).toBeGreaterThan(0);

    const onDisk = await fs.readFile(path.join(tmpRoot, result.path));
    expect(onDisk.length).toBe(1024);
  });

  it("uploadUserPhotoLocal lands the file under {userId}/profile/", async () => {
    const result = await uploadUserPhotoLocal({
      file: makeFile("me.jpg", "y".repeat(512), "image/jpeg"),
      userId: "user-1",
    });
    expect(result.url).toMatch(
      /^\/api\/storage\/serve\/user-1\/profile\/[a-f0-9-]+\.jpg$/
    );
  });

  it("deletePhotoLocal removes the file and returns size freed", async () => {
    const result = await uploadPlayerPhotoLocal({
      file: makeFile("delete-me.png", "z".repeat(2048)),
      userId: "u",
      playerId: "p",
    });

    const sizeFreed = await deletePhotoLocal(result.path);
    expect(sizeFreed).toBeGreaterThan(0);

    await expect(fs.stat(path.join(tmpRoot, result.path))).rejects.toThrow();
  });

  it("deletePhotoLocal returns 0 for missing file (no throw)", async () => {
    const sizeFreed = await deletePhotoLocal("missing/path.png");
    expect(sizeFreed).toBe(0);
  });

  describe("extractLocalPath", () => {
    it("extracts the storage path from a serve URL", () => {
      expect(extractLocalPath("/api/storage/serve/u-1/players/p-2/abc.png")).toBe(
        "u-1/players/p-2/abc.png"
      );
    });

    it("returns null for legacy Firebase Storage URLs", () => {
      expect(
        extractLocalPath(
          "https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media&token=t"
        )
      ).toBeNull();
    });

    it("returns null for other arbitrary URLs", () => {
      expect(extractLocalPath("https://example.com/img.png")).toBeNull();
    });

    it("passes through already-relative storage paths", () => {
      expect(extractLocalPath("user-1/profile/abc.png")).toBe(
        "user-1/profile/abc.png"
      );
    });
  });

  describe("resolveServePath", () => {
    it("returns null when path contains ..", async () => {
      expect(await resolveServePath("../etc/passwd")).toBeNull();
    });

    it("returns null when file does not exist", async () => {
      expect(await resolveServePath("u/doesnotexist.png")).toBeNull();
    });

    it("returns absolute + size for a real file", async () => {
      const r = await uploadPlayerPhotoLocal({
        file: makeFile("serve.png", "abc"),
        userId: "u",
        playerId: "p",
      });

      const resolved = await resolveServePath(r.path);
      expect(resolved).not.toBeNull();
      expect(resolved!.size).toBe(3);
      expect(resolved!.absolute).toBe(path.join(tmpRoot, r.path));
    });
  });
});
