# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hustle is a youth soccer statistics tracking application with three integrated systems:
1. **Core App**: Next.js 15 web application with Firebase/Firestore backend
2. **Vertex AI Agents**: Multi-agent A2A system for operations orchestration
3. **NWSL Pipeline**: CI-only video generation using Vertex AI Veo 3.0

## Technology Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5.x, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Cloud Functions (Node.js 20)
- **Database**: Firestore (primary), PostgreSQL/Prisma (legacy, being migrated)
- **Authentication**: Firebase Auth (migrating from NextAuth v5)
- **AI/ML**: Vertex AI Agent Engine with A2A protocol, Veo 3.0, Lyria
- **Testing**: Vitest (unit), Playwright (e2e), Testing Library
- **Deployment**: Firebase Hosting + Cloud Run (staging), GitHub Actions + WIF
- **Monitoring**: Sentry error tracking, Google Cloud Logging

## Migration Status (November 2025)

**PHASE 1 EXECUTION: Go-Live Track**

- ✅ Firebase project setup complete (`hustleapp-production`)
- ✅ Firestore schema, services, and security rules deployed
- ✅ Firebase Admin SDK integrated (`src/lib/firebase/`)
- ✅ Migration script ready (`05-Scripts/migration/migrate-to-firestore.ts`)
- ✅ Vertex AI A2A agents deployed (orchestrator + 4 sub-agents)
- ✅ Step 1 (Local auth wiring) complete - Firebase Auth + Firestore verified
- 🔄 **IN PROGRESS**: Phase 1 Go-Live Track (Tasks 2-8)
- 🔲 **PENDING**: Production deployment and legacy cleanup

See key docs:
- `000-docs/190-PP-PLAN-phase1-go-live-track.md` - Phase 1 execution plan
- `000-docs/189-AA-SUMM-hustle-step-1-auth-wiring-complete.md` - Step 1 completion
- `000-docs/190-AA-MAAR-hustle-env-firebase-local-unblock.md` - Local environment setup

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev                # Runs on http://localhost:3000 (default Next.js port)

# Firebase operations (primary)
npm --prefix functions run serve        # Run Cloud Functions locally
firebase deploy --only firestore       # Deploy security rules & indexes
firebase deploy --only functions       # Deploy Cloud Functions
firebase deploy --only hosting         # Deploy Next.js app to Firebase Hosting
firebase emulators:start               # Run Firebase emulators locally

# Database operations (Prisma - legacy, being phased out)
npx prisma generate        # Generate Prisma Client after schema changes
npx prisma migrate dev     # Create and apply migration
npx prisma studio          # Open Prisma Studio GUI (database browser)

# Migration script (PostgreSQL → Firestore)
npx tsx 05-Scripts/migration/migrate-to-firestore.ts  # Run data migration (when unblocked)

# Testing
npm test                   # Run all tests (unit + e2e)
npm run test:unit          # Unit tests with Vitest
npm run test:watch         # Vitest watch mode
npm run test:coverage      # Unit tests with coverage report
npm run test:e2e           # E2E tests with Playwright
npm run test:e2e:ui        # Playwright interactive UI mode
npm run test:e2e:headed    # Playwright headed browser mode
npm run test:report        # Show Playwright HTML report
npm run test:security      # Run npm audit

# Linting & Type Checking
npm run lint               # Run ESLint
npx tsc --noEmit          # TypeScript type check (no build output)

# Build
npm run build             # Production build with Turbopack
npm start                 # Start production server
```

### Docker (Local Development)
```bash
# Start PostgreSQL database
cd 06-Infrastructure/docker
docker-compose up -d postgres

# Stop all services
docker-compose down

# View logs
docker-compose logs -f postgres

# Access database directly
docker exec -it hustle-postgres psql -U hustle_admin -d hustle_mvp
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to staging (auto via GitHub Actions)
git push origin main

# Manual Cloud Run deployment (requires gcloud auth)
gcloud run deploy hustle-staging --source . --region us-central1 --project hustle-dev-202510
gcloud run deploy hustle-production --source . --region us-central1 --project hustle-devops

