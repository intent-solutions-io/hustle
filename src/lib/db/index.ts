import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as authSchema from "./schema/auth";

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), "data/hustle.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema: { ...authSchema } });
export type DB = typeof db;

// Run migrations on first import. Idempotent — drizzle tracks applied
// migrations in the __drizzle_migrations table.
const migrationsFolder = path.resolve(process.cwd(), "drizzle");
if (fs.existsSync(migrationsFolder)) {
  try {
    migrate(db, { migrationsFolder });
  } catch (err) {
    console.error("[db] migration error:", err);
  }
}
