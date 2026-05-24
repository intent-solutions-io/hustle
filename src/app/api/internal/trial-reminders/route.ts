/**
 * POST /api/internal/trial-reminders
 *
 * Daily trial-reminder emails for workspaces whose trial ends in ~3 days.
 *
 * Replaces the GCP Cloud Function `sendTrialReminders` (Pub/Sub schedule
 * `0 9 * * *` UTC on hustleapp-production). Now driven by a VPS-side
 * systemd timer (`hustle-trial-reminders.timer`) that POSTs to this route
 * each day at 09:00 UTC.
 *
 * Auth: shared bearer token in `HUSTLE_INTERNAL_TOKEN`. Constant-time
 * compare so the route does not leak timing information about the secret.
 *
 * Window matches the legacy Firestore query exactly: trials whose
 * `trialEndsAt` falls between 3 and 4 days from now (i.e. the 24h window
 * starting 3 days out).
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { listWorkspacesEndingTrialWithinWindow } from "@/lib/db/queries/workspaces";
import { getUserByDefaultWorkspaceIdAdmin } from "@/lib/db/queries/users";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkBearer(req: NextRequest): boolean {
  const expected = process.env.HUSTLE_INTERNAL_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const presented = header.slice(7).trim();

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const log = createLogger("internal.trial-reminders");

  if (!checkBearer(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const upgradeBase = process.env.NEXTAUTH_URL ?? "https://hustlestats.io";

  let sent = 0;
  let failed = 0;

  try {
    const workspaces = await listWorkspacesEndingTrialWithinWindow(3, 4);
    log.info("Found workspaces with expiring trials", { count: workspaces.length });

    for (const ws of workspaces) {
      try {
        const owner = await getUserByDefaultWorkspaceIdAdmin(ws.id);
        if (!owner || !owner.email) {
          log.warn("No owner email for workspace; skipping", { workspaceId: ws.id });
          continue;
        }

        const template = emailTemplates.trialEndingSoon({
          name: owner.firstName || "there",
          daysRemaining: 3,
          upgradeUrl: `${upgradeBase}/billing/plans`,
        });

        const result = await sendEmail({
          to: owner.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        if (result.success) {
          sent++;
          log.info("Trial reminder sent", { workspaceId: ws.id });
        } else {
          failed++;
          const errMsg = "error" in result ? String(result.error) : "unknown";
          log.error("Failed to send trial reminder", new Error(errMsg), {
            workspaceId: ws.id,
          });
        }
      } catch (err) {
        failed++;
        log.error(
          "Error processing workspace",
          err instanceof Error ? err : new Error(String(err)),
          { workspaceId: ws.id }
        );
      }
    }

    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    log.error(
      "Trial reminder run failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { ok: false, error: "internal_error", sent, failed },
      { status: 500 }
    );
  }
}
