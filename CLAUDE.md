# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for New Contributors

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and configure Firebase credentials
cp .env.example .env
# Edit .env with your Firebase credentials from Firebase Console

# 3. Start development server
npm run dev
# Visit http://localhost:3000

# 4. Run tests to verify setup
npm run test:unit
npm run test:e2e
```

## Project Overview

Hustle is a youth soccer statistics tracking application with three integrated systems:
1. **Core App**: Next.js 15 web application with Firebase/Firestore backend
2. **Vertex AI Agents**: Multi-agent A2A system for operations orchestration
3. **NWSL Video Pipeline**: CI-only video generation using Vertex AI Veo 3.0 and Lyria

**Live Site**: https://hustlestats.io
**GitHub**: https://github.com/jeremylongshore/hustle
**Tagline**: Performance data recruiters trust

## Technology Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5.x, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Firebase Cloud Functions (Node.js 20)
- **Database**: Firestore (exclusively - PostgreSQL decommissioned Phase 2)
- **Authentication**: Firebase Auth (NextAuth removed Phase 1)
- **AI/ML**: Vertex AI Agent Engine with A2A protocol, Veo 3.0, Lyria, Imagen 3
- **Testing**: Vitest (unit), Playwright (e2e), Testing Library, Synthetic QA Harness
- **Deployment**: Firebase Hosting + Cloud Run (staging), GitHub Actions + WIF
- **Monitoring**: Google Cloud Error Reporting, Cloud Logging (Sentry removed Phase 1)
- **Billing**: Stripe integration with workspace-based subscription tiers

## Migration Status (November 2025)

**✅ PHASE 1 COMPLETE: Clean Auth + Clean Observability**

- ✅ Firebase project setup (`hustleapp-production`)
- ✅ Sentry removed ($26-99/mo savings)
- ✅ NextAuth v5 removed (Firebase Auth only)
- ✅ Firestore schema, services, and security rules deployed
- ✅ Firebase Admin SDK integrated (`src/lib/firebase/`)
- ✅ GCP-native observability (Error Reporting, Cloud Logging)
- ✅ Build compiles successfully (zero import errors)

**✅ PHASE 2 COMPLETE: Data Migration & Killing PostgreSQL**

- ✅ Firestore schema made compatible (workspaceId optional)
- ✅ Data migration verified (57/58 users already in Firebase)
- ✅ PostgreSQL Docker container stopped and removed
- ✅ Prisma dependencies removed from package.json (31 packages)
- ✅ Prisma directory archived (`99-Archive/20251118-prisma-legacy/`)
- ✅ .env.example updated (DATABASE_URL commented out)
- ✅ Zero Prisma imports in codebase

**✅ GITHUB RELEASE COMPLETE (v1.0.0)**

- ✅ Professional README.md with badges, Mermaid diagrams, architecture docs
- ✅ GitHub Pages site deployed (`docs/index.html`)
- ✅ Repository made public with 10 topics
- ✅ v1.0.0 release created with comprehensive CHANGELOG.md
- ✅ Intent Solutions IO branding added
- ✅ Vertex AI Agent Engine telemetry and monitoring highlighted
- ✅ All CI/CD ESLint errors fixed (type safety, unused variables)
- ✅ Documentation: `000-docs/245-AA-SUMM-github-release-preparation.md`

**Phase Status:**
- Phase 1 AAR: `000-docs/236-AA-REPT-hustle-phase-1-auth-observability-migration.md`
- Phase 2 AAR: `000-docs/[pending]`
- GitHub Release: `000-docs/245-AA-SUMM-github-release-preparation.md`
- Next: Phase 3 (Monitoring, Alerts, Agent Deployment Automation)

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
npm run smoke-test         # Quick smoke tests for critical flows
npm run qa:e2e             # QA E2E tests (Chromium only)
npm run qa:e2e:smoke       # QA smoke tests (login + user journey)

# Linting & Type Checking
npm run lint               # Run ESLint
npx tsc --noEmit          # TypeScript type check (no build output)

# Build
npm run build             # Production build with Turbopack
npm start                 # Start production server
```

