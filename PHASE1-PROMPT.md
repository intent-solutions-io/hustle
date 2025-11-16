# PHASE 1 EXECUTION PROMPT

**Give this prompt to Claude to begin Phase 1 Go-Live Track:**

---

## Mission

Execute **Phase 1: Go-Live Track** to convert Hustle from "partially migrated" to "production-ready for real customers."

Read and follow the complete execution plan in:
```
000-docs/190-PP-PLAN-phase1-go-live-track.md
```

## Your Tasks (5 Steps, 6-8 hours)

### STEP 1: Enable Firebase Auth Provider (30 min + 1-min user action)
**What you do:**
1. Create `scripts/verify-firebase-auth-enabled.ts` - verification script
2. Create `tests/firebase-auth/01-provider-enabled.test.ts` - test suite
3. Update `scripts/migrate-to-firestore.ts` - add pre-flight checks
4. Generate mini-AAR: `000-docs/191-AA-MAAR-phase1-step1-auth-provider-enabled.md`
5. Commit with message format from plan

**What I do:**
- Enable Email/Password provider in Firebase Console (1-minute action)
- You'll tell me exactly when to do this

### STEP 2: Complete Dashboard Migration (3-4 hours)
**What you do:**
1. Migrate 11 dashboard pages from NextAuth → Firebase Auth
2. Replace all Prisma queries with Firestore services
3. One commit per page (11 commits total)
4. Generate mini-AAR: `000-docs/192-AA-MAAR-phase1-step2-dashboard-migration.md`

**Pages to migrate:**
- src/app/dashboard/layout.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/athletes/page.tsx
- src/app/dashboard/athletes/[id]/page.tsx
- src/app/dashboard/profile/page.tsx
- src/app/dashboard/analytics/page.tsx
- src/app/dashboard/settings/page.tsx
- src/app/dashboard/games/page.tsx
- (+ any others discovered)

### STEP 3: Run Full User Migration (1-2 hours)
**What you do:**
1. Create `scripts/audit-users-pre-migration.ts`
2. Run `scripts/migrate-to-firestore.ts` (migrates 58 users)
3. Create `scripts/verify-user-migration.ts`
4. Create `scripts/send-migration-password-resets.ts`
5. Execute migration, send 58 password reset emails
6. Generate mini-AAR: `000-docs/193-AA-MAAR-phase1-step3-user-migration.md`
7. Commit with migration summary

### STEP 4: Remove Legacy Code (1-2 hours)
**What you do:**
1. Delete NextAuth files (`src/lib/auth.ts`, etc.)
2. Delete Prisma files (`prisma/`, `src/lib/prisma.ts`)
3. Uninstall packages (next-auth, @prisma/client, prisma, bcrypt)
4. Archive migration scripts (don't delete - audit trail)
5. Clean environment variables from .env.example
6. Generate mini-AAR: `000-docs/194-AA-MAAR-phase1-step4-legacy-removal.md`
7. Commit with cleanup summary

### STEP 5: Deploy to Production (1-2 hours)
**What you do:**
1. Optimize Next.js build for Firebase Hosting
2. Build production bundle
3. Deploy Firebase Hosting: `firebase deploy --only hosting`
4. Deploy Cloud Functions: `firebase deploy --only functions`
5. Execute 5 smoke tests (registration, login, player CRUD, game CRUD, security)
6. Monitor Cloud Logging and Sentry
7. Generate mini-AAR: `000-docs/195-AA-MAAR-phase1-step5-production-deploy.md`
8. Commit with deployment evidence

## Critical Requirements

### Mini-AARs (5 required)
Each step must produce a mini After-Action Report following the exact template in the plan:
- 191-AA-MAAR-phase1-step1-auth-provider-enabled.md
- 192-AA-MAAR-phase1-step2-dashboard-migration.md
- 193-AA-MAAR-phase1-step3-user-migration.md
- 194-AA-MAAR-phase1-step4-legacy-removal.md
- 195-AA-MAAR-phase1-step5-production-deploy.md

### Git Commits
Follow commit message format exactly as specified in plan:
- Step 1: `chore(auth): verify Firebase Auth provider + add enablement checks`
- Step 2: `feat(dashboard): migrate <page> to Firebase Auth + Firestore` (11 commits)
- Step 3: `feat(migration): run full Postgres → Firestore migration + send reset emails`
- Step 4: `chore(cleanup): remove NextAuth + Prisma and finalize Firebase-only stack`
- Step 5: `chore(deploy): first Firebase production deployment + smoke tests`

### Acceptance Criteria
Each step has acceptance criteria in the plan. You must verify all criteria before proceeding to next step.

### Blocking Dependencies
- Step 1: No dependencies (start immediately)
- Step 2: Requires Step 1 complete
- Step 3: Requires Steps 1 & 2 complete
- Step 4: Requires Steps 1, 2, 3 complete
- Step 5: Requires Steps 1, 2, 3, 4 complete

## Expected Outcome

After Phase 1 completion, Hustle will be:
- ✅ Using Firebase Auth (no NextAuth)
- ✅ Using Firestore (no PostgreSQL)
- ✅ Using Firebase Cloud Functions
- ✅ Deployed to Firebase Hosting
- ✅ Production-ready for customer onboarding
- ✅ 58 users migrated with password reset emails sent

## Start Command

Begin with Step 1. Read the full plan in `000-docs/190-PP-PLAN-phase1-go-live-track.md` and execute systematically.

**Important:** Follow the plan exactly. Every step includes detailed instructions, error handling, and acceptance criteria.

---

**Ready to begin Phase 1 Step 1?**
