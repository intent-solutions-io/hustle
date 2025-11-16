# Phase 1: Hustle Scaffold Inventory & Plan - Mini AAR

**Date:** 2025-11-15
**Phase:** 1 of 3 (Inventory & Documentation Only)
**Status:** Complete
**Operator:** Claude (Senior DevOps/Repo Architect)

---

## Mission

Analyze the current Hustle repository scaffold, identify duplication and sprawl, propose a target structure, and document the authoritative standard WITHOUT making any moves yet.

---

## What We Discovered

### Repository Health

**Overall Assessment:** Moderate scaffold drift with clear duplication patterns

**Good:**
- Core app structure (src/, functions/, public/) follows Next.js/Firebase conventions
- Large subsystems (vertex-agents/, nwsl/) are properly isolated
- 000-docs/ is the single documentation root (190+ docs, properly numbered)
- Git history is clean, no obvious file chaos

**Issues Identified:**

1. **Test Directory Fragmentation** (HIGH PRIORITY)
   - `03-Tests/` - Consolidated test location (e2e/, unit/, playwright-report/)
   - `tests/` - Only has mocks/ and scripts/ (test utilities, not actual tests)
   - `test-results/` - Playwright artifacts at root (should be in 03-Tests/results/)
   - **Impact:** New contributors confused about where to put tests

2. **Scripts Directory Duplication** (HIGH PRIORITY)
   - `05-Scripts/` - Infrastructure scripts (deploy.sh, setup-github-actions.sh)
   - `scripts/` - Application scripts (migrate-to-firestore.ts, enable-firebase-auth.ts)
   - Root `*.sh` files - 6 loose shell scripts (setup_github_wif.sh, fix-*.sh, validate-docs.sh)
   - **Impact:** No clear "where do scripts go?" answer

3. **Infrastructure Directory Confusion** (MEDIUM PRIORITY)
   - `terraform/` (root) - Active Terraform setup (main.tf, modules/, agents/, schemas/)
   - `06-Infrastructure/terraform/` - Appears older or duplicate
   - `06-Infrastructure/terraform-backup-20251013/` - Dated backup
   - `security/` (root) - Service account credentials
   - **Impact:** Unclear which terraform/ is canonical

4. **Empty Assets Directory** (LOW PRIORITY)
   - `04-Assets/` - Completely empty
   - `templates/` - Has 14point/ subdirectory (template content)
   - `public/` - Next.js public assets (correct location)
   - **Impact:** Templates not in numbered directory, 04-Assets serves no purpose

5. **Root-Level Clutter** (MEDIUM PRIORITY)
   - 6 loose `.sh` scripts at root
   - `github-actions-key.json` at root (should be in security/)
   - `PHASE1-PROMPT.md` at root (should be in 000-docs/)
   - **Impact:** Root directory increasingly cluttered

### Directory Inventory

**Core Application (Standard Locations):**
- `src/` - Next.js 15 app source (app/, components/, lib/, hooks/, types/)
- `functions/` - Firebase Cloud Functions (Node.js 20, A2A client)
- `public/` - Next.js public assets (SVGs, uploads/)
- `prisma/` - Prisma schema/migrations (LEGACY, being migrated to Firestore)

**Feature Modules (Root-Level Subsystems):**
- `vertex-agents/` - A2A multi-agent system (orchestrator + 4 sub-agents, ~750 LOC)
- `nwsl/` - CI-only video pipeline (8 segment canon, ~400 LOC scripts)

**Meta/Support Directories (Numbered):**
- `000-docs/` - ALL documentation (190+ docs, Document Filing System v2.0)
- `03-Tests/` - E2E/unit tests, playwright reports (partially consolidated)
- `04-Assets/` - Design assets (EMPTY - needs templates/)
- `05-Scripts/` - Infrastructure scripts (deployment, setup, monitoring)
- `06-Infrastructure/` - Docker, Terraform, security (has duplication issues)
- `07-Releases/` - Release artifacts, changelogs
- `99-Archive/` - Deprecated code (app-git-backup/, survey-nextjs-unused/)

