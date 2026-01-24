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
npx tsc --noEmit               # Type check
```

### Mobile App (React Native / Expo)
```bash
cd mobile
npm start                      # Expo dev server
npm run ios                    # iOS simulator
npm run android                # Android emulator
npm run web                    # Web browser
npx expo prebuild              # Generate native projects
npx eas build --platform ios   # EAS cloud build
```

### Testing
```bash
npm run test:unit              # Vitest unit tests (src/**/*.test.ts)
npm run test:watch             # Vitest watch mode
npm run test:coverage          # Coverage report (V8)
npm run test:e2e               # Playwright E2E (03-Tests/e2e/) on port 4000
npm run test:e2e:ui            # Playwright UI mode (interactive)
npm run test:e2e:headed        # Run with visible browser
npm run test:e2e:debug         # Debug mode (PWDEBUG=1, headed, Chromium)
npm run qa:e2e:smoke           # Quick smoke tests (login + journey)
npm run qa:e2e:update-snapshots # Update visual regression baselines

# Run single test file
npx vitest run src/lib/billing/plan-limits.test.ts
npx playwright test 03-Tests/e2e/01-authentication.spec.ts

# Run single E2E test with specific browser
npx playwright test 03-Tests/e2e/01-authentication.spec.ts --project=chromium
```

**CI vs Local**: CI builds production app then runs tests. Locally, dev server is used. E2E tests run on port 4000 (not 3000). Use `test:e2e:debug` to step through tests with Playwright Inspector.

### Firebase & Cloud Functions
```bash
# Emulators
firebase emulators:start       # Local emulators (Auth, Firestore, Functions)

# Functions development
cd functions
npm run build                  # Compile TypeScript
npm run serve                  # Run functions locally
npm run shell                  # Interactive functions shell
npm run logs                   # View function logs

# Deployment
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy                # Deploy everything
```

## Architecture

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
/waitlist/{email}                      # Early access signups
/workspace-invites/{inviteId}          # Pending collaborator invites
```

### Key Types (`src/types/firestore.ts`)
- `WorkspaceDocument` - tenant with plan (free/starter/plus/pro), status (active/trial/past_due/canceled/suspended), Stripe integration
- `UserDocument` - Firebase Auth user profile with workspace ownership, verification PIN hash
- `PlayerDocument` - athlete with 13 position codes (GK, CB, DM, CM, ST, etc.)
- `GameDocument` - match stats (goals, assists, tackles, saves, etc.) with self-assessment
- `DreamGymDocument` - training profile, schedule, events, mental check-ins
- `WorkoutLogDocument` - completed workout with actual reps/sets/weight tracked

### Service Layer Pattern
- **Client services** (`src/lib/firebase/services/`) - browser-side Firestore ops using Firebase SDK
- **Admin services** (`src/lib/firebase/admin-services/`) - server-side ops using Firebase Admin SDK
- **Access control** (`src/lib/firebase/access-control.ts`, `src/lib/workspaces/`) - subscription enforcement

### Key Hooks
- `useAuth()` - Firebase Auth state (user, loading)
- `useWorkspaceAccess()` - subscription status, plan limits, access permissions

### Cloud Functions (`functions/src/index.ts`)
- `orchestrator` - A2A gateway to Vertex AI agents
- `sendWelcomeEmail` - Auth trigger on user creation
- `sendTrialReminders` - Daily scheduled function (9:00 UTC)

### Vertex AI Agent System (`vertex-agents/`)
5 agents coordinated via A2A protocol: Operations Manager (root), Validation, User Creation, Onboarding, Analytics

### Middleware & Auth (`src/middleware.ts`)
Edge middleware protects `/dashboard/*` and `/api/*` routes:
- Session cookies: `__session` or `firebase-auth-token`
- Dashboard routes → redirect to `/login` if no session
- Protected API routes → return 401 JSON if no session
- Public API routes (no auth required): `/api/health`, `/api/auth/*`, `/api/waitlist`, `/api/webhooks`, `/api/verify`

Debug middleware with `MIDDLEWARE_DEBUG=verbose npm run dev`

## Critical Rules

1. **Firestore only** - PostgreSQL/Prisma decommissioned (archived in `99-Archive/`)
2. **Firebase Auth only** - NextAuth removed
3. **WIF only** - No service account keys in CI/CD
4. **NWSL/Logo gen** - CI-only (gate.sh blocks local execution)
5. **Docs** - All in `000-docs/` with `NNN-CC-ABCD-desc.md` naming
6. **ADK standards** - Follow https://google.github.io/adk-docs/

## Billing Tiers

| Plan | Players | Games/Month |
|------|---------|-------------|
| Starter | 2 | 10 |
| Plus | 5 | 50 |
| Pro | Unlimited | Unlimited |

## Testing Strategy

- **Unit tests**: Vitest + Testing Library, co-located in `src/**/*.test.ts`
- **E2E tests**: Playwright in `03-Tests/e2e/`, numbered sequentially (01-authentication, 02-dashboard, etc.)
- **Firestore tests**: Use Firebase emulators locally

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
