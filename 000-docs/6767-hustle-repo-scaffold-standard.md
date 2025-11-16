# Hustle Repository Scaffold Standard

**Document Type:** Authoritative Specification
**Version:** 1.0
**Date:** 2025-11-15
**Status:** Active

---

## Purpose

This document defines the canonical directory structure for the Hustle youth sports platform repository. It establishes clear boundaries for where code, tests, scripts, assets, and infrastructure live to prevent scaffold drift and contributor confusion.

---

## Design Principles

1. **Single Documentation Root** - Only `000-docs/` for ALL documentation
2. **Standard Locations** - Respect Next.js/Firebase conventions (src/, public/, functions/)
3. **Numbered Meta Directories** - Use `0NN-` prefix ONLY for cross-cutting support directories
4. **Feature Isolation** - Large subsystems (vertex-agents, nwsl) live at root for visibility
5. **No Duplication** - One canonical location per concern (tests, scripts, infra, assets)
6. **Archive, Don't Delete** - Move deprecated/legacy items to `99-Archive/`, don't delete

---

## Target Directory Structure

```
hustle/
├── 000-docs/                      # ALL documentation (only docs root)
│   └── *.md                       # Flat structure, numbered 001-999
│
├── 03-Tests/                      # ALL automated tests
│   ├── e2e/                       # Playwright E2E tests
│   ├── unit/                      # Vitest unit tests
│   ├── mocks/                     # Test fixtures, MSW mocks
│   ├── scripts/                   # Test utilities
│   ├── results/                   # Playwright test artifacts
│   └── playwright-report/         # HTML test reports
│
├── 04-Assets/                     # Non-code assets (not served)
│   ├── design/                    # Design files, mockups
│   ├── templates/                 # Email templates, document templates
│   └── reference/                 # Reference images, diagrams
│
├── 05-Scripts/                    # Automation & utilities
│   ├── deployment/                # Deploy scripts (deploy.sh, etc.)
│   ├── setup/                     # Setup scripts (WIF, secrets, etc.)
│   ├── migration/                 # One-time migrations (Firestore, etc.)
│   ├── maintenance/               # Cleanup, optimization scripts
│   └── utilities/                 # General-purpose utilities
│
├── 06-Infrastructure/             # ALL infrastructure-as-code
│   ├── terraform/                 # Terraform IaC (main deployment)
│   │   ├── agents/                # Vertex AI agent configs
│   │   ├── environments/          # Dev/staging/prod
│   │   ├── modules/               # Reusable Terraform modules
│   │   └── schemas/               # BigQuery schemas (if any)
│   ├── docker/                    # Docker Compose, Dockerfiles
│   └── security/                  # Service accounts, credentials
│       └── credentials/           # .gitignored sensitive files
│
├── 07-Releases/                   # Release artifacts
│   ├── changelogs/                # Release notes
│   └── builds/                    # Tagged release builds (if stored)
│
├── 99-Archive/                    # Deprecated/legacy code
│   └── [dated subdirectories]    # Archived by date/migration phase
│
├── src/                           # Next.js app source code (standard)
│   ├── app/                       # Next.js 15 App Router
│   │   ├── api/                   # API routes
│   │   └── dashboard/             # Dashboard pages
│   ├── components/                # React components
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/                       # Core utilities, services
│   │   ├── firebase/              # Firebase SDK, Firestore services
│   │   └── validations/           # Zod schemas
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript types
│   ├── config/                    # App configuration
│   └── __tests__/                 # Co-located unit tests (optional)
│
├── functions/                     # Firebase Cloud Functions (standard)
│   ├── src/                       # TypeScript source
│   │   ├── index.ts               # Function exports
│   │   └── a2a-client.ts          # Vertex AI A2A client
│   ├── lib/                       # Compiled JavaScript (gitignored)
│   └── package.json               # Node.js 20 dependencies
│
├── vertex-agents/                 # Vertex AI A2A multi-agent system
│   ├── orchestrator/              # Main coordinator agent
│   ├── validation/                # Validation sub-agent
│   ├── user-creation/             # User creation sub-agent
│   ├── onboarding/                # Onboarding sub-agent
│   ├── analytics/                 # Analytics sub-agent
│   ├── deploy_agent.sh            # Agent deployment script
│   ├── test_a2a.sh                # A2A protocol tests
│   └── README.md                  # A2A system documentation
│
├── nwsl/                          # NWSL video pipeline (CI-only)
│   ├── 0000-docs/                 # Canon specs (8 segments: 004-011)
│   ├── 0000-images/               # Reference images
│   ├── 003-raw-segments/          # Downloaded video segments
│   ├── 007-logs/                  # Generation logs
│   ├── 050-scripts/               # Pipeline shell scripts
│   └── gate.sh                    # CI enforcement gate
│
├── prisma/                        # Prisma ORM (legacy, being phased out)
│   ├── schema.prisma              # PostgreSQL schema (8 models)
│   └── migrations/                # Prisma migrations
│
├── public/                        # Next.js public assets (standard)
│   ├── *.svg                      # Public SVG icons
│   └── uploads/                   # User-uploaded files
│
├── [config files at root]         # Standard tooling configs
│   ├── package.json               # npm dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── next.config.ts             # Next.js config
│   ├── firebase.json              # Firebase config
│   ├── firestore.rules            # Firestore security rules
│   ├── firestore.indexes.json     # Firestore indexes
│   ├── playwright.config.ts       # Playwright config
│   ├── vitest.config.mts          # Vitest config
│   ├── tailwind.config.ts         # Tailwind CSS config
│   ├── eslint.config.mjs          # ESLint config
│   ├── components.json            # shadcn/ui config
│   ├── Dockerfile                 # Production Docker image
│   ├── .env.example               # Environment variable template
│   ├── .gitignore                 # Git ignore rules
│   └── CLAUDE.md, AGENTS.md       # AI coding assistant context
│
└── [build artifacts - gitignored]
    ├── node_modules/              # npm dependencies
    ├── .next/                     # Next.js build cache
    └── functions/lib/             # Compiled Cloud Functions
```

