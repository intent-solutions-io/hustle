/**
 * POST /api/auth/logout — clears both the legacy Firebase __session cookie
 * (for any user still mid-transition) and triggers NextAuth signOut to clear
 * its JWT cookie. Returns JSON for client-side fetch callers; the legacy
 * client code expected a JSON response shape.
 */
import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export const runtime = "nodejs";

export async function POST() {
  // Trigger NextAuth signOut without redirecting — clears the auth cookies.
  await signOut({ redirect: false });

  const response = NextResponse.json({ success: true });

  // Belt-and-suspenders: clear legacy Firebase __session cookie too.
  response.cookies.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
