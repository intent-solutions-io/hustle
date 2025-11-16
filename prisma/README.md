# Prisma + PostgreSQL - LEGACY ONLY

**Status**: ⚠️ ARCHIVED - Read-Only Reference
**Archived**: 2025-11-16 (Phase 4)
**Replaced By**: Firebase Firestore

---

## ⚠️ DO NOT USE FOR ACTIVE DEVELOPMENT

This Prisma schema and PostgreSQL database are **LEGACY ONLY** and should not be used for new features or active development. All data operations have been migrated to Firebase Firestore.

---

## What's in This Directory

### **`schema.prisma`** - Database Schema

Defines 8 PostgreSQL models that powered Hustle through Phase 3:

**Core Data (Migrated to Firestore)**:
- `users` - Parent accounts (57/58 migrated to Firebase Auth + Firestore)
- `Player` - Youth player profiles (0 records - empty table)
- `Game` - Position-specific game statistics (0 records - empty table)

**Auth Data (Obsolete - NextAuth v5)**:
- `accounts` - OAuth provider accounts (0 records)
- `sessions` - Active JWT sessions (0 records)
- `verification_tokens` - NextAuth verification (0 records)
- `email_verification_tokens` - Custom email verification (58 expired tokens)
- `password_reset_tokens` - Custom password resets (1 expired token)

**Migration Data (One-Time Use)**:
- `waitlist` - Early access signups (data migrated to Firestore `/waitlist/` collection)

---

### **`migrations/`** - Database Migration History

Contains all Prisma migrations applied to PostgreSQL database from initial development through Phase 3. This is a **read-only historical record** of schema evolution.

**DO NOT**:
- Run new migrations
- Modify existing migrations
- Apply migrations to production

**DO**:
- Keep for historical reference
- Use to understand schema evolution
- Reference for rollback scenarios (unlikely)

---

## Migration to Firestore

### **Phase 4 Task 1 (November 2025)**

**Data Migrated**:
- 57/58 users → Firebase Auth + Firestore `/users/{userId}`
- 0 players (empty table - no migration needed)
- 0 games (empty table - no migration needed)

**Migration Script**: `05-Scripts/migration/migrate-to-firestore.ts`

**Failed Records**:
- 1 user (`test..test@example.com` - invalid email format with double dots)

**Password Strategy**:
- PostgreSQL passwords: bcrypt hashed (10 rounds)
- Firebase passwords: scrypt (incompatible)
- Solution: All migrated users have temporary passwords, must reset via Firebase password reset

---

### **Phase 4 Task 2 (November 2025)**

**Routes Migrated**:
- All player CRUD operations → Firestore services
- All game CRUD operations → Firestore services
- Waitlist signups → Firestore services
- Game verification (PIN) → Firestore services

**Firestore Collections**:
```
/users/{userId}                           # User profile + COPPA compliance
  /players/{playerId}                     # Child players (subcollection)
    /games/{gameId}                       # Game statistics (nested subcollection)
/waitlist/{email}                         # Early access signups
```

---

### **Phase 4 Task 3 (November 2025)**

**NextAuth Removal**:
- All NextAuth v5 files archived to `99-Archive/20251115-nextauth-legacy/`
- PostgreSQL auth tables (`sessions`, `accounts`, etc.) now obsolete
- Authentication uses Firebase Auth exclusively

---

## Current State (Phase 4 Task 4)

### **PostgreSQL Database**

**Status**: Read-only archive of historical data

**Connection**:
- Host: (local Docker or Cloud SQL - varies by environment)
- Database: `hustle_mvp`
- User: `hustle_admin`
- Connection String: `DATABASE_URL` env var (legacy section)

**Data Retention**:
- Users: 58 records (57 migrated, 1 failed due to invalid email)
- Players: 0 records
- Games: 0 records
- Auth tables: Obsolete/expired tokens
- Waitlist: Historical signups (already in Firestore)

**DO NOT**:
- Write new data to PostgreSQL
- Delete existing data (historical archive)
- Run migrations

**DO**:
- Keep database running for legacy reference
- Use for data verification if needed
- Backup periodically (monthly)

---

### **Prisma Client**

**Status**: Used by legacy/utility routes only

**Active Usage** (low priority, non-MVP routes):
- `/api/account/pin/route.ts` - PIN setup (uses `prisma.user.update()`)
- `/api/admin/verify-user/route.ts` - Admin operations
- `/api/players/upload-photo/route.ts` - Photo upload
- `/api/db-setup/route.ts` - Dev utility
- `/api/healthcheck/route.ts` - Health check