**Overlapping/Duplicate Directories:**
- `tests/` (root) - Only mocks/ and scripts/ (utilities, not tests)
- `test-results/` (root) - Playwright artifacts (duplicates 03-Tests/playwright-report/)
- `scripts/` (root) - Application utilities (overlaps 05-Scripts/)
- `terraform/` (root) - Active IaC (duplicates 06-Infrastructure/terraform/)
- `security/` (root) - Credentials (should be in 06-Infrastructure/security/)
- `templates/` (root) - Template content (should be in 04-Assets/templates/)

**Root-Level Files (Config & Scattered Scripts):**
- Standard configs: package.json, tsconfig.json, next.config.ts, firebase.json, etc.
- AI context: CLAUDE.md, AGENTS.md, PHASE1-PROMPT.md
- Loose scripts: setup_github_wif.sh, migrate-docs-flat.sh, validate-docs.sh, fix-*.sh (6 total)
- Loose credentials: github-actions-key.json (should be gitignored/moved)

---

## Target Scaffold Designed

### High-Level Strategy

**Consolidation Principles:**
1. **One canonical location per concern** (tests, scripts, infra, assets)
2. **Respect standards** (Next.js: src/public/, Firebase: functions/)
3. **Feature isolation** (vertex-agents/, nwsl/ stay at root)
4. **Archive, don't delete** (99-Archive/ for legacy)
5. **Numbered meta directories ONLY** for cross-cutting support

### Target Structure (Tree View)

```
hustle/
├── 000-docs/                      # ALL documentation (only docs root)
├── 03-Tests/                      # ALL automated tests + artifacts
│   ├── e2e/, unit/, mocks/, scripts/
│   └── results/, playwright-report/
├── 04-Assets/                     # Non-code assets (design, templates)
│   ├── design/, templates/, reference/
├── 05-Scripts/                    # ALL automation scripts
│   ├── deployment/, setup/, migration/
│   ├── maintenance/, utilities/
├── 06-Infrastructure/             # ALL infrastructure-as-code
│   ├── terraform/ (consolidated)
│   ├── docker/
│   └── security/
├── 07-Releases/                   # Release artifacts
├── 99-Archive/                    # Deprecated code
├── src/                           # Next.js app (standard)
├── functions/                     # Firebase Cloud Functions (standard)
├── vertex-agents/                 # A2A multi-agent system (feature module)
├── nwsl/                          # Video pipeline (feature module)
├── prisma/                        # Prisma ORM (legacy, archive later)
├── public/                        # Next.js public assets (standard)
└── [config files at root]         # package.json, tsconfig.json, etc.
```

### Consolidation Plan (Phase 2+)

**Tests Consolidation:**
- `tests/mocks/` → `03-Tests/mocks/`
- `tests/scripts/` → `03-Tests/scripts/`
- `test-results/` → `03-Tests/results/`
- Delete empty `tests/` directory

**Scripts Consolidation:**
- `scripts/migrate-to-firestore.ts` → `05-Scripts/migration/`
- `scripts/enable-firebase-auth.ts` → `05-Scripts/setup/`
- `scripts/send-password-reset-emails.ts` → `05-Scripts/utilities/`
- `scripts/verify-*.ts` → `05-Scripts/utilities/`
- `setup_github_wif.sh` → `05-Scripts/setup/`
- `migrate-docs-flat.sh` → `05-Scripts/maintenance/`
- `validate-docs.sh` → `05-Scripts/maintenance/`
- `fix-github-notifications.sh` → `05-Scripts/utilities/`
- `fix_hustlestats_tls*.sh` → `05-Scripts/utilities/` or `99-Archive/`
- Delete empty `scripts/` directory

