# Release v2.0.0

**Release Date**: 2026-02-20

## Changes since v1.0.0

- chore: release v2.0.0 [skip ci] (bce7fed2)
- fix(ci): repair YAML syntax errors in 3 workflow files (#30) (e82ff9f3)
- fix(auth): make verify-email a universal Firebase action handler (bafcc4fe)
- fix(auth): redirect trailing-space URLs from Firebase Console config (d60fa523)
- fix(auth): redirect password reset from verify-email page (8b9a1303)
- fix(auth): client-side email verification & auth cleanup (#29) (5652172c)
- fix(auth): add continueUrl to password reset and timeout to session (dea4c40a)
- fix(auth): use client-side Firebase SDK for password reset (f812430f)
- fix(ci): use correct Dockerfile in CI build step (3bfeb4af)
- fix(auth): resolve forgot-password 504 timeout and add registration UX (3d8e4e35)
- fix(e2e): resolve all remaining test failures and flaky tests (ac4aa9e6)
- feat: add Open Graph and Twitter Card meta tags for link previews (2f6eeb4d)
- fix: remove invalid gcloud flags from deploy (6e76f3e1)
- feat(landing): animated features section + new CTA background image (152bbf25)
- fix(e2e): fix URL matching and false positive error detection in user journey tests (917e8b76)
- fix(e2e): resolve strict mode violation in dashboard heading locator (bc7e751c)
- fix(e2e): add longer timeout for dashboard heading visibility (74b8e27e)
- fix(auth): simplify ProtectedRoute to trust middleware (67241c4a)
- fix(auth): use ref for auth check complete flag to fix lint error (26219a75)
- fix(auth): trust session cookie in ProtectedRoute to fix E2E tests (b5a4491e)
- fix(auth): simplify to client-side auth like Perception (789b7bf7)
- fix: add startup CPU boost, session affinity, and health probes (2c2648aa)
- fix: increase Cloud Run resources to prevent container death (1b20ba74)
- ci: force fresh Cloud Run deployment (be970080)
- fix: add POST verification to deployment pipeline (47ffe4de)
- ci: retry deployment after checkout failure (c5c605aa)
- debug: add test-post to public routes and add logging (4c7edb4c)
- debug: add minimal POST endpoint to diagnose Cloud Run timeouts (16690f84)
- chore: force redeploy to fix POST request hanging (bc120fd9)
- fix(auth): add earlier debug check and body parsing timeout (f260617b)
- fix(e2e): improve test robustness and fix league codes (3f3f99e8)
- fix(auth): use Firebase session cookies instead of raw ID tokens (eb00a7e3)
- fix(auth): add debug endpoints to diagnose forgot-password hanging (4543ee0a)
- fix(auth): fix password reset page to read oobCode + add tracks.jpg background (e993cf22)
- fix(auth): use dynamic imports to prevent module-level hanging (4d002eb3)
- fix(auth): add timeout to password reset to prevent hanging (bf1207a9)
- chore: add GitHub issue templates (003c5c92)
- fix(verify): add detailed error message for debugging (2bcf3c89)
- fix(verify): use Admin SDK instead of client SDK to fix 504 timeout (d5d161e2)
- fix(verify): add missing playerId to API request and fix background (af217a71)
- fix(verify): improve verify page UX with background and navigation (96ccdbde)
- fix(ai): add GOOGLE_CLOUD_PROJECT env var for Vertex AI strategy (8be79e26)
- feat(ui): add media assets for homepage and auth pages (88405bc7)
- feat(dream-gym): fix Firestore subcollection queries and enhance mental page UI (7c74ef54)
- fix(ci): add E2E test credentials to CI workflows (ec3250bd)
- fix(dream-gym): remove duplicate closing braces in cardio and practice pages (10fc8e31)
- Merge pull request #27 from intent-solutions-io/feature/dream-gym-cardio-practice-logs (b3f9405f)
- Update src/app/api/players/[id]/cardio-logs/[logId]/route.ts (e31e451f)
- Update src/app/dashboard/dream-gym/practices/page.tsx (10e4e8a4)
- Update src/app/dashboard/dream-gym/cardio/page.tsx (a6c7a102)
- feat(dream-gym): add cardio log, practice log, and fix AI strategy (64dbf991)
- fix(auth): always return success for password reset (security) (#26) (8a90c62a)
- fix(auth): improve EMAIL_NOT_FOUND detection in password reset (#25) (ce853809)
- fix(auth): handle EMAIL_NOT_FOUND error in password reset (#24) (ee6b4d1c)
- fix(auth): use correct origin for password reset URL (#23) (1f8ae698)
- fix(api): use Admin SDK for waitlist, improve forgot-password logging (#22) (ca679aa7)
- docs: add OSS readiness files (#21) (02b61fbe)
- docs: update README Firestore collections to match actual schema (5e861bc0)
- test(e2e): improve error capture and XSS test robustness (#20) (e201e85f)
- fix(api): use Admin SDK for games route, standardize error responses (1ef48bfb)
- fix(e2e): fix player dropdown selector in complete-user-journey tests (5a04674a)
- fix(api): use Admin SDK for /api/players endpoint (e63f0817)
- fix(lint): remove unused variables from smoke test (438d443d)
- fix(e2e): set NEXT_PUBLIC_E2E_TEST_MODE at server runtime, not just build (4f8e0228)
- fix(ci): make email env vars optional in health check, skip auth tests in smoke test (44f81c15)
- docs(claude): expand architecture docs with Dream Gym, middleware, and env vars (9f6bfdad)
- fix(e2e): use data-sidebar selector for navigation sidebar test (6773752d)
- fix(e2e): use JavaScript click for sidebar elements and fix league code (a8ef80b5)
- fix(e2e): correct form selectors and add helper for player management tests (7e6d9e8b)
- chore: add test results to gitignore and remove from repo (5c48456e)
- fix(players): use conditional spreading for optional fields in Firestore document (8f32aed7)
- chore: trigger fresh CI build to verify no caching issues (346406b9)
- fix(e2e): show detailed API error including status and response body (a188c006)
- fix(e2e): display actual error message in add-athlete form (67011b7e)
- fix(e2e): show actual API error in add-athlete form (f8c11cd4)
- fix(e2e): improve error detection in complete-user-journey test (ac5bb0cb)
- fix(e2e): add fallback provisioning and better error handling (ce84ac38)
- fix(e2e): prevent storage state conflicts in tests that create own users (bf195595)
- fix(players): populate legacy position field for E2E test compatibility (cbf83829)
- fix(test): update Stripe mock to use createPreview instead of retrieveUpcoming (fb9710cb)
- fix(types): resolve remaining TypeScript errors for build pass (a71cc444)
- fix: resolve TypeScript errors for Stripe SDK and Zod 4.x compatibility (5c10a4b9)
- fix(e2e): use force click for sidebar logout button in headless mode (94ad3648)
- fix(e2e): improve auth tests robustness and skip email verification tests (5e53eead)
- fix(e2e): position detection and auto-verify for E2E tests (71132201)
- fix(e2e): copy static files to standalone directory for production build (099f3473)
- fix(e2e): use standalone server for production build (output: standalone) (2aa47c9f)
- fix(e2e): use production build in CI to avoid Turbopack body consumption bug (e1926f2a)
- fix(middleware): exclude API routes from matcher to fix body consumption (25b6674d)
- fix(api): read request body BEFORE calling cookies() (704240d3)
- fix(api): use request.text() for better JSON parsing debug (5b881574)
- fix: improve error handling and skip visual regression in CI (220f2538)
- ci: add FIREBASE_SERVICE_ACCOUNT_JSON for reliable Admin SDK init (4a37f958)
- fix(e2e): clear storage state for unauthenticated route protection test (50aa9e11)
- Merge remote-tracking branch 'origin/main' into fix/e2e-secure-cookie (e40ed12e)
- fix(middleware): unify middleware to src/ and add comprehensive logging (653dd96b)
- fix(next15): await params before accessing properties in athlete page (86c27572)
- fix(ssr): add force-dynamic to athlete pages for fresh data (80a339d9)
- fix(e2e): improve athlete list navigation selectors (b1e886a7)
- fix(e2e): correct game form selectors to match actual UI (1b1a66e2)
- fix(admin): include defaultWorkspaceId in getUserProfileAdmin (57cd8e43)
- fix(test): fix Stripe/billing test mocks to work without env vars (#17) (034ab7b1)
- fix(e2e): improve E2E test reliability with shared auth state (#16) (3d549c34)
- Merge pull request #15 from intent-solutions-io/feat/dream-gym-sprint7-tests (7e9ed9ff)
- refactor(e2e): address Gemini Code Assist feedback on PR #15 (b284a63f)
- test(e2e): add Dream Gym E2E tests (Sprint 7) (a8623ad2)
- Merge pull request #14 from intent-solutions-io/feat/dream-gym-sprint6-integration (bd0e785a)
- refactor: address Gemini Code Assist feedback on PR #14 (4f1961dc)
- feat(dream-gym): add AI Strategy integration to dashboard and athlete pages (14a0675c)
- feat(dream-gym): Sprint 5 - AI Workout Strategy Generation (#13) (ab6fcbb2)
- feat(dream-gym): Sprint 4 - Biometrics & Fitness Assessments (#12) (7147810f)
- bd sync: 2025-12-30 12:53:39 (9cb6d531)
- fix(auth): add missing methods to adminAuth proxy (4a2bad7b)
- fix(deploy): use FIREBASE_SERVICE_ACCOUNT_JSON for auth (9c7a72d0)
- fix(auth): increase session timeout and add Cloud Run min-instances (8cccea9c)
- fix(deploy): add FIREBASE_PROJECT_ID env var for server-side auth (b3a9db21)
- Merge pull request #8 from intent-solutions-io/feat/dream-gym-sprint3-analytics (7a534947)
- Merge pull request #7 from intent-solutions-io/feat/dream-gym-sprint2-ui (f59de05f)
- fix(dream-gym): address Gemini review feedback for progress analytics (86aba3ca)
- Merge main into feat/dream-gym-sprint3-analytics (1fe08cee)
- Merge main into feat/dream-gym-sprint2-ui (e8302bac)
- fix(auth): add timeout handling to prevent login UI freeze (67b4fb25)
- Merge pull request #6 from intent-solutions-io/feat/dream-gym-sprint1-foundation (0610aeeb)
- chore: merge main to resolve conflicts (5686b022)
- feat(dream-gym): Sprint 3 Analytics - Progress Charts & Stats Visualization (41b31eaa)
- fix(dream-gym): address Gemini Code Assist review feedback (8583a1a8)
- feat(dream-gym): add Sprint 2 UI components for workout logging and journal (565f771e)
- feat(dream-gym): add workout logging and journal foundation (Sprint 1) (49a100d7)
- bd sync: 2025-12-29 02:17:52 (c7cb983a)
- bd sync: 2025-12-28 20:47:16 (af8f3ef0)
- bd sync: 2025-12-28 20:29:26 (48b18d73)
- ci: default BILLING_ENABLED to false to unblock deploys (cca6eeb2)
- fix(auth): add Firebase config to Docker build for production signup (33f62136)
- docs: document E2E auth fix in synthetic QA plan (c089de92)
- ci: remove continue-on-error from E2E (now passing), make Docker non-blocking (3a4d243e)
- fix(auth): bypass email verification server-side in E2E test mode (0e46627b)
- chore: add bounded CI checker script (0e74a99a)
- ci: make E2E tests non-blocking (known session issue in CI) (b4da587a)
- fix(ci): move E2E test mode to job-level for build-time embedding (8d47076e)
- fix(auth): disable secure cookie in E2E tests (localhost HTTP) (45c1bfcc)
- feat(qa): Synthetic QA harness improvements (#5) (ef770f78)
- bd sync: 2025-12-26 23:41:46 (18dcb961)
- Merge pull request #4 from intent-solutions-io/feature/dream-gym-mvp (cb6bbf23)
- chore: merge main, resolve conflicts keeping Gemini type fixes (c7c54123)
- fix: address additional Gemini Code Assist review findings (157dc7e9)
- fix(auth): improve session cookie handling for E2E tests (0327ef94)
- feat(dream-gym): Complete Dream Gym MVP Feature (#3) (ee2636a0)
- chore: merge main and resolve conflicts (6f9e4a02)
- fix: address Gemini code review findings (497921f2)
- ci: add Gemini Code Assist for PR reviews (105a532c)
- feat(dream-gym): complete Dream Gym MVP feature (c7cb409c)
- bd sync: 2025-12-25 21:42:15 (9ced29f5)
- feat(mobile): React Native mobile app for iOS & Android (#2) (31702c38)
- fix(auth): fix registration and build issues (15affb04)
- bd sync: 2025-12-25 19:56:33 (66c2e53a)
- docs: add Beads upgrade note (whats-new + hooks) (c557c756)
- chore: add Beads (bd) workflow + ignore beads source clone (8a64ee90)
- docs(mobile): comprehensive documentation suite (cd189cb3)
- feat(mobile): add branded app icons and CI/CD workflows (6570b650)
- feat(mobile): complete React Native mobile app implementation (01e86c07)
- feat(mobile): React Native architecture and planning docs (3504d594)
- docs(ops): create comprehensive DevOps playbook with corrections (324a178f)
- docs: update README and CHANGELOG for ADK crawler infrastructure (65242dec)
- feat(hustle): create comprehensive go-live roadmap (8f2b65a2)
- feat(scout): ADK crawler execution complete - 2,568 chunks ready for RAG (ea48dca6)
- feat(tools): production ADK docs crawler pipeline for RAG grounding (01072a6e)
- feat(scout): ✅ Scout agent WORKING on Agent Engine - correct API usage (c126a116)
- docs(scout): document Agent Engine session serialization issue and testing block (c77c65d5)
- docs: complete Agent Engine deployment resolution (e6e09ab4)
- feat(agents): deploy Scout team to Agent Engine via ADK CLI - SUCCESS (fd173671)
- docs: add CTO agent architecture plan using Bob's Brain pattern (8ea1558c)
- docs: add Agent Engine deployment failure blocking issue (6db09f56)
- fix(agents): switch Scout team to stable gemini-2.0-flash model (27bc4d95)
- docs: add Scout team local validation test results (81994b57)
- fix(agents): add session creation to Scout team local tests (c77606a4)
- feat(agents): add Scout multi-agent team following ADK agent team tutorial (7ce7630b)
- feat(agents): add Scout conversational agent following Google ADK standards (a2b27b81)
- feat(agents): add ADK-based orchestrator (parallel implementation) (bab91719)
- chore(deps): add google-adk and a2a-sdk dependencies (974fa5a1)
- feat(qa): implement synthetic QA harness (Layer 1 - autonomous) (47594f9a)
- feat(qa): add comprehensive synthetic QA harness implementation plan (da64f75c)
- fix(docs): correct CTO audit - migration phases 1-3 complete (04595596)
- feat(qa): add agentic QA automation infrastructure (f4312c06)
- fix(ci): lower safety filter to block_only_high (aa0bc536)
- fix(ci): switch to Imagen 3 (imagegeneration@006) API (9c354dcc)
- fix(nwsl): use existing fade clips for final 18s + fix voiceover timing (396ad8d6)
- feat(nwsl): add voiceover timing + missing segments generation (2357c2a2)
- fix(ci): switch to Vertex AI API endpoint for Imagen 4 (66dfff44)
- fix(ci): revert to 3 samples per variant (12 total logos) (58ba7b0a)
- fix(ci): generate 1 logo per variant instead of 3 samples (8f582d19)
- feat(ci): add Imagen 4 logo generation workflow (d35eeb16)
- docs(meta): update CLAUDE.md and AGENTS.md post-GitHub release (9155f5d2)
- fix(lint): resolve all ESLint errors and warnings (ddd2caf8)
- docs: highlight Vertex AI Agent Engine telemetry and monitoring (32da3778)
- brand: add subtle Intent Solutions IO branding throughout repo (9eb8c401)
- fix(docs): remove HTML from Mermaid diagram for GitHub compatibility (b12eedeb)
- fix(docs): repair Mermaid diagram syntax for GitHub compatibility (52ca7413)
- docs: remove NWSL pipeline references from public documentation (547367b7)
- docs: remove public links to internal 000-docs directory (2bcaf501)
- docs(release): prepare v1.0.0 initial public release (686dbeb9)
- feat(deploy): add minimal production deploy workflow for human testing (899b3961)
- feat(players): enrich player profiles with positions, gender, and comprehensive league taxonomy (b22f1341)
- feat(agents): add comprehensive smoke tests with Vertex AI telemetry validation (210c853f)
- feat(performance): enable Firebase Performance Monitoring with custom traces (30592f8a)
- feat(monitoring): add GCP monitoring setup runbook (ee89e87e)
- feat(logging): add structured JSON logging for Cloud Logging integration (7f857d40)
- docs(aar): add phase 2 after action report - postgresql decommissioned (baeef153)
- docs(phase-2): update all documentation for firestore-only architecture (e3b0d688)
- refactor(api): simplify healthcheck, remove postgresql dependency (d9195c7d)
- chore(archive): move prisma files and legacy api routes to archive (cc39115b)
- chore(deps): remove prisma and postgresql dependencies (554155a3)
- refactor(schema): make workspace fields optional for phase 2 compatibility (30d78751)
- docs: add phase 1 aar for auth migration and observability cleanup (4340e4f8)
- chore: remove sentry and normalize observability to firebase/gcp (c329569b)
- feat(billing): add unified plan enforcement engine + ledger integration (8fa59981)
- feat(billing): add subscription lifecycle ledger + admin reader (7d0f70ee)
- chore(billing): add billing event replay and consistency auditor (5814ceaa)
- chore(billing): add canonical docs, support runbook, and safety switch (123a8030)
- fix(billing): correct plan limits to match actual system (e4e51180)
- feat(billing): add plan-limit warnings and usage indicators (efce3a7e)
- feat(billing): add customer portal access and invoice history (489553fb)
- feat(billing): add self-service plan change flow (45093c65)
- feat(dashboard): add workspace health section (e775f250)
- feat(billing): add Stripe Customer Portal integration (077eb234)
- docs(phase6): complete production readiness validation and Phase 6 summary (c7334212)
- feat(workspaces): enforce workspace status globally (fb39da7b)
- ci(mon): add monitoring and alerting for hustle (40bb0fe6)
- feat(phase6): workspace collaboration and role-based access control (2f5ec3dd)
- feat(phase6): firebase storage integration for player photo uploads (8a5da8b8)
- feat(phase6): monitoring and alerting infrastructure (a664eacd)
- feat(phase6): automated email notifications for billing events (74b0a70f)
- feat(phase6): billing settings page with self-service portal (40828757)
- feat(phase6): workspace status guards and billing CTAs (59d5af32)
- docs(aa): summarize phase 7 access enforcement and billing compliance (f6179e79)
- feat(billing): add stripe customer portal access (72d44175)
- feat(access): enforce hard subscription blocks on all write routes (14b393a2)
- feat(paywall): add PaywallNotice component and integrate into gated features (761e24b7)
- feat(access): enforce client-side access control with useWorkspaceAccess hook (3cae6d93)
- feat(access): add global subscription enforcement middleware (cc0eeaea)
- docs(aa): summarize phase 5 customer workspace and billing readiness (b636b79c)
- feat(ci): add go-live smoke tests and health endpoint (98bc95ad)
- feat(limits): enforce plan limits for players and games creation (f3420973)
- feat(billing): add stripe checkout and webhook integration for workspaces (2b65f279)
- docs(pp): define hustle stripe pricing and workspace mapping (8ffc123f)
- feat(workspace): add workspace model and firestore services (cf49d7fb)
- docs(aa): summarize phase 4 data and legacy cleanup (1d871b20)
- chore(scaffold): remove obsolete and empty directories (869824cd)
- chore(ci): align deploy workflows with firebase-only runtime (23ecf4d2)
- chore(data): mark prisma and postgres as legacy only (fff55dca)
- chore(auth): archive nextauth and remove from active runtime (84ac76c5)
- feat(data): remove prisma from active app code paths (b30b5903)
- feat(migration): add prisma to firestore data migration script (95042a38)
- docs(auth): phase 3 tasks 1-5 complete summary (29426d53)
- feat(auth): add edge middleware protection for dashboard routes (5f0f1f2c)
- feat(auth): migrate client components from nextauth to firebase signout (2ce7a2f5)
- feat(auth): migrate 6 remaining dashboard pages to firestore admin reads (28b50485)
- feat(auth): migrate dashboard overview to firestore admin reads (ab26ff70)
- feat(auth): cut dashboard layout over to firebase admin (1f7433b5)
- chore(auth): confirm firebase e2e flow before dashboard cutover (bf242934)
- chore(scaffold): consolidate hustle repo directories and paths (6d45e102)
- chore(scaffold): tighten hustle scaffold spec and phase 1 aar (ee5b323b)
- chore(scaffold): document hustle repo layout and target structure (ec26c049)

---

# Changelog

All notable changes to the Hustle project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **ADK Documentation Crawler Pipeline**: Production-grade infrastructure for crawling Google ADK docs
  - Complete Python package in `tools/adk_docs_crawler/` with 8 modules
  - Respects robots.txt, rate limiting (500ms between requests)
  - Generates RAG-ready chunks (1500 tokens max, 150 token overlap)
  - GCS upload with structured paths for Vertex AI consumption
  - Makefile targets: `crawl-adk-docs`, `crawl-adk-docs-local`, `setup-crawler`
  - GitHub Actions workflow for automated weekly crawls
  - Successfully crawled 118 pages, generated 2,568 chunks
  - Documentation: `000-docs/6781-AT-ARCH-adk-docs-crawl-pipeline.md`
- **Strategic Planning Documentation**:
  - `249-AA-STRT-cto-critical-path-scout-agent-rag.md` - CTO strategy with CoT reasoning
  - `250-LS-STAT-adk-crawler-execution-complete.md` - Crawler execution summary
  - `251-PP-PLAN-hustle-go-live-roadmap.md` - Production launch roadmap
- **QA Automation Infrastructure**: 5 GitHub issue templates for structured bug reporting and feedback
  - QA Bug Report template with severity levels and structured fields
  - QA UX Feedback template for usability improvements
  - QA Question template for onboarding gaps
  - QA Data/Stats Issue template for data integrity problems
  - QA Feature Idea template for enhancement requests
- **Synthetic QA Harness Implementation**: **COMPLETE** - Browser-based E2E testing harness for fake human validation
  - `252-PP-PLAN-synthetic-qa-harness-implementation.md` - Implementation plan and execution log
  - **Staging Seed Script**: `05-Scripts/seed-staging.ts` creates stable test data in Firebase
    - Demo parent account with 2 players (Attacking Midfielder + Goalkeeper)
    - 2 demo games with position-specific stats
    - Idempotent (deletes/rebuilds accounts)
  - **GitHub Actions Workflow**: `.github/workflows/synthetic-qa.yml` runs smoke tests on PRs
    - Triggers on `workflow_dispatch`, `pull_request`, `push` to main
    - Seeds staging, runs smoke suite, uploads artifacts
    - Comments on PR with pass/fail status
  - **Smoke Subset**: `npm run qa:e2e:smoke` for fast feedback (2 test files)
  - **Human QA Test Guide**: `253-OD-GUID-human-qa-test-guide.md` with 5 critical user journeys
  - **npm Scripts Added**:
    - `qa:e2e` - Run all E2E tests (Chromium only)
    - `qa:e2e:smoke` - Run smoke subset (fastest feedback)
    - `qa:seed:staging` - Seed Firebase with stable test data
  - **Blockers Documented**: Missing Firebase secrets for CI (9 secrets required)
- **Appauditmini**: Quick reference slash command (`/appauditmini`) generating 1-2 page architecture cheat sheets
- **Documentation**:
  - `249-RM-REFC-appauditmini-quick-reference.md` - MVP customer journey and architecture quick reference
  - `250-PP-PLAN-agentic-qa-automation-workflow.md` - Comprehensive plan for Vertex AI agent-driven QA automation
  - `251-AA-AUDT-cto-critical-issues.md` - CTO-level critical issues audit (corrected: migration Phases 1-3 complete)
- **Intent Solutions IO Branding**:
  - Downloaded 3 generated logos (Category Creator Emblem variants) to `000-docs/logos/`
  - Imagen 3 generation with `block_only_high` safety filter
  - `BLOCKED_PROMPTS.md` documenting why 3 logo prompts failed safety filter

### Changed
- Updated NWSL logo generation script to use Imagen 3 (`imagegeneration@006`) instead of Imagen 4
- Lowered safety filter from `block_some` to `block_only_high` for logo generation

---

## [1.0.0] - 2025-11-18

### 🎉 Initial Public Release

First public release of Hustle - Youth Soccer Statistics Tracking Platform. This release marks the completion of the Firebase migration, production infrastructure setup, and comprehensive feature enrichment.

### 🎯 Project Focus

Hustle demonstrates production-grade cloud infrastructure and AI agent orchestration:
- **Firebase Full Stack**: Authentication, Firestore, Cloud Functions, Hosting
- **Vertex AI A2A Protocol**: Multi-agent system with 5 specialized agents
- **Modern DevOps**: GitHub Actions with WIF, Terraform IaC, comprehensive CI/CD
- **Production Ready**: Monitoring, observability, security rules, COPPA compliance

### ✨ Major Features

#### Player Profile Enrichment
- **13 Specialized Soccer Positions**: GK, CB, RB, LB, RWB, LWB, DM, CM, AM, RW, LW, ST, CF
- **Gender Selection**: Required male/female field with validation
- **56 U.S. Youth Soccer Leagues**: ECNL Girls/Boys, MLS Next, USYS, NPL, USSSA, Rush Soccer, Surf Soccer, and more
- **Custom League Support**: "Other" option with free-text input for regional leagues
- **Position Intelligence**: Primary position selection + up to 3 secondary positions
- **Backward Compatibility**: Legacy `position` field preserved during migration

#### Firebase Migration Complete (Phases 1-3)
- **Phase 1: Authentication & Observability**
  - Migrated from NextAuth v5 to Firebase Authentication
  - Removed Sentry, normalized to Firebase/GCP observability
  - Google Cloud Logging with structured JSON logs
  - Firebase Performance Monitoring with custom traces

- **Phase 2: Database Migration**
  - Completely decommissioned PostgreSQL and Prisma
  - Migrated to Firestore with hierarchical collections
  - Security rules enforcing parent-child ownership
  - Composite indexes for query optimization

- **Phase 3: Monitoring & Observability**
  - GCP Cloud Monitoring setup with custom dashboards
  - Error reporting and alerting infrastructure
  - Cloud Logging integration with log-based metrics
  - Firebase Performance SDK enabled

#### Vertex AI Agent System (A2A Protocol)
- **5 Specialized Agents**:
  - Operations Manager (root orchestrator)
  - Validation Agent (data quality)
  - User Creation Agent (provisioning workflows)
  - Onboarding Agent (new user experience)
  - Analytics Agent (performance metrics)
- Agent-to-Agent communication via Cloud Functions
- Vertex AI Memory Bank for session persistence
- Comprehensive smoke tests with telemetry validation

#### Billing & Workspace Management (Phases 5-6)
- **Stripe Integration**: Checkout, webhooks, Customer Portal
- **Plan Enforcement**: Free, Pro, Team tiers with usage limits
- **Subscription Lifecycle**: Ledger system with event replay
- **Plan Limit Warnings**: Usage indicators and soft warnings
- **Workspace Status Enforcement**: Active, suspended, canceled states
- **Collaboration**: Role-based access control for teams

#### Storage & Media
- Firebase Storage integration for player photo uploads
- Secure upload with Firebase Admin SDK
- Storage quotas per workspace plan

### 🛠️ Infrastructure & DevOps

#### CI/CD Pipelines
- GitHub Actions with Workload Identity Federation (WIF)
- Firebase Hosting + Cloud Functions deployment
- Vertex AI agent deployment automation
- Cloud Run staging environment
- Manual production deployment workflow with "DEPLOY" confirmation

#### Testing
- Vitest unit tests with coverage reporting
- Playwright E2E tests (auth, dashboard, player flows)
- Vertex AI smoke tests with telemetry validation
- Test results archival in `03-Tests/`

#### Documentation
- **244+ Documentation Files** in `000-docs/`
- Document Filing System v2.0 (NNN-CC-ABCD-description.ext)
- Comprehensive `CLAUDE.md` for AI assistant guidance
- `AGENTS.md` with repository coding standards
- Production deployment runbook
- After Action Reports (AARs) for all major phases

### 🎨 User Experience

#### Dashboard Improvements
- Mobile-responsive design with Tailwind CSS
- Real-time Firestore synchronization
- Position-specific statistics tracking
- Workspace health monitoring
- Billing portal access

#### Forms & Validation
- Zod schema validation for all user inputs
- Conditional league input (shows text field when "Other" selected)
- Position validation (prevents primary position in secondary list)
- Client-side and server-side validation layers

### 🔒 Security & Compliance

- **COPPA Compliance**: Parent/guardian verification required
- **Firestore Security Rules**: Enforced data ownership
- **Firebase Auth**: Email/password with verification required
- **Secrets Management**: GitHub Secrets + Google Secret Manager
- **No Service Account Keys**: WIF for all GitHub Actions

### 📊 Technology Stack

**Frontend:**
- Next.js 15.5 with App Router and React Server Components
- React 19.1 with TypeScript 5.x
- Tailwind CSS with shadcn/ui components
- Turbopack bundling

**Backend:**
- Firebase Cloud Functions (Node.js 20)
- Firestore NoSQL database with hierarchical collections
- Firebase Authentication
- Firebase Storage

**AI/ML:**
- Vertex AI Agent Engine
- Google Agent-to-Agent (A2A) Protocol
- Google ADK (Agent Development Kit)
- Vertex AI Memory Bank

**DevOps:**
- GitHub Actions CI/CD
- Workload Identity Federation (WIF)
- Terraform infrastructure (modules for multi-project)
- Firebase Hosting + Cloud Run

**Monitoring:**
- Google Cloud Logging
- Firebase Performance Monitoring
- Cloud Monitoring with custom dashboards
- Error Reporting

### 📝 Repository Enhancements

#### Professional GitHub Presence
- **README.md**: Comprehensive overview with 9+ sections, 3 Mermaid diagrams
- **GitHub Pages**: Custom HTML site with responsive design
- **Badges**: 6 shields.io badges (Next.js, Firebase, Vertex AI, TypeScript, Firestore, License)
- **Topics**: 10 repository tags (youth-soccer, firebase, vertex-ai, nextjs, typescript, etc.)
- **Description**: Professional tagline
- **Homepage**: https://jeremylongshore.github.io/hustle/

#### Documentation Architecture
- Flat numbered filing system (000-docs/)
- Mermaid diagrams for system architecture, data models, CI/CD
- Deployment runbooks and troubleshooting guides
- Phase-by-phase migration After Action Reports (AARs)

### 🗓️ Deprecated

- ❌ NextAuth v5 (replaced with Firebase Auth)
- ❌ PostgreSQL database (replaced with Firestore)
- ❌ Prisma ORM (replaced with Firebase Admin SDK)
- ❌ Sentry error tracking (replaced with GCP Error Reporting)
- ❌ Cloud SQL (replaced with Firestore)

### 🔧 Migration Notes

For users upgrading from legacy PostgreSQL version:
1. Run migration script: `npx tsx 05-Scripts/migration/migrate-to-firestore.ts`
2. Verify data in Firestore Console
3. Test authentication flows (registration, login, email verification)
4. Archive legacy Prisma schema and migrations

### 📦 Release Assets

- Source code: `hustle-v1.0.0.tar.gz`
- Documentation: 244+ files in `000-docs/`
- Firebase configuration: `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- CI/CD workflows: 9 GitHub Actions workflows
- Terraform modules: Multi-project GCP infrastructure

### 🙏 Acknowledgments

Built with:
- **Firebase**: Hosting, Authentication, Firestore, Cloud Functions, Performance Monitoring
- **Vertex AI**: Agent Engine, A2A Protocol, Memory Bank
- **Google Cloud Platform**: Logging, Monitoring, Error Reporting, Secret Manager
- **Next.js**: React framework with App Router and Server Components
- **shadcn/ui**: Beautiful, accessible component library

### 🔗 Links

- **Live Dashboard**: https://hustlestats.io
- **GitHub Pages**: https://jeremylongshore.github.io/hustle/
- **Repository**: https://github.com/jeremylongshore/hustle
- **Architecture Guide**: [CLAUDE.md](./CLAUDE.md)
- **Developer Docs**: [AGENTS.md](./AGENTS.md)

---

## [Unreleased]

### Planned Features
- Additional soccer positions (futsal, beach soccer variants)
- Advanced analytics and trend visualization
- Team-level statistics aggregation
- Coach dashboard with multi-player views
- Export to PDF reports
- Mobile app (React Native)

---

**Full Changelog**: https://github.com/jeremylongshore/hustle/commits/v1.0.0