**Inactive** (main app code):
- Player CRUD: Uses Firestore (`/lib/firebase/services/players.ts`)
- Game CRUD: Uses Firestore (`/lib/firebase/services/games.ts`)
- User management: Uses Firestore (`/lib/firebase/services/users.ts`)
- Waitlist: Uses Firestore (`/lib/firebase/services/waitlist.ts`)

---

## Prisma Commands (LEGACY)

These commands are still functional but should **NOT** be used for active development:

### **Generate Client**

```bash
# Regenerate Prisma Client after schema changes
npx prisma generate
```

**⚠️ WARNING**: Only use for reading legacy data. Do NOT modify schema for new features.

---

### **View Data (Read-Only)**

```bash
# Open Prisma Studio GUI to browse PostgreSQL data
npx prisma studio
```

**Use Case**: Verify historical data, check migration results, debug legacy records.

---

### **Database Migrations (DO NOT USE)**

```bash
# ❌ DO NOT RUN - For reference only
npx prisma migrate dev --name "migration-name"
npx prisma migrate deploy
npx prisma migrate reset
```

**⚠️ DANGER**: Running migrations may corrupt historical data or create inconsistencies.

---

## Environment Variables

### **Deprecated**

```bash
# ❌ Legacy - Move to "Legacy" section in .env.example
DATABASE_URL="postgresql://hustle_admin:password@localhost:5432/hustle_mvp"
```

**Current Location**: `.env.example` under "# Legacy (Prisma + PostgreSQL)" section (Task 4 cleanup).

---

### **Active (Firestore)**

```bash
# ✅ Use these for active development
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

---

## When to Access Prisma/PostgreSQL

### **Valid Use Cases**

1. **Historical data lookup**: Verify migration accuracy, check old records
2. **Legacy route maintenance**: Update low-priority routes still using Prisma
3. **Backup & archive**: Export PostgreSQL data for long-term storage
4. **Audit compliance**: Provide historical records if needed
5. **Rollback (unlikely)**: Restore PostgreSQL if Firestore fails (requires data re-migration)

---

### **Invalid Use Cases**

1. ❌ New user registration (use Firebase Auth)
2. ❌ Player/game creation (use Firestore services)
3. ❌ Waitlist signups (use Firestore `/waitlist/`)
4. ❌ Authentication (use Firebase Auth)
5. ❌ Session management (use Firebase ID tokens)

---

## Deprecation Timeline

| Date | Phase | Action |
|------|-------|--------|
| **November 2025** | Phase 4 Task 1 | Data migrated to Firestore |
| **November 2025** | Phase 4 Task 2 | Active routes migrated to Firestore |
| **November 2025** | Phase 4 Task 3 | NextAuth archived |
| **November 2025** | Phase 4 Task 4 | **Prisma marked as legacy** (THIS TASK) |
| **Future** | Phase 5 | PostgreSQL retired (database shut down after final backup) |

---

## Migration Documentation

**Task 1 AAR**: `000-docs/201-AA-MAAR-hustle-phase4-task1-prisma-to-firestore-migration.md`
- Data migration details (57/58 users, 0 players, 0 games)
- Migration script usage
- Idempotent rerun instructions

**Task 2 AAR**: `000-docs/202-AA-MAAR-hustle-phase4-task2-remove-prisma-from-live-code.md`
- Routes converted to Firestore
- Firestore services created
- API contract preservation

**Task 3 AAR**: `000-docs/203-AA-MAAR-hustle-phase4-task3-nextauth-shutdown-archive.md`
- NextAuth removal
- Firebase Auth replacement
- Auth flow changes

---

## Future Plans

### **Phase 5 (Optional)**

- Migrate remaining utility routes to Firestore (PIN setup, admin verify, photo upload)
- Final PostgreSQL backup to cloud storage
- Shut down PostgreSQL database
- Remove Prisma dependencies from `package.json`
- Remove Prisma Client from codebase

### **If Needed**

- Keep PostgreSQL running indefinitely for historical reference
- Export to CSV for long-term archival storage
- Maintain Prisma Client for read-only access

---

## Key Contacts

**Migration Lead**: Senior Tech Lead (Phase 4 execution)
**Database Admin**: (PostgreSQL backup & maintenance)
**Firebase Owner**: (Firestore production data)

---

**Last Updated**: 2025-11-16 (Phase 4 Task 4)
**Status**: ⚠️ LEGACY - Read-Only Reference
**Next Action**: Move DATABASE_URL to legacy section in `.env.example`

---