### Running Specific Tests
```bash
# Run single test file
npx vitest run src/lib/game-utils.test.ts

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run single Playwright spec
npx playwright test 03-Tests/e2e/01-authentication.spec.ts

# Run specific test suite
npx playwright test 03-Tests/e2e/auth/

# Debug specific test
npx playwright test --debug 03-Tests/e2e/01-authentication.spec.ts

# Run runtime verification tests
npm run test:runtime:workspace
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

# Test A2A with helper script
cd vertex-agents && ./test_a2a.sh
```

### Synthetic QA & Logo Generation
```bash
# Trigger synthetic QA harness (CI-only)
# GitHub Actions → "Synthetic QA Harness" → Run workflow

# Trigger logo generation with Imagen 3 (CI-only)
# GitHub Actions → "Generate Logos with Imagen 3" → Run workflow
# Uses prompts from 000-docs/246-DC-DESN-logo-generation-prompts.md
```

## Architecture & Key Patterns

### Three-System Architecture

**1. Core Web Application**
- Next.js 15 App Router with React Server Components
- Firebase Hosting for static assets + Cloud Run for SSR
- Firestore for real-time data with hierarchical subcollections
- Firebase Auth for authentication (replacing NextAuth)
- Workspace-based multi-tenancy with Stripe billing integration

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

**4. Logo Generation System (CI-Only)**
- **Image Generation**: Vertex AI Imagen 3 API
- **Prompts**: Defined in `000-docs/246-DC-DESN-logo-generation-prompts.md`
- **Canon**: Intent Solutions IO branding specs in `000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md`
- **Workflow**: GitHub Actions `generate-logos.yml` with WIF authentication

### Firestore Data Model (Primary Database)

**Hierarchical Structure:**
```
/users/{userId}                    # User profile + COPPA compliance
  /players/{playerId}              # Child players (subcollection)
    /games/{gameId}                # Game statistics (nested subcollection)
/waitlist/{email}                  # Early access signups
/emailLogs/{logId}                 # Email delivery logs (Cloud Functions only)
```

**Services** (`src/lib/firebase/services/`):
- `users.ts` - User CRUD operations
- `players.ts` - Player CRUD with subcollections
- `games.ts` - Game CRUD with filtering/verification
- `waitlist.ts` - Waitlist signup management

**Admin Services** (`src/lib/firebase/admin-services/`):
- `users.ts` - Server-side user operations
- `players.ts` - Server-side player operations
- `games.ts` - Server-side game operations

**Security**: `firestore.rules` enforces parent-child ownership, read/write permissions, email verification requirements

### Workspace & Billing System

**Multi-Tenancy Model:**
- Each user belongs to a workspace (individual or team-based)
- Workspace-based resource limits (players, games per month)
- Three subscription tiers: Starter, Plus, Pro

**Stripe Integration:**
- Subscription management via Stripe API
- Webhook handling for payment events (`src/app/api/webhooks/stripe/route.ts`)
- Billing dashboard at `/dashboard/settings/billing`
- Feature flag: `BILLING_ENABLED` for maintenance mode

**Access Control** (`src/lib/firebase/access-control.ts`):
- `canCreatePlayer()` - Check if workspace can add more players
- `canLogGame()` - Verify game logging quota
- `getWorkspaceStatus()` - Current subscription status

**Plan Limits** (`src/lib/stripe/plan-mapping.ts`):
- Starter: 2 players, 10 games/month
- Plus: 5 players, 50 games/month
- Pro: Unlimited players & games

### Legacy Systems (Decommissioned)

**PostgreSQL + Prisma**: Decommissioned in Phase 2 (2025-11-18)
- 57/58 users migrated to Firebase Auth + Firestore
- Prisma archived: `99-Archive/20251118-prisma-legacy/`
- Docker container stopped and removed
- Zero Prisma imports in codebase