---

## Directory Specifications

### 000-docs/ - Documentation Root

**Purpose:** Single source of truth for ALL project documentation
**Format:** Document Filing System v2.0 (`NNN-CC-ABCD-description.md`)
**Structure:** Flat (no subdirectories)
**Sequence:** 001-999, currently at 192

**Rules:**
- ✅ ALL markdown docs, design specs, guides, reports
- ✅ Numbered sequentially with category codes (PP, AT, OD, AA, etc.)
- ❌ NO subdirectories (keep flat for easy search)
- ❌ NO separate "claudes-docs" or other doc directories

**Examples:**
- `190-PP-PLAN-phase1-go-live-track.md` - Phase 1 execution plan
- `189-AA-SUMM-hustle-step-1-auth-wiring-complete.md` - Step completion summary
- `6767-hustle-repo-scaffold-standard.md` - This document (authoritative spec)

---

### 03-Tests/ - Test Suites

**Purpose:** Consolidated location for ALL automated tests and test artifacts
**Consolidates:** `tests/`, `test-results/`, `03-Tests/` (current scattered locations)

**Structure:**
- `e2e/` - Playwright E2E tests (auth flows, dashboard, etc.)
- `unit/` - Vitest unit tests (services, utilities)
- `mocks/` - MSW API mocks, test fixtures
- `scripts/` - Test utilities, setup scripts
- `results/` - Playwright test result artifacts (gitignored)
- `playwright-report/` - HTML test reports (gitignored)

**Rules:**
- ✅ Test specs: `*.spec.ts` (E2E), `*.test.ts` (unit)
- ✅ Coverage reports go in `results/coverage/`
- ✅ CI uploads test results here for artifact storage
- ❌ NO test code scattered in root or other directories

---

### 04-Assets/ - Design & Template Assets

**Purpose:** Non-code assets that are NOT served to users
**Consolidates:** `templates/`, empty `04-Assets/`

**Structure:**
- `design/` - Figma exports, mockups, wireframes
- `templates/` - Email templates, document templates, Notion exports
- `reference/` - Reference images, architecture diagrams, screenshots

**Rules:**
- ✅ Design files, templates, reference materials
- ✅ Content that informs development but isn't served
- ❌ NO user-facing assets (those go in `public/`)
- ❌ NO code or executable scripts

**Distinction from public/:**
- `04-Assets/` = development/design resources (not served)
- `public/` = Next.js public files served to users (SVGs, uploads)

---

### 05-Scripts/ - Automation & Utilities

**Purpose:** ALL automation scripts, utilities, and one-time migrations
**Consolidates:** `05-Scripts/`, `scripts/`, root `*.sh` files

**Structure:**
- `deployment/` - Deploy scripts (`deploy.sh`, GCP deployment)
- `setup/` - Setup scripts (`setup_github_wif.sh`, secrets setup)
- `migration/` - One-time migrations (`migrate-to-firestore.ts`, data migrations)
- `maintenance/` - Cleanup, optimization, monitoring scripts
- `utilities/` - General-purpose utilities (email sending, user management)