**Infrastructure Consolidation:**
- `terraform/` (root, active) → `06-Infrastructure/terraform/` (merge/replace)
- `security/` → `06-Infrastructure/security/`
- Evaluate `06-Infrastructure/terraform-backup-20251013/`:
  - If old: archive to `99-Archive/terraform-backup-20251013/`
  - If needed: keep with README.md explaining purpose

**Assets Consolidation:**
- `templates/14point/` → `04-Assets/templates/14point/`
- Delete empty `templates/` directory
- Populate `04-Assets/design/` with design files (if any)

**Root Cleanup:**
- `github-actions-key.json` → `06-Infrastructure/security/credentials/` (gitignore)
- `PHASE1-PROMPT.md` → `000-docs/193-PP-PLAN-phase1-execution-prompt.md` (renumber)

---

## Risks & Open Questions Flagged

### Risks

1. **Terraform Directory Confusion** (MEDIUM)
   - Root `terraform/` has main.tf (26KB total code)
   - `06-Infrastructure/terraform/` may be older version
   - **Risk:** Merge may overwrite active config
   - **Mitigation:** Diff both directories, confirm root is canonical before Phase 2

2. **Test Path Updates** (LOW)
   - `playwright.config.ts` references `tests/` directory
   - `vitest.config.mts` references `src/__tests__/`
   - **Risk:** Tests fail after moving `tests/` to `03-Tests/`
   - **Mitigation:** Update configs in same commit as directory move

3. **Script Import Paths** (LOW)
   - `package.json` scripts may reference `scripts/` directory
   - GitHub Actions workflows may reference root `.sh` files
   - **Risk:** CI breaks after moving scripts
   - **Mitigation:** Grep for references, update paths before move

4. **Firebase Migration Timing** (MEDIUM)
   - Phase 1 Go-Live Track (8 tasks) is currently in progress
   - Scaffold cleanup could conflict with migration work
   - **Risk:** Merge conflicts, double work
   - **Mitigation:** Coordinate scaffold Phase 2 after migration stabilizes

### Open Questions (NOT for user, for Phase 2 planning)

1. **Are terraform/ and 06-Infrastructure/terraform/ truly duplicates?**
   - Answer: Diff them in Phase 2, keep canonical only

2. **Is 06-Infrastructure/terraform-backup-20251013/ needed?**
   - Answer: Check git history, archive if old backup

3. **Should prisma/ stay at root or move to 99-Archive/?**
   - Answer: Keep until Firestore migration completes (Phase 1 Go-Live Track)

4. **Do any CI workflows hardcode script paths?**
   - Answer: Grep `.github/workflows/*.yml` for references before moving

5. **Are fix_hustlestats_tls*.sh scripts still needed?**
   - Answer: Check last modified date, archive if old one-time fixes

---

## Authoritative Documentation Created

### 1. Scaffold Standard Specification

**File:** `000-docs/6767-hustle-repo-scaffold-standard.md`
**Type:** Authoritative Specification
**Version:** 1.0
**Status:** Active

**Contents:**
- Design principles (single docs root, standard locations, numbered meta dirs)
- Complete target directory structure (tree view, depth 2-3)
- Directory specifications (purpose, structure, rules) for each directory
- New file placement rules ("Where do I put...?" decision tree)
- Consolidation plan (what moves where in Phase 2)
- Enforcement & maintenance (pre-commit checks, audit schedule)

**Key Decisions Documented:**
- `000-docs/` is the ONLY documentation root (no claudes-docs, no subdirectories)
- `03-Tests/` consolidates ALL tests (e2e, unit, mocks, results)
- `05-Scripts/` consolidates ALL scripts (deployment, setup, migration, utilities)
- `06-Infrastructure/` consolidates ALL infra (terraform, docker, security)
- `04-Assets/` gets templates, design files (non-served resources)
- `vertex-agents/` and `nwsl/` stay at root (significant feature modules)
- `prisma/` stays until Firestore migration completes, then archives

