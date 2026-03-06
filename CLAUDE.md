# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hustle is a youth soccer statistics tracking platform. **Live**: https://hustlestats.io

**Stack**: Next.js 15 + React 19 + TypeScript | Firebase (Auth, Firestore, Functions, Hosting) | Vertex AI Agent Engine (A2A) | Stripe | GitHub Actions with WIF

## Task Tracking (Beads / bd)

Use `bd` for ALL tasks/issues (no markdown TODO lists).

```bash
bd ready                                    # Start of session - see ready work
bd create "Title" -p 1 --description "..."  # Create work item
bd update <id> --status in_progress         # Update status
bd close <id> --reason "Done"               # Finish work
bd sync                                     # End of session - flush + git sync
```

**After upgrading bd**: Run `bd info --whats-new` and `bd hooks install` if warned.

## Commands

### Web App (Next.js)
```bash
npm run dev                    # Turbopack dev server (http://localhost:3000)
npm run build                  # Production build with Turbopack
npm run lint                   # ESLint (flat config)
npx tsc --noEmit               # Type check (NOT run during build — see Build Gotchas)
```

### Mobile App (React Native / Expo)
```bash
cd mobile
npm start                      # Expo dev server
npm run ios                    # iOS simulator
npm run android                # Android emulator
npx expo prebuild              # Generate native projects
```
Expo SDK 54 + Expo Router (file-based routing) + NativeWind (Tailwind for RN) + React Query + MMKV/SecureStore for storage. Shares `firebase`, `zod`, `react-hook-form`, and `zustand` with web app.

### Testing
```bash
npm run test:unit              # Vitest unit tests
npm run test:watch             # Vitest watch mode
npm run test:coverage          # Coverage report (V8)
npm run test:integration       # Integration tests (Firebase emulators required)
npm run test:integration:emulator  # Spins up emulators + runs integration tests
npm run test:e2e               # Playwright E2E (03-Tests/e2e/) on port 4000
npm run test:e2e:ui            # Playwright UI mode (interactive)
npm run test:e2e:debug         # Debug mode (PWDEBUG=1, headed, Chromium)
npm run test:security          # npm audit (moderate+ severity)
npm run qa:e2e:smoke           # Quick smoke tests (login + journey)
npm run qa:e2e:update-snapshots # Update visual regression baselines

# Run single test file
npx vitest run src/lib/billing/plan-limits.test.ts
npx playwright test 03-Tests/e2e/01-authentication.spec.ts --project=chromium
```

**Unit tests**: Both co-located (`src/lib/**/*.test.ts`, `src/middleware.test.ts`) and in `src/__tests__/` (`src/__tests__/lib/`, `src/__tests__/api/`).

**Integration tests** (`*.integration.test.ts`): Separate vitest config (`vitest.integration.config.mts`), run against Firebase emulators in `node` environment with `forks` pool. Found in `src/lib/firebase/admin-services/` and `src/lib/`.

**E2E details**: Tests run on port 4000 (not 3000), overridable via `PLAYWRIGHT_BASE_URL`. CI builds production app (standalone) then tests against it. Locally, dev server is used. Global setup (`03-Tests/e2e/global-setup.ts`) creates authenticated storage state (`03-Tests/e2e/.auth/user.json`) reused across tests. Use `test:e2e:debug` to step through with Playwright Inspector.

### Firebase & Cloud Functions
```bash
firebase emulators:start       # Local emulators (Auth, Firestore, Functions)

# Functions (separate TypeScript project in functions/)
cd functions && npm run build  # Compile
cd functions && npm run serve  # Run locally

# Deployment
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Architecture

### Path Alias
`@/` maps to `src/` (configured in `tsconfig.json` and `vitest.config.mts`). All imports use `@/` prefix.

### Data Flow
```
React Components → useAuth/useWorkspaceAccess hooks
       ↓
Client Services (src/lib/firebase/services/) → Firestore SDK
       ↓
API Routes (src/app/api/) → Admin Services (src/lib/firebase/admin-services/)
       ↓
