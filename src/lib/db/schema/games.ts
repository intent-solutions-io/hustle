import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { players } from "./players";
import { workspaces } from "./workspaces";
import type { LeagueCode } from "@/types/league";
import type { PerformanceRating, GameEmotionTag } from "@/types/game";

export const games = sqliteTable("game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  playerId: text("playerId")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  workspaceId: text("workspaceId").references(() => workspaces.id, {
    onDelete: "set null",
  }),

  // Game info
  date: integer("date", { mode: "timestamp_ms" }).notNull(),
  opponent: text("opponent").notNull(),
  result: text("result").$type<"Win" | "Loss" | "Draw">().notNull(),
  finalScore: text("finalScore").notNull(),
  minutesPlayed: integer("minutesPlayed").notNull(),

  // Game context (FR-29 / FR-30 / FR-31)
  gameName: text("gameName"),
  gameLocation: text("gameLocation"),
  gameLeagueCode: text("gameLeagueCode").$type<LeagueCode>(),
  gameLeagueOtherName: text("gameLeagueOtherName"),

  // Self-assessment (FR-37 / FR-38)
  performanceRating: integer("performanceRating").$type<PerformanceRating>(),
  // Display-only array — JSON
  emotionTags: text("emotionTags", { mode: "json" }).$type<GameEmotionTag[]>(),

  // Universal stats
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),

  // Defensive stats (nullable for non-defenders)
  tackles: integer("tackles"),
  interceptions: integer("interceptions"),
  clearances: integer("clearances"),
  blocks: integer("blocks"),
  aerialDuelsWon: integer("aerialDuelsWon"),

  // Goalkeeper stats (nullable for non-keepers)
  saves: integer("saves"),
  goalsAgainst: integer("goalsAgainst"),
  cleanSheet: integer("cleanSheet", { mode: "boolean" }),

  // Verification
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  verifiedAt: integer("verifiedAt", { mode: "timestamp_ms" }),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