**NextAuth v5**: Removed in Phase 1 (2025-11-18)
- Replaced with Firebase Auth
- Session tables and middleware removed
- All auth flows now use Firebase SDK

### Authentication (Firebase Auth)

**Current Implementation**:
- Email/Password provider (requires Console enable)
- Firebase Authentication SDK (client + Admin SDK)
- ID token-based sessions (1-hour expiry, auto-refresh)
- Custom claims for role-based access
- Integrated with Firestore security rules
- Server-side: `src/lib/auth.ts` verifies ID tokens
- Client-side: `src/hooks/useAuth.ts` React hook for auth state

### API Route Structure

All routes in `src/app/api/` follow Next.js 15 App Router conventions:
- Route handlers export GET/POST/PUT/DELETE functions
- Authentication via Firebase Admin SDK token verification
- Zod schema validation in `src/lib/validations/`
- Error responses use standardized JSON format

**Key Routes:**
- `/api/players/*` - Player CRUD operations
- `/api/games/*` - Game statistics management (placeholder, not yet implemented)
- `/api/waitlist/*` - Waitlist signup handling
- `/api/verify/*` - Email verification
- `/api/webhooks/stripe/*` - Stripe webhook handling
- `/api/workspace/current/*` - Workspace status queries
- `/api/health/*` - Health check endpoint

### Component Organization

- **Server Components**: Default for Next.js 15 App Router
- **Client Components**: Marked with `'use client'` directive
- **UI Components**: `src/components/ui/` (shadcn/ui)
- **Layout Components**: `src/components/layout/` (header, sidebar, page-container)
- **Dashboard**: `src/app/dashboard/` (auth-protected pages)
- **Layouts**: `src/app/layout.tsx` (root), `src/app/dashboard/layout.tsx` (dashboard)

## Project Structure

