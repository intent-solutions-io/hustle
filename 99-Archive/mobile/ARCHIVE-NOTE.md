# Archived: Hustle mobile app (Expo / React Native)

**Archived:** 2026-07-10 · **Reason:** dormant + Firebase-dependent, contradicts the self-hosted posture.

## Why this was archived

The live Hustle product — **hustlestats.io**, the Next.js web app in `src/` — completed
its Firebase → self-hosted migration in **Phase 4.5 (#44)**. It now runs entirely on
`better-sqlite3` + Drizzle ORM + NextAuth with **zero Firebase dependencies**, self-hosted
on the Contabo VPS.

This `mobile/` app was the **only remaining active Firebase dependency** in the repo
(`firebase@^12.6.0`, Expo/EAS). It is **not deployed on the VPS** (app-store build target
only) and had been **dormant since 2025-12-25**. Keeping it in the active tree contradicted
the company's "self-hosted, GCP fully exited" posture and kept a live Firebase dependency
in dependency scans.

Firebase is this app's entire auth + data backend, so it could not be stripped in place
without a replacement. Archiving (in-tree, git history intact) is the safe, reversible move.

## Reviving it

Reviving the mobile app is a **migration project**, not a checkout: point its auth and data
layers at the same self-hosted API the web app now uses (`src/app/api/*`, SQLite/Drizzle,
NextAuth), then remove the `firebase` dependency. Tracked as a bead in this repo.

The two mobile CI/deploy workflows were disabled (`.github/workflows/mobile-*.yml.disabled`)
so they don't run against the archived path. Re-enable them only after the migration.
