import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type { PracticeType, PracticeFocusArea } from "@/types/firestore";

/**
 * Practice log table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/practiceLogs/{logId}
 *
 * Field names mirror PracticeLogDocument exactly. Arrays serialized as JSON.
 */
export const practiceLogs = sqliteTable("practiceLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  practiceType: text("practiceType").$type<PracticeType>().notNull(),

  durationMinutes: integer("durationMinutes").notNull(),

  focusAreas: text("focusAreas", { mode: "json" })
    .$type<PracticeFocusArea[]>()
    .notNull(),

  teamName: text("teamName"),
  location: text("location"),
  drillsCompleted: text("drillsCompleted", { mode: "json" }).$type<string[]>(),

  intensity: integer("intensity").$type<1 | 2 | 3 | 4 | 5>(),
  enjoyment: integer("enjoyment").$type<1 | 2 | 3 | 4 | 5>(),
  improvement: text("improvement"),

  notes: text("notes"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