```
hustle/
├── src/                           # Source code root
│   ├── app/                       # Next.js 15 App Router
│   │   ├── api/                   # API route handlers
│   │   │   ├── players/           # Player CRUD
│   │   │   ├── waitlist/          # Waitlist signups
│   │   │   ├── verify/            # Email verification
│   │   │   ├── webhooks/stripe/   # Stripe webhook handling
│   │   │   ├── workspace/         # Workspace queries
│   │   │   └── health/            # Health check
│   │   ├── dashboard/             # Dashboard pages (auth-protected)
│   │   │   ├── athletes/          # Player management
│   │   │   ├── games/             # Game statistics
│   │   │   ├── analytics/         # Performance analytics
│   │   │   ├── profile/           # User profile
│   │   │   └── settings/          # Settings (billing, account)
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   ├── forgot-password/       # Password reset flow
│   │   ├── verify-email/          # Email verification
│   │   ├── privacy/               # Privacy policy
│   │   ├── terms/                 # Terms of service
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   └── layout/                # Layout components (header, sidebar)
│   ├── lib/                       # Core utilities
│   │   ├── firebase/              # Firebase integration
│   │   │   ├── config.ts          # Client SDK config (DEPRECATED - use auth.ts)
│   │   │   ├── auth.ts            # Client-side Firebase Auth
│   │   │   ├── admin.ts           # Admin SDK config
│   │   │   ├── admin-auth.ts      # Server-side auth verification
│   │   │   ├── access-control.ts  # Workspace access control
│   │   │   ├── services/          # Firestore CRUD (client-side)
│   │   │   └── admin-services/    # Firestore CRUD (server-side)
│   │   ├── stripe/                # Stripe integration
│   │   │   └── plan-mapping.ts    # Subscription plan definitions
│   │   ├── workspaces/            # Workspace utilities
│   │   │   └── guards.ts          # Workspace access guards
│   │   ├── auth.ts                # Legacy auth utilities (transitioning)
│   │   ├── email.ts               # Resend email service
│   │   ├── email-templates.ts     # Email HTML templates
│   │   ├── logger.ts              # Google Cloud Logging
│   │   ├── utils.ts               # General utilities (cn, etc.)
│   │   ├── player-utils.ts        # Player-specific utilities
│   │   ├── game-utils.ts          # Game statistics utilities
│   │   ├── monitoring/            # Monitoring & observability
│   │   │   └── events.ts          # Event tracking
│   │   └── validations/           # Zod schemas
│   │       └── game-schema.ts     # Game validation schema
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Firebase Auth hook
│   │   ├── useWorkspaceAccess.ts  # Workspace access hook
│   │   └── use-mobile.tsx         # Mobile detection hook
│   ├── types/                     # TypeScript type definitions
│   ├── schema/                    # Additional schemas
│   │   └── diagpro.report.schema.json  # DiagnosticPro report schema (legacy)
│   ├── prompts/                   # AI prompts
│   │   ├── vertex.system.txt      # Vertex AI system prompt
│   │   └── vertex.user.template.txt  # Vertex AI user prompt template
│   ├── __tests__/                 # Unit tests
│   │   ├── lib/                   # Library tests
│   │   └── api/                   # API route tests
│   └── env.mjs                    # Environment variable validation
├── functions/                     # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts               # Function exports
│   │   └── a2a-client.ts          # Vertex AI A2A protocol client
│   └── package.json               # Node.js 20 dependencies
├── vertex-agents/                 # Vertex AI Agent Engine (A2A)
│   ├── orchestrator/              # Orchestrator agent config
│   │   ├── config/
│   │   │   ├── agent.yaml         # Agent configuration
│   │   │   └── agent-card.json    # A2A agent card
│   │   └── src/
│   │       └── orchestrator_agent.py  # Agent implementation
│   ├── deploy_agent.sh            # Agent deployment script
│   ├── test_a2a.sh                # A2A protocol testing script
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
├── 05-Scripts/                    # Utility scripts
│   ├── migration/
│   │   └── migrate-to-firestore.ts    # PostgreSQL → Firestore migration
│   └── seed-staging.ts            # Seed staging environment with test data
├── 06-Infrastructure/
│   ├── docker/                    # Docker Compose for local PostgreSQL (legacy)
│   └── terraform/                 # Cloud Run infrastructure
├── 03-Tests/                      # Test suites & QA infrastructure
│   ├── e2e/                       # Playwright E2E tests
│   │   ├── auth/                  # Authentication tests (01-registration, 02-login)
│   │   ├── 01-authentication.spec.ts  # Auth flow tests
│   │   ├── 02-dashboard.spec.ts   # Dashboard tests
│   │   ├── 03-player-management.spec.ts  # Player CRUD tests
│   │   ├── 04-complete-user-journey.spec.ts  # End-to-end user journey
│   │   └── 05-login-healthcheck.spec.ts  # Login health check
│   ├── mocks/                     # Mock data (A-H.json)
│   ├── scripts/                   # QA automation scripts
│   │   ├── length_guard.sh        # Test length validation
│   │   ├── confidence_guard.sh    # Confidence threshold checks
│   │   ├── readiness_guard.sh     # Deployment readiness checks
│   │   ├── validate_schema.sh     # Schema validation
│   │   └── run_vertex_once.js     # Single Vertex AI invocation
│   ├── runtime/                   # Runtime verification tests
│   │   └── verify-workspace-status.ts  # Workspace status verification
│   ├── results/                   # Test result artifacts (screenshots, videos)
│   └── test-results.json          # Test execution results
├── tests/                         # Additional test directory (DEPRECATED)
│   └── e2e/                       # Legacy E2E location (use 03-Tests/e2e instead)
├── .github/workflows/             # GitHub Actions (13 workflows)
│   ├── ci.yml                     # Continuous integration
│   ├── deploy.yml                 # Cloud Run deployment (staging)
│   ├── deploy-firebase.yml        # Firebase Hosting + Functions
│   ├── deploy-vertex-agents.yml   # Vertex AI agent deployment
│   ├── deploy-prod.yml            # Production deployment (manual trigger)
│   ├── assemble.yml               # NWSL video assembly (CI-only, WIF)
│   ├── generate-logos.yml         # Logo generation with Imagen 3
│   ├── synthetic-qa.yml           # Synthetic QA harness (autonomous)
│   ├── release.yml                # Version releases and changelogs
│   ├── auto-fix.yml               # Automated code formatting
│   ├── branch-protection.yml      # PR checks enforcement
│   └── pages.yml                  # GitHub Pages deployment
├── firebase.json                  # Firebase configuration
├── firestore.rules                # Firestore security rules
├── firestore.indexes.json         # Firestore composite indexes
├── middleware.ts                  # Next.js middleware (currently minimal)
├── 000-docs/                      # ALL project documentation (190+ files)
├── 99-Archive/                    # Archived legacy code
│   └── 20251118-prisma-legacy/    # Archived Prisma/PostgreSQL code
├── docs/                          # GitHub Pages site
│   └── index.html                 # Generated documentation site
├── README.md                      # Public project overview
├── CLAUDE.md                      # This file - technical guide for Claude
├── AGENTS.md                      # Repository guidelines & coding standards
└── CHANGELOG.md                   # Version history
```

