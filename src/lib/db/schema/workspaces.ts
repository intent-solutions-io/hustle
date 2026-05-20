import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import type {
  WorkspacePlan,
  WorkspaceStatus,
  WorkspaceMemberRole,
} from "@/types/firestore";

export const workspaces = sqliteTable("workspace", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  ownerUserId: text("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),

  plan: text("plan").$type<WorkspacePlan>().notNull().$defaultFn(() => "free"),
  status: text("status").$type<WorkspaceStatus>().notNull().$defaultFn(() => "trial"),

  // Billing (flattened from WorkspaceDocument.billing)
  billingStripeCustomerId: text("billingStripeCustomerId"),
  billingStripeSubscriptionId: text("billingStripeSubscriptionId"),
  billingCurrentPeriodEnd: integer("billingCurrentPeriodEnd", { mode: "timestamp_ms" }),

  // Usage (flattened from WorkspaceDocument.usage; denormalized for limit checks)
  usagePlayerCount: integer("usagePlayerCount").notNull().$defaultFn(() => 0),
  usageGamesThisMonth: integer("usageGamesThisMonth").notNull().$defaultFn(() => 0),
  usageStorageUsedMB: integer("usageStorageUsedMB").notNull().$defaultFn(() => 0),

  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
});

// Junction table — was WorkspaceDocument.members[] in Firestore.
// Split out so we can query "what workspaces does user X belong to" efficiently.
export const workspaceMembers = sqliteTable(
  "workspaceMember",
  {
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<WorkspaceMemberRole>().notNull(),
    addedAt: integer("addedAt", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    addedBy: text("addedBy")
      .notNull()
      .references(() => users.id, { onDelete: "no action" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
  })
);