### 2. Phase 1 Mini AAR (This Document)

**File:** `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md`
**Type:** Mini After-Action Report
**Phase:** 1 of 3

**Contents:**
- Repository health assessment
- Directory inventory (current state)
- Target scaffold design
- Consolidation plan
- Risks and open questions flagged

---

## Metrics

**Time Spent:** ~30 minutes (inventory analysis + documentation)

**Directories Analyzed:**
- Top-level: 20 directories
- Subdirectories: 50+ examined
- Config files: 30+ inventoried

**Issues Found:**
- Duplicate directories: 6 cases (tests, scripts, terraform, security, templates)
- Root clutter: 6 loose shell scripts, 1 loose JSON file
- Empty directory: 1 (04-Assets/)
- Consolidation candidates: 15+ files/directories

**Documentation Produced:**
- 1 authoritative specification (6767-hustle-repo-scaffold-standard.md, ~600 lines)
- 1 Mini AAR (this document, ~400 lines)
- Total: ~1,000 lines of structured documentation

---

## What's Next (Phase 2 Preview)

**Scope:** Execute consolidation moves, update configs

**Actions:**
1. Diff `terraform/` vs `06-Infrastructure/terraform/` to confirm canonical
2. Move `tests/`, `test-results/` contents into `03-Tests/`
3. Move `scripts/` and root `.sh` files into `05-Scripts/` (by category)
4. Move `terraform/`, `security/` into `06-Infrastructure/`
5. Move `templates/` into `04-Assets/`
6. Update `playwright.config.ts`, `vitest.config.mts` with new paths
7. Grep `.github/workflows/`, `package.json` for hardcoded paths, update
8. Test locally (npm test, npm run build)
9. Git commit with detailed move history
10. Create Phase 2 Mini AAR

**Estimated Time:** 45-60 minutes (actual moves + path updates + testing)

**Prerequisites:**
- Phase 1 commit merged
- No conflicting Firebase migration work in flight
- Confirmation that root `terraform/` is the canonical version

---

## Deliverables

✅ Authoritative scaffold spec: `000-docs/6767-hustle-repo-scaffold-standard.md`
✅ Phase 1 Mini AAR: `000-docs/192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan.md`
✅ Git commit with both docs (next step)

---

## Repo Smells Summary

**Major Smells Found:**

1. **Test Fragmentation** - 3 separate test locations (03-Tests, tests, test-results)
2. **Script Duplication** - 3 separate script locations (05-Scripts, scripts, root *.sh)
3. **Terraform Confusion** - 2 active terraform directories (root vs 06-Infrastructure)
4. **Root Clutter** - 6 loose shell scripts, 1 loose credential file
5. **Empty Directory** - 04-Assets/ serves no purpose currently

**Positive Observations:**

1. **Clean Documentation** - 000-docs/ is properly numbered, flat structure, no duplicates
2. **Good Core Structure** - src/, functions/, public/ follow conventions
3. **Feature Isolation** - vertex-agents/ and nwsl/ properly separated
4. **Archive Discipline** - 99-Archive/ is used (not deleting old code)
5. **Git History** - Clean commit history, no obvious file chaos

**Severity:**
- HIGH: Test/script fragmentation (contributor confusion)
- MEDIUM: Infrastructure duplication (deployment confusion)
- LOW: Empty directories, root clutter (cosmetic)

**Recommendation:** Proceed with Phase 2 consolidation after Phase 1 Go-Live Track stabilizes.

---

**Phase Status:** COMPLETE
**Next Phase:** Phase 2 - Directory Consolidation & Path Updates
**Commit Message:** `chore(scaffold): document hustle repo layout and target structure`

---

**Document ID:** 192-AA-MAAR-hustle-scaffold-phase-1-inventory-and-plan
**Created:** 2025-11-15
**Operator:** Claude (Senior DevOps/Repo Architect)