## Test Organization

**Two Test Directories:**
1. **`03-Tests/`** - Primary test directory (QA infrastructure, E2E, mocks, scripts)
2. **`tests/`** - Legacy location (DEPRECATED, use `03-Tests/` instead)

**E2E Test Structure** (`03-Tests/e2e/`):
- `auth/` - Isolated auth tests (registration, login)
- `01-authentication.spec.ts` - Complete auth flow tests
- `02-dashboard.spec.ts` - Dashboard functionality tests
- `03-player-management.spec.ts` - Player CRUD tests with security checks
- `04-complete-user-journey.spec.ts` - Full user journey (Register → Add Player → Log Game → View Stats)
- `05-login-healthcheck.spec.ts` - Quick login smoke test

**Unit Tests** (`src/__tests__/`):
- Co-located with source code
- `*.test.ts` suffix
- Vitest + Testing Library
- Coverage tracking via `npm run test:coverage`

**QA Automation Scripts** (`03-Tests/scripts/`):
- `length_guard.sh` - Validate test duration limits
- `confidence_guard.sh` - Check test confidence thresholds
- `readiness_guard.sh` - Pre-deployment checks
- `validate_schema.sh` - Schema validation
- `run_vertex_once.js` - Single Vertex AI API call

**Mock Data** (`03-Tests/mocks/`):
- JSON files (A-H.json) for API contract mocking
- Used by Playwright tests via MSW (Mock Service Worker)

## Environment Variables

Required environment variables (see `.env.example`):

**Firebase Configuration (Primary):**
```bash
# Client-side (public - safe to commit example values)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDviqCSH3GDsT2zHScYV-fCzpc0UU__2Wo"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hustleapp-production.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hustleapp-production"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hustleapp-production.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="335713777643"
NEXT_PUBLIC_FIREBASE_APP_ID="1:335713777643:web:209e728afd5aee07c80bae"

# Server-side (private - NEVER commit actual values)
FIREBASE_PROJECT_ID="hustleapp-production"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@hustleapp-production.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**App Configuration:**
```bash
NODE_ENV="development"
NEXT_PUBLIC_API_DOMAIN="http://localhost:3000"
NEXT_PUBLIC_WEBSITE_DOMAIN="http://localhost:3000"
```

**Google Cloud Platform:**
```bash
GOOGLE_CLOUD_PROJECT="hustleapp-production"
GCP_PROJECT="hustleapp-production"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"  # Local dev only
LOG_RETENTION_DAYS="30"  # Optional custom log retention
```

**Email (Resend):**
```bash
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="Hustle <noreply@hustlestats.io>"
```

**Stripe Billing:**
```bash
# API Keys (test mode for development, live mode for production)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Price IDs (from Stripe Dashboard → Products)
STRIPE_PRICE_ID_STARTER="price_test_starter_placeholder"
STRIPE_PRICE_ID_PLUS="price_test_plus_placeholder"
STRIPE_PRICE_ID_PRO="price_test_pro_placeholder"

