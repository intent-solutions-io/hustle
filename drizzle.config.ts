import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema/*",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "data/hustle.db",
  },
} satisfies Config;
