import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import type { CardioActivityType } from "@/types/firestore";

/**
 * Cardio log table — was Firestore subcollection
 * /users/{userId}/players/{playerId}/cardioLogs/{logId}
 *
 * Field names mirror CardioLogDocument exactly.
 */
export const cardioLogs = sqliteTable("cardioLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),

  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  activityType: text("activityType").$type<CardioActivityType>().notNull(),

  distanceMiles: real("distanceMiles").notNull(),
  durationMinutes: real("durationMinutes").notNull(),

  avgPacePerMile: text("avgPacePerMile"),
  calories: integer("calories"),

  avgHeartRate: integer("avgHeartRate"),
  maxHeartRate: integer("maxHeartRate"),

  location: text("location"),
  weather: text("weather"),
  notes: text("notes"),

  perceivedEffort: integer("perceivedEffort").$type<1 | 2 | 3 | 4 | 5>(),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