# Feature Flag (maintenance mode)
BILLING_ENABLED="true"  # Set to "false" to disable Stripe operations
```

**Port Configuration**:
- Dev server runs on default Next.js port **3000**
- Note: `.env.example` template shows 4000, but actual dev server uses 3000
- Update `NEXT_PUBLIC_*_DOMAIN` vars to use port 3000 in local `.env`

## Testing Strategy

**Test Framework Setup**
- Unit tests: Vitest with @testing-library/react
- E2E tests: Playwright with multiple browsers (Chromium, Firefox, WebKit)
- Coverage: @vitest/coverage-v8
- Mocking: MSW (Mock Service Worker) for API mocking
- QA Harness: Synthetic autonomous testing (Layer 1)

**Test Organization**
- Unit tests: `src/__tests__/` and co-located `*.test.ts` files
- E2E tests: `03-Tests/e2e/` with auth, dashboard, player management flows
- Test utilities: `vitest.setup.ts`, `playwright.config.ts`
- QA scripts: `03-Tests/scripts/` for validation gates

**Running Specific Tests**
```bash
# Run single test file
npx vitest run src/lib/game-utils.test.ts

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run single Playwright spec
npx playwright test 03-Tests/e2e/01-authentication.spec.ts

# Run auth test suite
npx playwright test 03-Tests/e2e/auth/

# Debug specific test
npx playwright test --debug 03-Tests/e2e/03-player-management.spec.ts

