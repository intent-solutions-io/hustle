import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // NextAuth.js / @auth/drizzle-adapter standard fields
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),

  // Phase 4 — profile fields (was UserDocument in firestore.ts)
  firstName: text("firstName"),
  lastName: text("lastName"),
  phone: text("phone"),
  photoUrl: text("photoUrl"),

  // Workspace ownership pointer (lives here for quick lookups; workspace FK soft to avoid circular ref)
  defaultWorkspaceId: text("defaultWorkspaceId"),

  // COPPA compliance — SQL-level default required so ADD COLUMN works against non-empty tables
  agreedToTerms: integer("agreedToTerms", { mode: "boolean" }).notNull().default(false),
  agreedToPrivacy: integer("agreedToPrivacy", { mode: "boolean" }).notNull().default(false),
  isParentGuardian: integer("isParentGuardian", { mode: "boolean" }).notNull().default(false),
  termsAgreedAt: integer("termsAgreedAt", { mode: "timestamp_ms" }),
  privacyAgreedAt: integer("privacyAgreedAt", { mode: "timestamp_ms" }),

  // Game verification PIN (bcrypt hash of 4-6 digit PIN)
  verificationPinHash: text("verificationPinHash"),

  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const passwordResetTokens = sqliteTable("passwordResetToken", {
  token: text("token").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});
