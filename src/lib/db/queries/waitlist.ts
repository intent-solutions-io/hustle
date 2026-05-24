/**
 * Waitlist Query Module (Drizzle / SQLite)
 *
 * Replaces src/lib/firebase/admin-services/waitlist.ts.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema/waitlist";

/**
 * Public surface re-export so callers `import type { WaitlistDocument } from
 * "@/lib/db/queries/waitlist"` continue to compile after the Firebase service
 * deletion.
 */
export interface WaitlistDocument {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source?: string | null;
  createdAt: Date;
}

export async function isOnWaitlistAdmin(email: string): Promise<boolean> {
  const row = await db.query.waitlist.findFirst({
    where: eq(waitlist.email, email),
  });
  return Boolean(row);
}

export async function addToWaitlistAdmin(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}): Promise<void> {
  const now = new Date();
  await db
    .insert(waitlist)
    .values({
      email: data.email,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      source: data.source ?? "landing_page",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: waitlist.email,
      set: {
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        source: data.source ?? "landing_page",
        updatedAt: now,
      },
    });
}

export async function getWaitlistEntryAdmin(
  email: string
): Promise<WaitlistDocument | null> {
  const row = await db.query.waitlist.findFirst({
    where: eq(waitlist.email, email),
  });
  if (!row) return null;
  return {
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    source: row.source,
    createdAt: row.createdAt,
  };
}

void sql;
