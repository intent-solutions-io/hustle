import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!token || !email) {
    return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
  }

  // Opportunistic cleanup of expired tokens.
  await db.delete(verificationTokens).where(lt(verificationTokens.expires, new Date()));

  const row = await db.query.verificationTokens.findFirst({
    where: and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token)),
  });
  if (!row) {
    return NextResponse.json({ error: "Verification link is invalid or expired" }, { status: 400 });
  }
  if (row.expires < new Date()) {
    return NextResponse.json({ error: "Verification link has expired" }, { status: 400 });
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));
  await db.delete(verificationTokens).where(
    and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token))
  );

  return NextResponse.json({ ok: true });
}
