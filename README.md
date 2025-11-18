# ⚽ Hustle

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Vertex AI](https://img.shields.io/badge/Vertex%20AI-Agent%20Engine-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firestore](https://img.shields.io/badge/Firestore-Database-orange?logo=firebase&logoColor=white)](https://firebase.google.com/docs/firestore)
[![License](https://img.shields.io/badge/license-Other-lightgrey)](./LICENSE)
[![Built by](https://img.shields.io/badge/built%20by-Intent%20Solutions%20IO-18181b)](https://intentsolutions.io)

**Performance Data Recruiters Trust**

Youth sports tracking platform delivering verified statistics, transparent performance records, and team-validated metrics. Built on Firebase with Vertex AI agent orchestration.

*Creating the credibility layer for youth athletics.*

[Live Dashboard](https://hustlestats.io) • [GitHub Pages](https://jeremylongshore.github.io/hustle/) • [Architecture Guide](./CLAUDE.md)

---

## What is Hustle?

Hustle transforms subjective athletic impressions into verified statistics—creating transparent performance records that athletes, families, and recruiters can trust.

Built for competitive youth soccer (ECNL, MLS Next, USYS), Hustle consolidates fragmented game data into a single verified digital record. Track performance across **13 specialized positions**, validate stats with team verification, and build credible athletic profiles that remove politics from recruiting.

**The Problem We Solve:**
Youth athletic data is scattered across coaches' notebooks, team apps, and parent spreadsheets. Recruiting decisions rely on subjective impressions rather than objective evidence. Hustle creates the accountability layer that makes performance transparent.

### Platform Capabilities

- **Verified Statistics**: Team-validated metrics eliminate bias and subjective claims
- **Position Intelligence**: Track stats relevant to actual playing roles (GK, CB, DM, CM, ST, etc.)
- **League Coverage**: 56 U.S. youth soccer leagues including ECNL, MLS Next, USYS, Rush Soccer
- **Real-Time Sync**: Firebase-powered updates across all devices
- **COPPA Compliant**: Privacy-first design with parent/guardian controls
- **Production Infrastructure**: Built on Google Cloud with Vertex AI agent orchestration

---

## Key Features

### Core Statistics Tracking
- **13 Soccer Positions**: Goalkeeper, Center Back, Right/Left Back, Wing Backs, Defensive/Central/Attacking Midfielders, Wingers, Strikers, Center Forward
- **Position-Specific Stats**: Saves, tackles, passes, shots, assists, goals—tailored to each role
- **Game Logging**: Quick capture of match performance with date, opponent, result
- **Performance Dashboard**: Visual analytics and trend tracking over time

### League & Player Management
- **56 Youth Leagues**: ECNL Girls/Boys, MLS Next, USYS, NPL, USSSA, Rush Soccer, Surf Soccer, and more
- **Custom Leagues**: "Other" option with free-text for regional/local leagues
- **Multi-Player Support**: Track multiple children from one parent account
- **Profile Enrichment**: Gender, primary/secondary positions, team/club affiliation

### Technology Foundation
- **Firebase Auth**: Secure email/password authentication
- **Firestore Database**: Real-time NoSQL data sync with hierarchical collections
- **Cloud Functions**: Serverless backend for business logic
- **Vertex AI Agents**: Multi-agent A2A orchestration for operations
- **Next.js 15**: React Server Components, App Router, Turbopack bundling

---

## System Architecture

Hustle consists of three integrated systems working in harmony:

```mermaid
graph TB
    subgraph "Web Application Layer"
        Dashboard[Next.js Dashboard<br/>React 19 + TypeScript]
        Auth[Firebase Auth<br/>Email/Password]
        Hosting[Firebase Hosting<br/>Global CDN]
    end

    subgraph "AI Agent Layer - Vertex AI"
        Orchestrator[Operations Manager<br/>Root Agent]
        Validation[Validation Agent]
        UserCreation[User Creation Agent]
        Onboarding[Onboarding Agent]
        Analytics[Analytics Agent]

        Orchestrator -->|A2A Protocol| Validation
        Orchestrator -->|A2A Protocol| UserCreation
        Orchestrator -->|A2A Protocol| Onboarding
        Orchestrator -->|A2A Protocol| Analytics
    end

    subgraph "Data Layer"
        Firestore[(Firestore<br/>Real-time Database)]
        CloudFunctions[Cloud Functions<br/>Node.js 20]
    end

    Dashboard --> Auth
    Dashboard --> Firestore
    Dashboard --> CloudFunctions
    CloudFunctions --> Orchestrator
    Orchestrator --> Firestore

    style Orchestrator fill:#4285F4,stroke:#1967D2,stroke-width:2px,color:#fff
    style Dashboard fill:#18181b,stroke:#27272a,stroke-width:2px,color:#fff
    style Firestore fill:#FFCA28,stroke:#F57C00,stroke-width:2px
```

### Data Model (Firestore)

```mermaid
graph TD
    Users["users/{userId}\n- email\n- name\n- agreedToTerms\n- isParentGuardian\n- createdAt"]
    Players["users/{userId}/players/{playerId}\n- name\n- birthday\n- gender\n- primaryPosition\n- secondaryPositions\n- leagueCode\n- teamClub"]
    Games["users/{userId}/players/{playerId}/games/{gameId}\n- date\n- opponent\n- result\n- position\n- goals, assists, saves\n- tackles, passes, shots"]

    Users --> Players
    Players --> Games
```

**Hierarchical Collections:**
- `users/{userId}` - Parent accounts with COPPA compliance
- `users/{userId}/players/{playerId}` - Child player profiles (subcollection)
- `users/{userId}/players/{playerId}/games/{gameId}` - Game statistics (nested subcollection)

**Security Model:**
- Firestore security rules enforce parent-child ownership
- Users can only read/write their own players and games
- All player data cascades when parent user is deleted

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15.5, React 19.1, TypeScript 5.x, Tailwind CSS, shadcn/ui |
| **Backend** | Firebase Cloud Functions (Node.js 20), Next.js API Routes |
| **Database** | Firestore (primary), hierarchical collections with subcollections |
| **Authentication** | Firebase Authentication (Email/Password) |
| **AI/ML** | Vertex AI Agent Engine, A2A Protocol, Google ADK |
| **Hosting** | Firebase Hosting (static assets), Cloud Run (SSR) |
| **Testing** | Vitest (unit), Playwright (E2E), Testing Library |
| **DevOps** | GitHub Actions, Workload Identity Federation (WIF), Terraform |
| **Monitoring** | Google Cloud Logging, Firebase Performance Monitoring, Error Reporting |

### Agent-to-Agent (A2A) Architecture

Hustle employs **5 specialized Vertex AI agents** coordinated via Google's A2A protocol:

1. **Operations Manager (Orchestrator)**: Root agent coordinating all operations
2. **Validation Agent**: Data quality and schema validation
3. **User Creation Agent**: Automated user provisioning workflows
4. **Onboarding Agent**: New user experience and setup flows
5. **Analytics Agent**: Performance metrics and insights generation

**Agent Infrastructure:**
- **Communication**: Cloud Functions as A2A gateway with HTTP/JSON protocol
- **Session Management**: Vertex AI Memory Bank for conversation context persistence
- **Telemetry**: Comprehensive tracking of agent invocations, response times, error rates
- **Observability**: Cloud Logging integration with structured agent event logs
- **Monitoring**: Custom dashboards for agent health, usage patterns, and performance metrics

---

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Project with Firebase enabled

### Local Development

```bash
# Clone repository
git clone https://github.com/jeremylongshore/hustle.git
cd hustle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Run development server
npm run dev
# Visit http://localhost:3000

# Run Firebase emulators (optional)
firebase emulators:start
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase (requires authentication)
firebase deploy

# Deploy via GitHub Actions
git push origin main  # Auto-deploys to staging
# Production: Manual workflow trigger in GitHub Actions
```

See [CLAUDE.md](./CLAUDE.md) for detailed deployment and development workflows.

---

## Project Stats

| Metric | Value |
|--------|-------|
| **Documentation** | README, GitHub Pages, CLAUDE.md, AGENTS.md |
| **Supported Leagues** | 56 U.S. youth soccer leagues |
| **Soccer Positions** | 13 specialized roles |
| **Integrated Systems** | 2 (Core App, Vertex AI A2A Agents) |
| **Test Coverage** | Unit + E2E with Vitest and Playwright |
| **Deployment Model** | CI/CD via GitHub Actions with WIF |

---

## Documentation

### Public Documentation

- **[README.md](./README.md)** - This file - comprehensive project overview
- **[GitHub Pages](https://jeremylongshore.github.io/hustle/)** - Interactive documentation site
- **[CLAUDE.md](./CLAUDE.md)** - Technical architecture guide for developers
- **[AGENTS.md](./AGENTS.md)** - Repository guidelines and coding standards
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes

### For Contributors

Internal documentation is maintained in `000-docs/` following Document Filing System v2.0. Contributors with repository access can reference these detailed technical documents.

---

## Development Workflow

### Coding Standards

- **TypeScript**: 2-space indentation, functional patterns, server components preferred
- **React**: PascalCase for components, camelCase for utilities
- **Tailwind**: Utility classes grouped by layout → color → state
- **Testing**: Unit tests beside code in `src/__tests__`, E2E in `tests/e2e`
- **Commits**: Conventional Commits format (`feat(scope): message`)

See [AGENTS.md](./AGENTS.md) for complete coding guidelines.

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit
git add .
git commit -m "feat(dashboard): add player comparison view"

# Push and create PR
git push origin feature/your-feature-name
# Open PR in GitHub, wait for CI checks
```

**Branch Protection:**
- CI must pass (build, lint, type-check, tests)
- No direct commits to `main`
- Squash commits before merging

---

## Deployment Architecture

### Environments

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| **Local** | Development | Firebase Emulators | http://localhost:3000 |
| **Staging** | Pre-production testing | Firestore (dev project) | Cloud Run staging URL |
| **Production** | Live application | Firestore (production project) | https://hustleapp-production.web.app |

### CI/CD Pipeline

```mermaid
graph LR
    Push[git push] --> CI[GitHub Actions CI]
    CI --> Build[Build + Lint + Test]
    Build --> Deploy{Branch?}
    Deploy -->|main| Staging[Deploy to Staging]
    Deploy -->|manual trigger| Prod[Deploy to Production]

    Prod --> Health[Health Check]
    Health --> Verify[Manual Verification]

    style Push fill:#18181b,stroke:#27272a,stroke-width:2px,color:#fff
    style Prod fill:#34A853,stroke:#0F9D58,stroke-width:2px,color:#fff
    style Health fill:#FBBC04,stroke:#F9AB00,stroke-width:2px
```

**Workflows:**
- `.github/workflows/ci.yml` - Continuous integration on every push
- `.github/workflows/deploy-firebase.yml` - Firebase Hosting + Functions deployment
- `.github/workflows/deploy-prod.yml` - Manual production deployment (requires "DEPLOY" confirmation)
- `.github/workflows/deploy-vertex-agents.yml` - Vertex AI agent deployment

**Authentication:** Workload Identity Federation (WIF) - no service account keys required

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Read [AGENTS.md](./AGENTS.md)** for coding standards and repository rules
2. **Check existing issues** or create a new one to discuss changes
3. **Create a feature branch** from `main`
4. **Write tests** for new functionality
5. **Ensure CI passes** before requesting review
6. **Follow commit conventions** (Conventional Commits)
7. **Update documentation** in README.md or CLAUDE.md if needed

For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project uses a custom license. See the [LICENSE](./LICENSE) file for details.

---

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/jeremylongshore/hustle/issues)
- **Documentation**: [GitHub Pages](https://jeremylongshore.github.io/hustle/)
- **Live Dashboard**: [hustlestats.io](https://hustlestats.io)

---

**Built with Firebase, Vertex AI, and Next.js**

A product by [Intent Solutions IO](https://intentsolutions.io) • Creating industries that don't exist

© 2025 Intent Solutions IO. All rights reserved.