Cloud Functions (functions/src/) → Vertex AI Agents (A2A protocol)
```

### UI Layer
- **Component library**: shadcn/ui primitives in `src/components/ui/` (Radix UI + Tailwind + CVA)
- **Forms**: react-hook-form + @hookform/resolvers + Zod v4 schemas (`src/lib/validations/`)
- **Charts**: Recharts (player analytics, workout progress)
- **State**: Zustand available; most state via hooks (`useAuth`, `useWorkspaceAccess`) and fetch calls
- **Theming**: next-themes for dark mode; Tailwind CSS 3

### Firestore Collections
```
/workspaces/{workspaceId}              # Billable tenant (plan, status, billing)
/users/{userId}                        # User profile, COPPA compliance
  /players/{playerId}                  # Child athlete profiles
    /games/{gameId}                    # Game statistics
    /dreamGym                          # Training profile (singleton)
    /workoutLogs/{logId}               # Completed workout history
    /journal/{entryId}                 # Player journal entries
    /biometrics/{logId}                # Health/recovery metrics
    /assessments/{assessmentId}        # Fitness test results
    /cardioLogs/{logId}                # Running/distance tracking
    /practiceLogs/{logId}              # Practice session logs
/waitlist/{email}                      # Early access signups
/workspace-invites/{inviteId}          # Pending collaborator invites
```

### Key Types (`src/types/firestore.ts`)
Each Firestore document type has two variants: a `*Document` interface (with `Timestamp`) for Firestore operations, and a client-side interface (with `Date`) for React components. Example: `WorkspaceDocument` → `Workspace`.

- `WorkspaceDocument` - tenant with plan (free/starter/plus/pro), status (active/trial/past_due/canceled/suspended), Stripe integration, collaborator members
- `UserDocument` - Firebase Auth user profile with workspace ownership, verification PIN hash
- `PlayerDocument` - athlete with 13 position codes (GK, CB, DM, CM, ST, etc.)
- `GameDocument` - match stats (goals, assists, tackles, saves, etc.) with self-assessment
- `DreamGymDocument` - training profile, schedule, events, mental check-ins
- `WorkoutLogDocument` - completed workout with actual reps/sets/weight tracked
- `CardioLogDocument` - running/distance activities with pace and heart rate
- `PracticeLogDocument` - practice sessions with focus areas and self-assessment

### Service Layer Pattern
- **Client services** (`src/lib/firebase/services/`) - browser-side Firestore ops using Firebase SDK
- **Admin services** (`src/lib/firebase/admin-services/`) - server-side ops using Firebase Admin SDK
- **Access control** (`src/lib/firebase/access-control.ts`, `src/lib/workspaces/`) - subscription enforcement
- **Stripe integration** (`src/lib/stripe/`) - plan enforcement, billing portal, ledger, customer portal

### Key Hooks (`src/hooks/`)
- `useAuth()` - Firebase Auth state (user, loading)
- `useWorkspaceAccess()` - subscription status, plan limits, access permissions (fetches `/api/workspace/current`)
- `usePlayerPhotoUpload()` - Firebase Storage photo upload

### API Routes (`src/app/api/`)
Major route groups:
- `/api/auth/*` - login, logout, session management, password reset, verification
- `/api/billing/*` - Stripe checkout, plan changes, portal sessions, invoices, webhook
- `/api/players/*` - CRUD + nested resources (games, dream-gym, journal, biometrics, assessments, cardio-logs, practice-logs, workout-logs)
- `/api/workspace/*` - current workspace data
- `/api/webhooks/stripe` - Stripe webhook handler
- `/api/ai/*` - AI feedback endpoints

### Cloud Functions (`functions/src/index.ts`)
Separate TypeScript project (`functions/` has its own `package.json` and `tsconfig.json`):
- `orchestrator` - A2A gateway to Vertex AI agents
- `sendWelcomeEmail` - Auth trigger on user creation (sends via Resend)
- `sendTrialReminders` - Daily scheduled function (9:00 UTC)

### Vertex AI Agent System (`vertex-agents/`)
5 agents coordinated via A2A protocol: Operations Manager (root), Validation, User Creation, Onboarding, Analytics

### Auth Architecture

**Single cookie**: `__session` (14-day, httpOnly, server-set via `/api/auth/set-session`).

**Server auth** (`src/lib/auth.ts`) - single canonical module:
- `auth()` — lightweight session check for API routes (no Firestore)
- `authWithProfile()` — session + Firestore user profile for dashboard pages
- `requireAuth()` — throws if unauthenticated or email unverified

**Client auth** (`src/lib/firebase/auth.ts`) — signIn/signUp/signOut, email verification.

**Login flow**: Firebase client auth → `getIdToken()` → POST `/api/auth/set-session` (retry-with-backoff, 4 attempts) → `__session` cookie → redirect to dashboard.

**E2E test mode**: Centralized in `src/lib/e2e.ts` (`isE2ETestMode()`). Bypasses email verification checks.

**Shared utilities**: `src/lib/utils/timeout.ts` (`withTimeout()` for promise timeouts).

### Middleware (`src/middleware.ts`)
Edge middleware protects `/dashboard/*` and `/api/*` routes:
- Session cookie: `__session` only
- Dashboard routes → redirect to `/login` if no session
- Protected API routes → return 401 JSON if no session
- Public API routes (no auth required): `/api/health`, `/api/auth/*`, `/api/waitlist`, `/api/webhooks`, `/api/verify`

Debug middleware with `npm run dev:debug` (sets `MIDDLEWARE_DEBUG=verbose`)

### Auth Domain & Email Links
- `authDomain` in client config (`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`) stays as `hustleapp-production.firebaseapp.com` — internal SDK setting, not user-facing. Changing to `hustlestats.io` would break OAuth.
- Email action URLs (password reset, email verification) are configured in **Firebase Console** → Authentication → Templates → Customize action URL to point to `hustlestats.io/reset-password` and `hustlestats.io/verify-email`.
- All auth actions (sign up, sign in, password reset, email verify) use **client-side Firebase SDK** — no Cloud Run dependency.
- Password reset uses client-side `sendPasswordResetEmail()`.
- Server-side `/api/auth/resend-verification` remains active (uses Resend for branded emails).

## Build Gotchas

- **ESLint and TypeScript errors are ignored during `npm run build`** (`next.config.ts` has `ignoreDuringBuilds: true` for both). Always run `npm run lint` and `npx tsc --noEmit` separately to catch issues.
- **Standalone output mode**: `next.config.ts` sets `output: 'standalone'` — production builds produce a self-contained `server.js` in `.next/standalone/`. CI copies static assets into the standalone dir before running.
- **`NEXT_PUBLIC_E2E_TEST_MODE`** must be set at both build time (inlined into client code) and runtime (server checks) for E2E tests to work correctly.
- **Trailing-space redirect**: `next.config.ts` has a redirect from `/verify-email%20` → `/verify-email` to handle a Firebase Console config typo.

## Critical Rules

1. **Firestore only** - PostgreSQL/Prisma decommissioned (archived in `99-Archive/`)
2. **Firebase Auth only** - NextAuth removed
3. **WIF only** - No service account keys in CI/CD
4. **NWSL/Logo gen** - CI-only (gate.sh blocks local execution)
5. **Docs** - All in `000-docs/` with `NNN-CC-ABCD-desc.md` naming
6. **ADK standards** - Follow https://google.github.io/adk-docs/
7. **Functions isolation** - `functions/` is a separate TS project excluded from root `tsconfig.json`

## Billing Tiers

| Plan | Players | Games/Month |
|------|---------|-------------|
| Starter | 2 | 10 |
| Plus | 5 | 50 |
| Pro | Unlimited | Unlimited |

Enforcement: server-side in `src/lib/stripe/plan-enforcement.ts` and `src/lib/workspaces/enforce.ts`, client-side via `useWorkspaceAccess()` hook. Plan limits defined in `src/lib/billing/plan-limits.ts`.

## Testing Strategy

- **Unit tests**: Vitest + Testing Library (jsdom environment, `@vitejs/plugin-react`). Co-located in `src/lib/` and `src/__tests__/`.
- **Integration tests**: Vitest in `node` environment against Firebase emulators. Files: `*.integration.test.ts` in `src/lib/firebase/admin-services/` and `src/lib/`. Separate config: `vitest.integration.config.mts`.
- **E2E tests**: Playwright in `03-Tests/e2e/`, numbered sequentially (01-authentication, 02-dashboard, etc.). Snapshots in `03-Tests/snapshots/`. Sequential execution (single worker) for Firebase stability.
- **Visual regression**: Playwright screenshot comparison with 0.2% pixel tolerance

## Environment Variables

Required in `.env` (copy from `.env.example`):
```bash
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# E2E Testing
E2E_TEST_EMAIL=              # Test user email for Playwright
E2E_TEST_PASSWORD=           # Test user password
NEXT_PUBLIC_E2E_TEST_MODE=   # Set to "true" in test env
```

## Coding Conventions

- TypeScript with 2-space indentation
- PascalCase components, camelCase utilities, kebab-case files
- Server components preferred; mark client components with `'use client'`
- Tailwind utilities grouped: layout → color → state
- Conventional Commits: `feat(scope):`, `fix(scope):`, etc.
