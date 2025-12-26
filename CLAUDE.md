## Task Tracking (Beads / bd)
- Use `bd` for ALL tasks/issues (no markdown TODO lists).
- Start of session: `bd ready`
- Create work: `bd create "Title" -p 1 --description "Context + acceptance criteria"`
- Update status: `bd update <id> --status in_progress`
- Finish: `bd close <id> --reason "Done"`
- End of session: `bd sync` (flush/import/export + git sync)
- Manual testing safety:
  - Prefer `BEADS_DIR` to isolate a workspace if needed. (`BEADS_DB` exists but is deprecated.)


# CLAUDE.md


### Beads upgrades
- After upgrading `bd`, run: `bd info --whats-new`
- If `bd info` warns about hooks, run: `bd hooks install`
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hustle is a youth soccer statistics tracking platform. **Live**: https://hustlestats.io

**Stack**: Next.js 15 + React 19 + TypeScript | Firebase (Auth, Firestore, Functions, Hosting) | Vertex AI Agent Engine (A2A) | Stripe | GitHub Actions with WIF

## Commands

```bash
# Development
npm run dev                    # Turbopack dev server (http://localhost:3000)
npm run build                  # Production build with Turbopack
npm run lint                   # ESLint (flat config)
npx tsc --noEmit               # Type check

# Testing
npm run test:unit              # Vitest unit tests (src/**/*.test.ts)
npm run test:watch             # Vitest watch mode
npm run test:coverage          # Coverage report (V8)
npm run test:e2e               # Playwright E2E (03-Tests/e2e/)
npm run test:e2e:ui            # Playwright UI mode
npm run qa:e2e:smoke           # Quick smoke tests (login + journey)

# Run single test file
npx vitest run src/lib/billing/plan-limits.test.ts
npx playwright test 03-Tests/e2e/01-authentication.spec.ts

# Firebase
firebase emulators:start       # Local emulators (Auth, Firestore, Functions)
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
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
/waitlist/{email}                      # Early access signups
/workspace-invites/{inviteId}          # Pending collaborator invites
```

### Key Types (`src/types/firestore.ts`)
- `WorkspaceDocument` - tenant with plan (free/starter/plus/pro), status (active/trial/past_due/canceled/suspended), Stripe integration
- `UserDocument` - Firebase Auth user profile with workspace ownership
- `PlayerDocument` - athlete with 13 position codes (GK, CB, DM, CM, ST, etc.)
- `GameDocument` - match stats (goals, assists, tackles, saves, etc.)

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

## Coding Conventions

- TypeScript with 2-space indentation
- PascalCase components, camelCase utilities, kebab-case files
- Server components preferred; mark client components with `'use client'`
- Tailwind utilities grouped: layout → color → state
- Conventional Commits: `feat(scope):`, `fix(scope):`, etc.