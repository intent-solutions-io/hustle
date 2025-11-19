# Changelog

All notable changes to the Hustle project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **QA Automation Infrastructure**: 5 GitHub issue templates for structured bug reporting and feedback
  - QA Bug Report template with severity levels and structured fields
  - QA UX Feedback template for usability improvements
  - QA Question template for onboarding gaps
  - QA Data/Stats Issue template for data integrity problems
  - QA Feature Idea template for enhancement requests
- **Synthetic QA Harness Plan**: Comprehensive implementation plan for browser-based E2E testing
  - `252-PP-PLAN-synthetic-qa-harness-implementation.md` - Beat on the app with synthetic "fake humans" before real users
  - 10 critical user journeys defined (register → add athlete → log game → verify stats)
  - Existing Playwright tests audited: 1,581 lines covering happy path, position-specific stats, validation, security
  - Missing journeys identified: Stripe subscription, workspace collaboration, password reset, mobile viewport
  - GitHub Actions workflow design for CI automation
  - Staging seed script architecture for stable test data
  - Simple interface for future fixer agents: `npm run qa:e2e:smoke`
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