# Check deployment status
gcloud run services describe hustle-staging --region us-central1
gcloud run services logs read hustle-staging --limit=50 --region us-central1
```

### NWSL Video Pipeline (CI-Only)
```bash
# Navigate to NWSL directory
cd nwsl/

# CRITICAL: All generation runs ONLY in GitHub Actions (enforced by gate.sh)
# Trigger: Actions tab → "Assemble NWSL Documentary" → Run workflow

# Local operations (inspection only)
ls -la 0000-docs/*-DR-REFF-veo-seg-*.md    # View 8 segment canon files (004-011)
cat 0000-docs/032-OD-CONF-generation-switches.md  # Generation configuration
cat 007-logs/generation/vertex_ops.log     # View Vertex AI operations log (post-CI)

# Quick Start (after CI run downloads segments to 003-raw-segments/)
./050-scripts/monitor_segments.sh          # Check segment download status
./050-scripts/download_ready_segments.sh   # Download completed segments from cloud
```

### Vertex AI Agents (A2A System)
```bash
# Navigate to agents directory
cd vertex-agents/

# Deploy agents (requires manual Console setup first)
./deploy_agent.sh all                      # Deploy orchestrator + sub-agents

# Check agent status
gcloud alpha agent-engine agents list --location=us-central1

# Test A2A protocol
cd functions && npm run serve              # Start Cloud Functions locally
curl -X POST http://localhost:5001/hustleapp-production/us-central1/orchestrateTask \
  -H "Content-Type: application/json" \
  -d '{"task": "create_user", "data": {...}}'
```

## Architecture & Key Patterns

### Three-System Architecture

**1. Core Web Application**
- Next.js 15 App Router with React Server Components
- Firebase Hosting for static assets + Cloud Run for SSR
- Firestore for real-time data with hierarchical subcollections
- Firebase Auth for authentication (replacing NextAuth)

**2. Vertex AI Agent System (A2A Protocol)**
- **Orchestrator**: `hustle-operations-manager` (main coordinator)
- **Sub-Agents**: Validation, User Creation, Onboarding, Analytics
- **Communication**: Cloud Functions → Orchestrator → Sub-Agents
- **Memory**: Vertex AI Memory Bank for session persistence
- **Deployment**: Manual Console setup, `vertex-agents/deploy_agent.sh`

**3. NWSL Video Pipeline (CI-Only)**
- **Canon System**: 8 markdown specs (`nwsl/0000-docs/004-DR-REFF-veo-seg-*.md`)
- **Generation**: Vertex AI Veo 3.0 (video) + Lyria (audio)
- **Enforcement**: `gate.sh` blocks local execution
- **Assembly**: 8×8s segments + 4s end card = 68s documentary
- **Auth**: GitHub Actions WIF (no service account keys)

### Firestore Data Model (New Primary Database)

**Hierarchical Structure:**
```
/users/{userId}                    # User profile + COPPA compliance
  /players/{playerId}              # Child players (subcollection)
    /games/{gameId}                # Game statistics (nested subcollection)
/waitlist/{email}                  # Early access signups
```

**Services** (`src/lib/firebase/services/`):
- `users.ts` - User CRUD operations
- `players.ts` - Player CRUD with subcollections
- `games.ts` - Game CRUD with filtering/verification

**Security**: `firestore.rules` enforces parent-child ownership, read/write permissions

### Legacy Database (Prisma + PostgreSQL)

**Status**: Being phased out, data migrating to Firestore

8 Prisma models in `prisma/schema.prisma`:
- **users**: Parent accounts (email, password, COPPA compliance)
- **Player**: Youth player profiles
- **Game**: Position-specific statistics (tackles, saves, etc.)
- **accounts/sessions**: NextAuth v5 session management
- **password_reset_tokens**: Time-limited reset tokens
- **email_verification_tokens**: Email verification flow
- **verification_tokens**: Generic tokens (NextAuth)

**Migration Path**: `05-Scripts/migration/migrate-to-firestore.ts` (58 users ready to migrate)

### Authentication Patterns

**Current (NextAuth v5)** - Being replaced:
- Credentials provider (`src/lib/auth.ts`)
- JWT sessions (30-day expiry)
- Bcrypt password hashing (10 salt rounds)
- Email verification required before login

**Target (Firebase Auth)** - In progress:
- Email/Password provider (waiting for Console enable)
- Firebase Authentication SDK
- Custom claims for role-based access
- Integrated with Firestore security rules

### API Route Structure

All routes in `src/app/api/` follow Next.js 15 App Router conventions:
- Route handlers export GET/POST/PUT/DELETE functions
- Authentication via `auth()` from NextAuth (transitioning to Firebase)
- Zod schema validation in `src/lib/validations/`
- Error responses use standardized JSON format

**Key Routes:**
- `/api/auth/*` - Authentication endpoints
- `/api/players/*` - Player CRUD operations
- `/api/games/*` - Game statistics management
- `/api/admin/*` - Administrative operations
- `/api/migrate/*` - Migration utilities

### Component Organization

- **Server Components**: Default for Next.js 15 App Router
- **Client Components**: Marked with `'use client'` directive
- **UI Components**: `src/components/ui/` (shadcn/ui)
- **Dashboard**: `src/app/dashboard/` (auth-protected pages)
- **Layouts**: `src/app/layout.tsx` (root), page-specific layouts

## Project Structure

```
hustle/
├── src/                           # Source code root
│   ├── app/                       # Next.js 15 App Router
│   │   ├── api/                   # API route handlers (13 routes)
│   │   │   ├── auth/              # NextAuth endpoints (legacy)
│   │   │   ├── players/           # Player CRUD
│   │   │   ├── games/             # Game statistics
│   │   │   ├── admin/             # Admin operations
│   │   │   └── migrate/           # Migration utilities
│   │   ├── dashboard/             # Dashboard pages (auth-protected)
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   ├── forgot-password/       # Password reset flow
│   │   ├── verify-email/          # Email verification
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/                # React components
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/                       # Core utilities
│   │   ├── firebase/              # 🆕 Firebase integration
│   │   │   ├── config.ts          # Client SDK config
│   │   │   ├── admin.ts           # Admin SDK config
│   │   │   └── services/          # Firestore CRUD (users, players, games)
│   │   ├── auth.ts                # NextAuth v5 (legacy)
│   │   ├── prisma.ts              # Prisma Client (legacy)
│   │   ├── email.ts               # Resend email service
│   │   ├── logger.ts              # Google Cloud Logging
│   │   ├── tokens.ts              # Token generation/validation
│   │   └── validations/           # Zod schemas
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript type definitions
│   │   └── firestore.ts           # 🆕 Firestore document types
│   └── schema/                    # Additional schemas
├── prisma/
│   ├── schema.prisma              # PostgreSQL schema (8 models - legacy)
│   └── migrations/                # Prisma migrations (legacy)
├── functions/                     # 🆕 Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts               # Function exports
│   │   └── a2a-client.ts          # Vertex AI A2A protocol client
│   └── package.json               # Node.js 20 dependencies
├── vertex-agents/                 # 🆕 Vertex AI Agent Engine (A2A)
│   ├── deploy_agent.sh            # Agent deployment script
│   └── README.md                  # A2A architecture docs
├── nwsl/                          # NWSL video pipeline (CI-only)
│   ├── 0000-docs/                 # Canon specifications (8 segments: 004-011)
│   │   └── README_SEGMENT_GENERATION.md  # Quick start guide
│   ├── 0000-images/               # Reference images
│   ├── 003-raw-segments/          # Downloaded segments (SEG-*.mp4)
│   ├── 007-logs/generation/       # Vertex AI operation logs
│   ├── 020-audio/                 # Lyria-generated audio
│   ├── 030-video/                 # Veo-generated segments
│   ├── 050-scripts/               # Pipeline shell scripts
│   │   ├── generate_all_segments_explicit.sh
│   │   ├── monitor_segments.sh
│   │   └── download_ready_segments.sh
│   └── gate.sh                    # CI enforcement gate (blocks local runs)
├── scripts/                       # 🆕 Utility scripts
│   └── migrate-to-firestore.ts    # PostgreSQL → Firestore migration
├── 06-Infrastructure/
│   ├── docker/                    # Docker Compose for local PostgreSQL
│   └── terraform/                 # Cloud Run infrastructure
├── tests/                         # Test suites
│   ├── e2e/                       # Playwright E2E tests
│   └── unit/                      # Vitest unit tests
├── .github/workflows/             # GitHub Actions (9 workflows)
│   ├── ci.yml                     # Continuous integration
│   ├── deploy.yml                 # Cloud Run deployment (staging)
│   ├── deploy-firebase.yml        # 🆕 Firebase Hosting + Functions
│   ├── deploy-vertex-agents.yml   # 🆕 Vertex AI agent deployment
│   ├── assemble.yml               # NWSL video assembly (CI-only)
│   └── release.yml                # Version releases
├── firebase.json                  # 🆕 Firebase configuration
├── firestore.rules                # 🆕 Firestore security rules
├── firestore.indexes.json         # 🆕 Firestore composite indexes
└── 000-docs/                      # ALL project documentation (168 files)
```

## Environment Variables

Required environment variables (see `.env.example`):

**Firebase Configuration (Primary):**
```bash
# Client-side (public)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hustleapp-production.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hustleapp-production"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hustleapp-production.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="335713777643"
NEXT_PUBLIC_FIREBASE_APP_ID="1:335713777643:web:..."

# Server-side (private)
FIREBASE_PROJECT_ID="hustleapp-production"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@hustleapp-production.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Legacy (PostgreSQL + NextAuth) - Being phased out:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/hustle_mvp"
NEXTAUTH_SECRET="your-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

**App Configuration:**
```bash
NODE_ENV="development"
NEXT_PUBLIC_API_DOMAIN="http://localhost:3000"
NEXT_PUBLIC_WEBSITE_DOMAIN="http://localhost:3000"
```

**Services:**
```bash
# Email (Resend)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="Your App <noreply@yourdomain.com>"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@sentry.io/project-id"
SENTRY_AUTH_TOKEN="your-auth-token"

# Google Cloud Platform
GOOGLE_CLOUD_PROJECT="hustleapp-production"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Port Configuration**:
- Dev server runs on default Next.js port **3000**
- Note: `.env.example` template shows 4000, but actual dev server uses 3000
- Update `NEXTAUTH_URL` and `NEXT_PUBLIC_*_DOMAIN` vars to use port 3000 in local `.env`

## Testing Strategy

**Test Framework Setup**
- Unit tests: Vitest with @testing-library/react
- E2E tests: Playwright with multiple browsers (Chromium, Firefox, WebKit)
- Coverage: @vitest/coverage-v8
- Mocking: MSW (Mock Service Worker) for API mocking

**Test Organization**
- Unit tests: `src/__tests__/` and co-located `*.test.ts` files
- E2E tests: `tests/e2e/` with auth, dashboard flows
- Test utilities: `vitest.setup.ts`, `playwright.config.ts`

**Running Specific Tests**
```bash
# Run single test file
npx vitest run src/lib/game-utils.test.ts

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run single Playwright spec
npx playwright test tests/e2e/auth.spec.ts

# Debug specific test
npx playwright test --debug tests/e2e/auth.spec.ts
```

## Deployment Configuration

### Primary: Firebase Hosting + Cloud Functions
- **Project**: `hustleapp-production` (GCP project ID)
- **Hosting**: Firebase Hosting (static assets + SSR via Cloud Run)
- **Functions**: Firebase Cloud Functions (Node.js 20)
- **Region**: `us-central1`
- **Database**: Firestore with composite indexes
- **Auth**: Firebase Authentication (Email/Password)
- **Deployment**: `firebase deploy` or GitHub Actions (`deploy-firebase.yml`)

### Legacy: Google Cloud Run (Staging)
- **Service**: `hustle-staging` in `hustle-dev-202510` project
- **Database**: Cloud SQL PostgreSQL with private IP (being phased out)
- **Secrets**: Google Secret Manager
- **Authentication**: Workload Identity Federation (no service account keys)

### Docker Build (Legacy)
- Multi-stage build in `Dockerfile`
- Base image: node:22-alpine
- Prisma Client generation in build stage
- Runs on port 8080 in container
- Non-root user (nextjs:nodejs)

### GitHub Actions Workflows
Nine automated workflows in `.github/workflows/`:
1. **ci.yml** - Tests, linting, type checking on every push
2. **deploy-firebase.yml** - 🆕 Firebase Hosting + Cloud Functions deployment
3. **deploy-vertex-agents.yml** - 🆕 Vertex AI Agent Engine deployment
4. **deploy.yml** - Cloud Run deployment (staging, legacy)
5. **assemble.yml** - NWSL video generation pipeline (CI-only, WIF)
6. **release.yml** - Version releases and changelogs
7. **auto-fix.yml** - Automated code formatting
8. **branch-protection.yml** - PR checks enforcement
9. **pages.yml** - GitHub Pages deployment

## Important Development Notes

### Critical Migration Context

**PHASE 1 GO-LIVE TRACK (8 Tasks)**

**Current Status**: Step 1 complete, executing tasks 2-8

**Completed**:
- ✅ Step 1: Local Firebase Auth + Firestore wiring verified (`000-docs/189`)
- ✅ Firebase Admin SDK integration
- ✅ Environment variables configured for local dev
- ✅ A2A agents deployed and tested

**In Progress** (Phase 1, Tasks 2-8):
1. **Task 2**: Update `/register` route handler
2. **Task 3**: Deploy to staging, verify end-to-end
3. **Task 4**: Update `/login` route handler
4. **Task 5**: Deploy staging, verify login flow
5. **Task 6**: Update dashboard pages for Firebase Auth
6. **Task 7**: Full staging deployment + testing
7. **Task 8**: Production deployment + legacy cleanup

**Critical Rules**:
- **Do NOT**: Make breaking changes to Prisma schema during migration
- **Do NOT**: Delete Firebase services or configuration files
- **Test locally first**: Use `npm run dev` + Firebase emulators before staging deploy
- **Staging gate**: Every task must pass staging verification before proceeding

### Database Workflow (Dual Database Period)

**Primary (Firestore):**
- Use Firebase services in `src/lib/firebase/services/`
- Deploy security rules: `firebase deploy --only firestore`
- Deploy indexes: Automatically via `firestore.indexes.json`
- Test locally: `firebase emulators:start`

**Legacy (Prisma + PostgreSQL):**
- Always run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for schema changes (creates migration + applies)
- Migrations committed to Git and run in production
- **Being phased out**: Avoid new features on Prisma models

### Authentication (Dual Auth Period)

**Current (NextAuth v5):**
- Email verification required before login
- Password reset uses time-limited tokens
- JWT sessions (30-day expiry)

**Target (Firebase Auth):**
- Waiting for Email/Password provider enable
- Custom claims for role-based access
- Integrated with Firestore security rules

### COPPA Compliance (Unchanged)
- User model tracks `agreedToTerms`, `agreedToPrivacy`, `isParentGuardian`
- Players are child profiles linked to parent User accounts
- All player data cascade deletes when parent User is deleted
- **Applies to both**: Prisma and Firestore schemas

### Build System
- **Turbopack**: Next.js 15's bundler (replaces Webpack)
- Development: `npm run dev` uses `--turbopack` flag
- Production: `npm run build` uses `--turbopack` flag
- Docker: Multi-stage build with Prisma generation (legacy)

### Vertex AI Agent System (A2A)
- **Orchestrator**: `hustle-operations-manager` coordinates all operations
- **Sub-Agents**: Validation, User Creation, Onboarding, Analytics
- **Communication**: Cloud Functions → A2A protocol → Agents
- **Deployment**: Manual Console setup required first
- **Testing**: Use Cloud Functions emulator (`npm --prefix functions run serve`)

### NWSL Video Pipeline (CI-Only)
- **Enforcement**: `gate.sh` blocks all local execution
- **Trigger**: GitHub Actions workflow only (Workload Identity Federation)
- **Canon Files**: 8 markdown specs in `nwsl/0000-docs/004-DR-REFF-veo-seg-*.md`
- **Output**: 8×8s segments + 4s end card = 68s total
- **Critical**: Veo 3.0 requires EXPLICIT soccer context (offices by default)

## Troubleshooting

### Firebase Issues
```bash
# Check Firestore emulator
firebase emulators:start --only firestore

# View Firestore data (production)
# Go to: Firebase Console → Firestore Database

# Check Cloud Functions logs
firebase functions:log --limit=50

# Deploy specific Firebase component
firebase deploy --only hosting        # Next.js app
firebase deploy --only functions      # Cloud Functions
firebase deploy --only firestore      # Rules + indexes

# Fix Firebase initialization errors
# 1. Check FIREBASE_PRIVATE_KEY has proper \n escape sequences
# 2. Verify NEXT_PUBLIC_FIREBASE_* vars are set
# 3. Restart dev server after .env changes
```

### Database Issues (Legacy Prisma)
```bash
# Reset PostgreSQL database (WARNING: deletes all data)
npx prisma migrate reset

# Check database connection
npx prisma db pull

# View/edit data visually
npx prisma studio

# Check migration status
npx prisma migrate status

# Fix "client out of sync" error
npx prisma generate

# Migration script troubleshooting
npx tsx 05-Scripts/migration/migrate-to-firestore.ts --dry-run  # Preview migration
```

### Authentication Issues
```bash
# NextAuth (legacy)
npx prisma studio  # Open users table, check emailVerified column

# Firebase Auth (target)
# Go to: Firebase Console → Authentication → Users
# Check if Email/Password provider is enabled

# Check active session
# Browser DevTools → Application → Cookies → next-auth.session-token (NextAuth)
# Browser DevTools → Application → Local Storage → firebase:authUser (Firebase)
```

### Vertex AI Agent Issues
```bash
# Check agent deployment status
gcloud alpha agent-engine agents list --location=us-central1 \
  --project=hustleapp-production

# View agent logs
gcloud alpha agent-engine agents describe hustle-operations-manager \
  --location=us-central1 --project=hustleapp-production

# Test A2A protocol locally
cd functions && npm run serve
# Make POST request to orchestrateTask function
curl -X POST http://localhost:5001/hustleapp-production/us-central1/orchestrateTask \
  -H "Content-Type: application/json" \
  -d '{"task": "validate_user", "data": {"email": "test@example.com"}}'
```

### Build/Deploy Issues
```bash
# Test production build locally
npm run build
npm start

# Check Firebase Hosting deployment
firebase hosting:channel:deploy preview-branch
# Visit: https://hustleapp-production--preview-branch.web.app

# Check Cloud Run logs (staging)
gcloud run services logs read hustle-staging --limit=50 --region us-central1

# Check service status
gcloud run services describe hustle-staging --region us-central1

# Test deployed service health
curl -I https://hustle-staging-[hash].a.run.app/api/healthcheck
```

### NWSL Pipeline Issues
```bash
# NWSL pipeline runs in CI only - check GitHub Actions logs
# Go to: Actions tab → "Assemble NWSL Documentary" → Select run → View logs

# Check WIF authentication (in CI logs)
gcloud auth list --filter=status:ACTIVE

# Verify canon files exist
ls -la nwsl/0000-docs/*-DR-REFF-veo-seg-*.md  # Should show 8 files (004-011)

# Check segment generation status
cd nwsl && ./050-scripts/monitor_segments.sh

# Download ready segments
cd nwsl && ./050-scripts/download_ready_segments.sh

# Common issues:
# 1. "office/boardroom" videos: Add explicit soccer context to prompts
# 2. Segments not downloading: Wait 90-120 seconds, check cloud storage
# 3. WIF auth fails: Verify GitHub Actions secrets are set correctly
```

## Documentation Policy

**CRITICAL: Single Documentation Directory**

This project uses a single flat documentation directory:

- **ONLY 000-docs/** exists for ALL documentation
- **NO claudes-docs/** or any other doc folders
- **NO subdirectories** within 000-docs/
- **All AI-generated docs** go in 000-docs/ with proper naming
- **Format:** `NNN-CC-ABCD-description.ext` (Document Filing System v2.0)

Current status: **190+ documents** in 000-docs/ (sequences 001-190)

**Key Current Documents:**
- `190-PP-PLAN-phase1-go-live-track.md` - Phase 1 execution plan (8 tasks)
- `189-AA-SUMM-hustle-step-1-auth-wiring-complete.md` - Step 1 completion summary
- `190-AA-MAAR-hustle-env-firebase-local-unblock.md` - Local Firebase environment setup
- `188-AA-MAAR-hustle-auth-wiring-staging-e2e.md` - Staging deployment guide
- `185-AA-AUDT-appaudit-devops-playbook.md` - DevOps playbook from appaudit
- `174-LS-STAT-firebase-a2a-deployment-complete.md` - A2A agent deployment status
- `173-OD-DEPL-vertex-ai-a2a-deployment-guide.md` - A2A deployment instructions

## Coding Standards & Conventions

**From AGENTS.md (Repository Guidelines):**

### Module Organization
- **Routes**: `src/app` for Next.js App Router pages and server actions
- **Components**: `src/components` for composable UI (shadcn/ui in `ui/`)
- **Services**: `src/lib` for shared utilities, Firebase services, auth
- **Types**: `src/types` and `src/schema` for domain contracts
- **Tests**: `src/__tests__` for Vitest, `tests/e2e` for Playwright
- **Infrastructure**: `06-Infrastructure` for Docker, Terraform
- **CI/CD**: `.github/workflows` for GitHub Actions

### Coding Style
- **TypeScript**: 2-space indentation, functional patterns, server components preferred
- **React**: PascalCase for components, camelCase for utilities, kebab-case for `src/app` files
- **Tailwind**: Utility classes grouped: layout → color → state
- **ESLint**: Auto-fix with `npm run lint -- --fix`
- **Type Safety**: Environment modules via `src/env.mjs` (if exists)

### Testing Guidelines
- **Unit Tests**: Vitest specs beside code in `src/__tests__`, `*.test.ts` suffix
- **E2E Tests**: Playwright in `tests/e2e`, descriptive filenames (`player-stats.spec.ts`)
- **Coverage**: Aim for 80%+ on critical services
- **Mock Data**: `tests/mocks` for API contracts
- **Screenshots**: Include Playwright screenshots for regressions

### Commit Standards
- **Format**: Conventional Commits (`feat(firebase): message`)
- **Issues**: Reference Jira/GitHub issues in body
- **Cleanup**: Squash fixups before pushing
- **PR Requirements**:
  - Summarize intent
  - List test commands executed
  - Attach UI screenshots for visible changes
  - Request review from domain owners for `functions/` or Terraform

### Security & Configuration
- **Never commit secrets**: Use `.env.example` template, populate `.env` locally
- **Validation**: `src/env.mjs` validates at runtime (if exists)
- **Firebase/Prisma**: Sync credentials with Google Cloud Secret Manager
- **Pre-Deploy**: Run `npm run lint`, `npm run test`, and CI workflow dry-run

### Specific to This Project
- **Firebase First**: Prefer Firebase services over Prisma during migration
- **No Breaking Prisma Changes**: Avoid during migration period
- **A2A Protocol**: Use Cloud Functions for agent communication
- **NWSL CI-Only**: Never run video generation locally (enforced by `gate.sh`)
- **WIF Only**: No service account keys, use Workload Identity Federation