# Run smoke tests only
npm run qa:e2e:smoke
```

**Synthetic QA Harness (Layer 1 - Autonomous)**
- **Location**: `.github/workflows/synthetic-qa.yml`
- **Trigger**: Manual GitHub Actions workflow
- **Description**: Autonomous QA system that runs comprehensive test suites
- **Documentation**: `000-docs/` (implementation plan and tracking docs)
- **Status**: Implemented, production-ready

## Deployment Configuration

### Primary: Firebase Hosting + Cloud Functions
- **Project**: `hustleapp-production` (GCP project ID)
- **Hosting**: Firebase Hosting (static assets + SSR via Cloud Run)
- **Functions**: Firebase Cloud Functions (Node.js 20)
- **Region**: `us-central1`
- **Database**: Firestore with composite indexes
- **Auth**: Firebase Authentication (Email/Password)
- **Deployment**: `firebase deploy` or GitHub Actions (`deploy-firebase.yml`)
- **URL**: https://hustleapp-production.web.app (redirects to hustlestats.io)

### Legacy: Google Cloud Run (Staging)
- **Service**: `hustle-staging` in `hustle-dev-202510` project
- **Database**: Cloud SQL PostgreSQL with private IP (being phased out)
- **Secrets**: Google Secret Manager
- **Authentication**: Workload Identity Federation (no service account keys)

### Docker Build (Legacy)
- Multi-stage build in `Dockerfile`
- Base image: node:22-alpine
- Prisma Client generation in build stage (legacy)
- Runs on port 8080 in container
- Non-root user (nextjs:nodejs)

### GitHub Actions Workflows

Thirteen automated workflows in `.github/workflows/`:

**Core CI/CD:**
1. **ci.yml** - Tests, linting, type checking on every push
2. **deploy-firebase.yml** - Firebase Hosting + Cloud Functions deployment
3. **deploy.yml** - Cloud Run deployment (staging, legacy)
4. **deploy-prod.yml** - Production deployment (manual trigger, requires "DEPLOY" confirmation)
5. **deploy-vertex-agents.yml** - Vertex AI Agent Engine deployment

**Specialized Pipelines:**
6. **assemble.yml** - NWSL video generation pipeline (CI-only, WIF)
7. **generate-logos.yml** - Logo generation with Imagen 3 (CI-only, WIF)
8. **synthetic-qa.yml** - Autonomous QA harness (manual trigger)

**Automation & Quality:**
9. **release.yml** - Version releases and changelogs
10. **auto-fix.yml** - Automated code formatting
11. **branch-protection.yml** - PR checks enforcement

**Documentation:**
12. **pages.yml** - GitHub Pages deployment

**All CI/CD uses Workload Identity Federation (WIF)** - no service account keys in GitHub Secrets.

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
- **Do NOT**: Make breaking changes to legacy systems during migration
- **Do NOT**: Delete Firebase services or configuration files
- **Test locally first**: Use `npm run dev` + Firebase emulators before staging deploy
- **Staging gate**: Every task must pass staging verification before proceeding

### Database Workflow (Firestore Only)

**Firestore Operations:**
- Use Firebase services in `src/lib/firebase/services/` (users, players, games, waitlist)
- Use admin services in `src/lib/firebase/admin-services/` for server-side operations
- Deploy security rules: `firebase deploy --only firestore`
- Deploy indexes: Automatically via `firestore.indexes.json`
- Test locally: `firebase emulators:start`
- Monitor: Firebase Console → Firestore Database

**No PostgreSQL/Prisma**: Decommissioned in Phase 2

### COPPA Compliance

Firebase Auth + Firestore implementation:
- User model tracks `agreedToTerms`, `agreedToPrivacy`, `isParentGuardian`
- Players are child profiles linked to parent User accounts (subcollections)
- All player data cascade deletes when parent User is deleted (Firestore rules)
- Email verification required for parent/guardian accounts

### Build System
- **Turbopack**: Next.js 15's bundler (replaces Webpack)
- Development: `npm run dev` uses `--turbopack` flag
- Production: `npm run build` uses `--turbopack` flag
- Docker: Multi-stage build with Prisma generation (legacy)

### Vertex AI Agent System (A2A)
- **Orchestrator**: `hustle-operations-manager` coordinates all operations
- **Sub-Agents**: Validation, User Creation, Onboarding, Analytics
- **Communication**: Cloud Functions → A2A protocol → Agents
- **Deployment**: Manual Console setup required first, then `./deploy_agent.sh all`
- **Testing**: Use Cloud Functions emulator (`npm --prefix functions run serve`)
- **Agent Card**: JSON configuration in `vertex-agents/orchestrator/config/agent-card.json`

### NWSL Video Pipeline (CI-Only)
- **Enforcement**: `gate.sh` blocks all local execution
- **Trigger**: GitHub Actions workflow only (Workload Identity Federation)
- **Canon Files**: 8 markdown specs in `nwsl/0000-docs/004-DR-REFF-veo-seg-*.md`
- **Output**: 8×8s segments + 4s end card = 68s total
- **Critical**: Veo 3.0 requires EXPLICIT soccer context (defaults to offices/boardrooms)
- **Workflow**: `.github/workflows/assemble.yml`

### Logo Generation System (CI-Only)
- **API**: Vertex AI Imagen 3 for image generation
- **Prompts**: Defined in `000-docs/246-DC-DESN-logo-generation-prompts.md`
- **Canon**: Intent Solutions IO branding in `000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md`
- **Workflow**: `.github/workflows/generate-logos.yml`
- **Auth**: WIF with GitHub Actions (no service account keys)
- **Summary**: `000-docs/248-AA-SUMM-imagen-logo-generation-ci-setup.md`

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

### Authentication Issues
```bash
# Firebase Auth
# Go to: Firebase Console → Authentication → Users
# Check if Email/Password provider is enabled

# Check active Firebase session
# Browser DevTools → Application → Local Storage → firebase:authUser

# Test Firebase Auth locally
firebase emulators:start --only auth

# Check Firebase Auth errors in logs
firebase functions:log --only=auth
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

# Or use helper script
cd vertex-agents && ./test_a2a.sh
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
curl -I https://hustle-staging-[hash].a.run.app/api/health
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

