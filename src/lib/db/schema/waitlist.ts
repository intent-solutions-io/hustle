import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const waitlist = sqliteTable("waitlist", {
  email: text("email").primaryKey(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  source: text("source"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
