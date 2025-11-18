# Repository Guidelines

**Project**: Hustle - Performance data recruiters trust
**Live Site**: https://hustlestats.io
**GitHub**: https://github.com/jeremylongshore/hustle
**Status**: Public (v1.0.0 released)

## Project Structure & Module Organization
This Next.js app centers around `src/app` for routes and server actions, `src/components` for composable UI, `src/lib` for shared services (including `src/lib/firebase/` for Firestore operations), and `src/schema`/`src/types` for domain contracts. Reusable test doubles sit in `src/__tests__`. End-to-end assets and historical reports are archived in `03-Tests`, while Firebase cloud functions ship from `functions`. Static files belong in `public`, and infrastructure automation (deploy scripts) is grouped under `06-Infrastructure` and `.github/workflows`.

**NOTE**: Prisma/PostgreSQL was decommissioned in Phase 2 (archived in `99-Archive/20251118-prisma-legacy/`). All database operations now use Firestore via `src/lib/firebase/services/`.

## Build, Test, and Development Commands
Use `npm run dev` for local development with Turbopack. `npm run lint` runs the flat ESLint stack and must be clean before every PR. Build production artifacts with `npm run build`; serve them using `npm run start`. For test suites, rely on `npm run test` to execute both unit (Vitest) and e2e (Playwright). Debugging e2e tests is easier with `npm run test:e2e:ui`, and `npm run test:coverage` tracks Vitest coverage locally.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and favor functional, server-component-friendly patterns. Use PascalCase for React components, camelCase for utilities, and kebab-case for file names inside `src/app`. Tailwind utility classes should follow existing grouping: layout → color → state. ESLint handles formatting; run fixes with `npm run lint -- --fix` when necessary. Keep environment modules type-safe via `src/env.mjs`.

## Testing Guidelines
Vitest specs live beside the code in `src/__tests__` using the `*.test.ts` suffix and Testing Library helpers. Playwright scenarios reside in `03-Tests/e2e`; tag new suites with descriptive filenames (`player-stats.spec.ts`). Update mock data in `tests/mocks` when API contracts shift. Aim for 80%+ coverage on critical services and include Playwright screenshots for regressions. When testing Firestore operations, use Firebase emulators locally.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style (`feat(firebase): message`). Reference related Jira or GitHub issues in the body, and squash fixups before pushing. Every PR should summarize intent, list test commands executed, and attach UI screenshots for visible changes. Request review from domain owners when touching `functions` or Terraform modules.

## Configuration & Security Notes
Never commit secrets; populate `.env.local` by copying `.env.example`. Keep Firebase credentials synchronized with Google Cloud Secret Manager. Before deploying, run `npm run lint`, `npm run test`, and verify CI passes on GitHub Actions. All production deployments use Workload Identity Federation (WIF) for keyless authentication - no service account keys are used in CI/CD.