**Rules:**
- ✅ Shell scripts (`.sh`), TypeScript utilities (`.ts`), Python scripts (`.py`)
- ✅ Executable (`chmod +x`) for shell scripts
- ✅ TypeScript scripts run via `npx tsx 05-Scripts/path/to/script.ts`
- ❌ NO root-level `.sh` files (move to appropriate subdirectory)

**Current consolidation needed:**
- `scripts/migrate-to-firestore.ts` → `05-Scripts/migration/`
- `scripts/enable-firebase-auth.ts` → `05-Scripts/setup/`
- `setup_github_wif.sh` → `05-Scripts/setup/`
- `migrate-docs-flat.sh` → `05-Scripts/maintenance/`
- `validate-docs.sh` → `05-Scripts/maintenance/`
- `fix-github-notifications.sh` → `05-Scripts/utilities/`

---

### 06-Infrastructure/ - Infrastructure as Code

**Purpose:** ALL infrastructure, deployment configs, security credentials
**Consolidates:** `terraform/` (root), `06-Infrastructure/`, `security/`

**Structure:**
- `terraform/` - Main Terraform IaC (Cloud Run, Firestore, IAM)
  - `agents/` - Vertex AI agent configs
  - `environments/` - dev/staging/prod environment configs
  - `modules/` - Reusable Terraform modules
  - `schemas/` - BigQuery schemas (if any)
  - `main.tf`, `variables.tf`, `terraform.tfvars.example`
- `docker/` - Docker Compose for local dev (PostgreSQL, etc.)
  - `docker-compose.yml`
  - `Dockerfile` (if different from root)
- `security/` - Service accounts, credentials (gitignored)
  - `credentials/` - `.json` service account keys

**Rules:**
- ✅ Root `terraform/` directory moves to `06-Infrastructure/terraform/`
- ✅ Root `security/` directory moves to `06-Infrastructure/security/`
- ✅ Root `Dockerfile` stays at root (Docker convention)
- ✅ All `.json` keys in `security/credentials/` are gitignored
- ❌ NO duplicate terraform directories

**Current consolidation needed:**
- `terraform/` (root, active) → `06-Infrastructure/terraform/` (merge/replace)
- `security/` (root) → `06-Infrastructure/security/`
- Evaluate `06-Infrastructure/terraform-backup-20251013/` (likely archive or delete)

---

### 07-Releases/ - Release Artifacts

**Purpose:** Release notes, changelogs, tagged builds
**Status:** Currently exists, minimal content

**Structure:**
- `changelogs/` - Release notes by version
- `builds/` - Tagged release builds (if stored locally)

**Rules:**
- ✅ Automated changelog generation via GitHub Actions
- ✅ Manual release notes for major versions
- ❌ NO build artifacts if deployed to Cloud Run/Firebase (use Git tags instead)

---

### 99-Archive/ - Deprecated Code

**Purpose:** Storage for legacy/deprecated code that's no longer active
**Current contents:** `app-git-backup/`, `survey-nextjs-unused/`

**Structure:**
- Dated subdirectories: `YYYYMMDD-description/`
- Named by migration phase: `prisma-legacy-20251115/`

**Rules:**
- ✅ Move here, don't delete (preserve history)
- ✅ Include README.md in each archive explaining why archived
- ✅ Git commit archive moves separately from active changes
- ❌ NO active development in 99-Archive/

**Candidates for archiving:**
- `06-Infrastructure/terraform-backup-20251013/` (if confirmed old)
- `prisma/` (after Firestore migration completes - Phase 2+)

---

### src/ - Next.js Application Code

**Purpose:** Main Next.js 15 application source code
**Convention:** Standard Next.js App Router structure

**Structure:**
- `app/` - App Router pages, layouts, API routes
- `components/` - React components (`ui/` for shadcn/ui)
- `lib/` - Core utilities, Firebase services, auth logic
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `config/` - Application configuration
- `__tests__/` - Co-located unit tests (optional, also in `03-Tests/unit/`)

**Rules:**
- ✅ Follows Next.js conventions strictly
- ✅ TypeScript strict mode enforced
- ✅ Firebase services in `lib/firebase/services/`
- ❌ NO test files in `src/` (use `03-Tests/` instead, unless co-located)

---

### functions/ - Firebase Cloud Functions

**Purpose:** Firebase Cloud Functions backend (Node.js 20)
**Convention:** Standard Firebase Functions structure