### Logo Generation Issues
```bash
# Logo generation runs in CI only - check GitHub Actions logs
# Go to: Actions tab → "Generate Logos with Imagen 3" → Select run → View logs

# Check WIF authentication (in CI logs)
gcloud auth list --filter=status:ACTIVE

# Verify prompt files exist
cat 000-docs/246-DC-DESN-logo-generation-prompts.md
cat 000-docs/247-DC-DESN-intent-solutions-logo-imagen-prompts.md

# Common issues:
# 1. API quota exceeded: Check GCP console for Imagen 3 quotas
# 2. WIF auth fails: Verify GitHub Actions secrets are set correctly
# 3. Low quality output: Refine prompts in markdown canon files
```

### Workspace & Billing Issues
```bash
# Check workspace status programmatically
npm run test:runtime:workspace

# View Stripe subscription status
# Stripe Dashboard → Customers → Search by email

# Check billing webhook logs
firebase functions:log --limit=50 | grep stripe

# Test billing locally (use Stripe test mode)
# Stripe Dashboard → Developers → Webhooks → Test webhook

# Common issues:
# 1. Plan limits not enforcing: Check access-control.ts logic
# 2. Webhook not firing: Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
# 3. BILLING_ENABLED=false: Check .env for feature flag
```

### Test Failures
```bash
# View Playwright test report
npm run test:report

# Check test artifacts (screenshots, videos)
ls -la 03-Tests/results/

# Run tests with verbose output
npx playwright test --debug

# Check test configuration
cat playwright.config.ts

# Common issues:
# 1. Timeout: Increase timeout in playwright.config.ts
# 2. Flaky tests: Add wait conditions, check network requests
# 3. Auth failures: Verify Firebase emulators are running
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
- `246-DC-DESN-logo-generation-prompts.md` - Logo generation prompts (Imagen 3)
- `247-DC-DESN-intent-solutions-logo-imagen-prompts.md` - Intent Solutions IO branding
- `248-AA-SUMM-imagen-logo-generation-ci-setup.md` - Logo generation CI setup summary

## Coding Standards & Conventions

**From AGENTS.md (Repository Guidelines):**

### Module Organization
- **Routes**: `src/app` for Next.js App Router pages and server actions
- **Components**: `src/components` for composable UI (shadcn/ui in `ui/`)
- **Services**: `src/lib` for shared utilities, Firebase services, auth
- **Types**: `src/types` and `src/schema` for domain contracts
- **Tests**: `src/__tests__` for Vitest, `03-Tests/e2e` for Playwright
- **Infrastructure**: `06-Infrastructure` for Docker, Terraform
- **CI/CD**: `.github/workflows` for GitHub Actions

### Coding Style
- **TypeScript**: 2-space indentation, functional patterns, server components preferred
- **React**: PascalCase for components, camelCase for utilities, kebab-case for `src/app` files
- **Tailwind**: Utility classes grouped: layout → color → state
- **ESLint**: Auto-fix with `npm run lint -- --fix`
- **Type Safety**: Environment modules via `src/env.mjs`

### Testing Guidelines
- **Unit Tests**: Vitest specs beside code in `src/__tests__`, `*.test.ts` suffix
- **E2E Tests**: Playwright in `03-Tests/e2e`, descriptive filenames (`player-management.spec.ts`)
- **Coverage**: Aim for 80%+ on critical services
- **Mock Data**: `03-Tests/mocks` for API contracts
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
- **Validation**: `src/env.mjs` validates at runtime
- **Firebase Credentials**: Sync with Google Cloud Secret Manager
- **Pre-Deploy**: Run `npm run lint`, `npm run test`, and CI workflow dry-run

### Specific to This Project
- **Firebase Only**: Use Firestore services exclusively (PostgreSQL decommissioned)
- **A2A Protocol**: Use Cloud Functions for agent communication
- **NWSL CI-Only**: Never run video generation locally (enforced by `gate.sh`)
- **Logo Generation CI-Only**: Never run Imagen 3 locally (enforced by workflow)
- **WIF Only**: No service account keys, use Workload Identity Federation
- **Workspace Access**: Always check workspace limits before allowing resource creation
- all work must follow google adk standards found at https://google.github.io/adk-docs/