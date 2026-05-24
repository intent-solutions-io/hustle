/**
 * Billing-side tables: Stripe webhook idempotency log + per-workspace
 * append-only ledger of subscription lifecycle events.
 *
 * Phase 4.5 migration: replaces the workspaces/{id}/billing_ledger Firestore
 * subcollection. The ledger is keyed by autogen UUID and references the
 * workspace by FK so cascades clean up correctly.
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { workspaces } from "./workspaces";

/**
 * Stripe webhook event log — idempotency record.
 *
 * The webhook handler upserts on `id` (Stripe's event ID); duplicate
 * deliveries become no-ops. `payload` stores the full event JSON for
 * forensic + replay use.
 */
export const webhookEvents = sqliteTable("webhookEvent", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: integer("receivedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  processedAt: integer("processedAt", { mode: "timestamp_ms" }),
  payload: text("payload"), // stringified Stripe.Event
  error: text("error"),
});

/**
 * Billing ledger entry — append-only audit trail per workspace.
 *
 * Mirrors the legacy Firestore subcollection schema (LedgerEventType /
 * LedgerEventSource enums in src/lib/stripe/ledger.ts).
 */
export const billingLedger = sqliteTable(
  "billingLedger",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    stripeEventId: text("stripeEventId"),
    timestamp: integer("timestamp", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    statusBefore: text("statusBefore"),
    statusAfter: text("statusAfter"),
    planBefore: text("planBefore"),
    planAfter: text("planAfter"),
    source: text("source").notNull(),
    note: text("note"),
  },
  (table) => ({
    workspaceTimestampIdx: index("billingLedger_workspace_ts_idx").on(
      table.workspaceId,
      table.timestamp
    ),
  })
);