**Structure:**
- `src/` - TypeScript source code
  - `index.ts` - Function exports
  - `a2a-client.ts` - Vertex AI A2A protocol client
- `lib/` - Compiled JavaScript (gitignored, generated by `npm run build`)
- `package.json` - Node.js 20 dependencies

**Rules:**
- ✅ TypeScript compiled to `lib/` before deployment
- ✅ Deploy via `firebase deploy --only functions`
- ✅ A2A protocol integration for Vertex AI agents
- ❌ NO manual edits to `lib/` (auto-generated)

---

### vertex-agents/ - Vertex AI A2A System

**Purpose:** Multi-agent system using Vertex AI Agent Engine (A2A protocol)
**Status:** Production-deployed subsystem (5 agents)

**Structure:**
- `orchestrator/` - Main coordinator agent (hustle-operations-manager)
- `validation/`, `user-creation/`, `onboarding/`, `analytics/` - Sub-agents
- `deploy_agent.sh` - Agent deployment automation
- `test_a2a.sh` - A2A protocol testing
- `README.md` - A2A system documentation

**Rules:**
- ✅ Significant subsystem, stays at root for visibility
- ✅ Each agent has `config/agent.yaml` and `config/agent-card.json`
- ✅ Deploy manually via Vertex AI Console (preferred) or script
- ✅ Integrates with `functions/src/a2a-client.ts`
- ❌ NO deletion (production-critical)

**Justification for root location:**
- 750+ lines of code across 5 agents
- Production-deployed infrastructure
- Independent deployment lifecycle
- Cross-referenced from Cloud Functions

---

### nwsl/ - NWSL Video Pipeline

**Purpose:** CI-only video generation pipeline (Vertex AI Veo 3.0)
**Status:** GitHub Actions-only execution (enforced by `gate.sh`)

**Structure:**
- `0000-docs/` - 8 segment canon specs (`004-DR-REFF-veo-seg-*.md`)
- `0000-images/` - Reference images for generation
- `003-raw-segments/` - Downloaded video segments (SEG-*.mp4)
- `007-logs/generation/` - Vertex AI operation logs
- `050-scripts/` - Pipeline scripts (generate, monitor, download)
- `gate.sh` - CI enforcement gate (blocks local execution)

**Rules:**
- ✅ CI-only execution via GitHub Actions (Workload Identity Federation)
- ✅ 8×8s segments + 4s end card = 68s documentary
- ✅ Veo 3.0 requires explicit soccer context in prompts
- ❌ NO local execution (enforced by `gate.sh`)

**Justification for root location:**
- 400+ lines of pipeline code
- Independent CI/CD workflow
- Separate documentation structure (nwsl/0000-docs/)
- No integration with main app

---

### prisma/ - Prisma ORM (Legacy)

**Purpose:** PostgreSQL database schema and migrations
**Status:** LEGACY - Being migrated to Firestore (Phase 1 in progress)

**Structure:**
- `schema.prisma` - 8 models (users, Player, Game, etc.)
- `migrations/` - Prisma migration history

**Rules:**
- ✅ Keep during migration period (dual-database support)
- ✅ NO new features on Prisma models
- ✅ NO breaking schema changes during migration
- ⏳ Archive to `99-Archive/prisma-legacy-YYYYMMDD/` after migration completes

**Migration timeline:**
- Phase 1: Firestore wiring + registration/login migration
- Phase 2: Dashboard migration + full cutover
- Phase 3: Archive Prisma, remove PostgreSQL

---

### public/ - Next.js Public Assets

**Purpose:** Static files served to users via Next.js
**Convention:** Standard Next.js public directory

**Structure:**
- `*.svg` - Public SVG icons (file.svg, globe.svg, next.svg, etc.)
- `uploads/` - User-uploaded files (game stats, player photos)

**Rules:**
- ✅ Accessible at `/filename.ext` in browser
- ✅ Optimized for web delivery (minified SVGs, compressed images)
- ❌ NO design assets or templates (those go in `04-Assets/`)

---

## Configuration Files (Root Level)

**Purpose:** Standard tooling configurations at repo root
**Convention:** Industry-standard locations for package managers, build tools

**Files:**
- `package.json`, `package-lock.json` - npm dependencies
- `tsconfig.json` - TypeScript compiler config
- `next.config.ts` - Next.js configuration
- `firebase.json` - Firebase project config
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `playwright.config.ts` - Playwright E2E test config
- `vitest.config.mts` - Vitest unit test config
- `tailwind.config.ts` - Tailwind CSS config
- `eslint.config.mjs` - ESLint linter config
- `postcss.config.js` - PostCSS config
- `components.json` - shadcn/ui config
- `Dockerfile` - Production Docker image
- `.env.example` - Environment variable template
- `.gitignore`, `.dockerignore`, `.gcloudignore` - Ignore rules
- `CLAUDE.md`, `AGENTS.md`, `PHASE1-PROMPT.md` - AI assistant context
- `LICENSE` - Project license

**Rules:**
- ✅ Standard locations respected (don't move these)
- ✅ `.env` is gitignored (use `.env.example` as template)
- ✅ AI context files (CLAUDE.md, AGENTS.md) stay at root
- ❌ NO custom config directories at root

---

## Legacy/Compatibility Notes

### Directories Being Consolidated

**Phase 2 (Next Session):**
- `tests/` → Merge into `03-Tests/` (mocks, scripts subdirectories)
- `test-results/` → Move to `03-Tests/results/`
- `scripts/` → Merge into `05-Scripts/` (by category)
- Root `*.sh` files → Move to `05-Scripts/` (by category)
- `terraform/` → Move to `06-Infrastructure/terraform/`
- `security/` → Move to `06-Infrastructure/security/`
- `templates/` → Move to `04-Assets/templates/`

### Directories Under Evaluation

- `06-Infrastructure/terraform-backup-20251013/` - Likely archive to `99-Archive/`
- `prisma/` - Archive after Firestore migration completes (Phase 2+)

---

## New File Placement Rules

### "Where do I put...?"

**Documentation (reports, guides, specs):**
→ `000-docs/NNN-CC-ABCD-description.md`

**E2E tests:**
→ `03-Tests/e2e/feature-name.spec.ts`

**Unit tests:**
→ `03-Tests/unit/service-name.test.ts` or `src/lib/__tests__/service.test.ts`

**Test fixtures/mocks:**
→ `03-Tests/mocks/`

**Deployment scripts:**
→ `05-Scripts/deployment/script-name.sh`

**Setup/configuration scripts:**
→ `05-Scripts/setup/script-name.sh`

**One-time migrations:**
→ `05-Scripts/migration/migrate-description.ts`

**Design mockups:**
→ `04-Assets/design/mockup-name.png`

**Email templates:**
→ `04-Assets/templates/email-template.html`

**Terraform modules:**
→ `06-Infrastructure/terraform/modules/module-name/`

**Service account keys:**
→ `06-Infrastructure/security/credentials/key-name.json` (gitignored)

**User-facing images/icons:**
→ `public/image-name.svg`

**React components:**
→ `src/components/ComponentName.tsx` (or `src/components/ui/` for shadcn)

**Firebase Cloud Function:**
→ `functions/src/function-name.ts`

**Vertex AI agent config:**
→ `vertex-agents/agent-name/config/agent.yaml`

**Deprecated code:**
→ `99-Archive/YYYYMMDD-description/`

---

## Enforcement & Maintenance

### Pre-Commit Checks

```bash
# Prevent new root-level scripts
! find . -maxdepth 1 -name "*.sh" -type f | grep -v "^\./gate.sh$"

# Prevent new doc directories
! find . -maxdepth 1 -type d -name "*docs*" | grep -v "^\./000-docs$"

# Prevent test files outside 03-Tests or src
! find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v "^\./03-Tests/" | grep -v "^\./src/"
```

### Regular Audits

**Monthly:**
- Check for root-level clutter (new `.sh` files, loose scripts)
- Verify `04-Assets/` isn't empty (consolidate templates)
- Confirm no duplicate test directories

**Per Migration Phase:**
- Archive deprecated directories to `99-Archive/`
- Update this spec document (bump version, add notes)
- Commit scaffold changes separately from feature work

### Contributor Onboarding

**Required reading:**
1. This document (`000-docs/6767-hustle-repo-scaffold-standard.md`)
2. `CLAUDE.md` (project architecture)
3. `AGENTS.md` (coding standards)

**First PR checklist:**
- [ ] Files placed in correct directories per this spec
- [ ] No new root-level scripts or docs directories
- [ ] Tests in `03-Tests/` (not scattered)
- [ ] Documentation in `000-docs/` (numbered, flat)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial authoritative specification |

---

## Related Documents

- `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md` - Phase 1 Mini AAR
- `CLAUDE.md` - Project architecture and development guide
- `AGENTS.md` - Coding standards and conventions

---

**Document ID:** 6767-hustle-repo-scaffold-standard
**Authoritative Status:** This is the canonical scaffold specification
**Next Review:** After Phase 2 consolidation (directory moves)
