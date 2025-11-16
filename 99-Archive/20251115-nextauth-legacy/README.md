# NextAuth v5 Legacy Archive

**Archived**: 2025-11-16
**Reason**: Migrated from NextAuth v5 to Firebase Auth
**Phase**: Phase 4 - Data Migration & Legacy Cleanup

---

## What's Archived

This directory contains the legacy NextAuth v5 authentication implementation that powered Hustle from initial development through Phase 3. All authentication functionality has been migrated to Firebase Auth.

### **Core Configuration**

- **`auth.ts`** - NextAuth v5 configuration with credentials provider, JWT sessions, and callbacks
- **`tokens.ts`** - Token generation utilities for password reset and email verification

### **API Routes** (`api-routes/auth/`)

- **`forgot-password/route.ts`** - Password reset email workflow
- **`reset-password/route.ts`** - Password reset with token validation
- **`verify-email/route.ts`** - Email verification with token
- **`resend-verification/route.ts`** - Resend email verification link

---

## Why Archived (Not Deleted)

**Historical Reference**: These files document the original authentication architecture and business logic.

**Migration Context**: Useful for understanding:
- Password hashing strategy (bcrypt, 10 rounds)
- Email verification flow
- Token expiration policies (1 hour for password reset, 24 hours for email verification)
- Session management (JWT, 30-day expiry)

**Rollback Safety**: In case Firebase Auth migration encounters issues, these files provide rollback option (though PostgreSQL data migration makes this unlikely).

---

## Migration Timeline

**Phase 1 (November 2025)**: Firebase Auth + Firestore wiring complete
- New registrations use Firebase Auth via `signUp()` in `/lib/firebase/auth.ts`
- User documents stored in Firestore `/users/{userId}` collection

**Phase 4 Task 1 (November 2025)**: Data migration
- 57/58 PostgreSQL users migrated to Firebase Auth + Firestore
- Temporary passwords set (users must reset via Firebase password reset)

**Phase 4 Task 2 (November 2025)**: Remove Prisma from live code
- All player/game CRUD operations moved to Firestore
- NextAuth still active for session validation (dual-auth period)

**Phase 4 Task 3 (November 2025)**: NextAuth shutdown (THIS TASK)
- NextAuth configuration and routes archived here
- Active runtime uses Firebase Auth exclusively

---

## What Replaced It

### **Firebase Auth**

- **Service**: `/lib/firebase/auth.ts`
- **Provider**: Email/Password (Firebase Authentication)
- **User Management**: Firebase Admin SDK (`/lib/firebase/admin.ts`)

### **Authentication Flow**

**Registration**:
```typescript
// OLD (NextAuth + Prisma)
await prisma.user.create({
  email,
  passwordHash: await bcrypt.hash(password, 10)
});

// NEW (Firebase Auth + Firestore)
await signUp({ email, password, firstName, lastName, ... });
// Creates Firebase Auth account + Firestore user document
```

**Login**:
```typescript
// OLD (NextAuth credentials provider)
await signIn('credentials', { email, password });

// NEW (Firebase Auth)
await signIn(email, password); // Firebase client SDK
```

**Session Validation**:
```typescript
// OLD (NextAuth JWT sessions)
const session = await auth();
if (!session?.user?.id) { /* unauthorized */ }

// NEW (Firebase Auth)
const user = await getCurrentUser(); // Firebase Auth ID token
if (!user) { /* unauthorized */ }
```

---

## Database Changes

### **PostgreSQL Tables (Archived)**

NextAuth used these Prisma models (now archived with empty/obsolete data):
- `accounts` - OAuth provider accounts (0 records)
- `sessions` - Active user sessions (0 records)
- `verification_tokens` - NextAuth verification (0 records)
- `email_verification_tokens` - Custom email verification (58 records - obsolete)
- `password_reset_tokens` - Custom password resets (1 record - obsolete)

### **Firestore Collections (Active)**

Firebase Auth uses these collections:
- `/users/{userId}` - User profile + metadata
- `/users/{userId}/players/{playerId}` - Child players
- `/users/{userId}/players/{playerId}/games/{gameId}` - Game statistics

---

## Key Differences: NextAuth vs Firebase Auth

| Feature | NextAuth v5 | Firebase Auth |
|---------|------------|---------------|
| **Password Hashing** | bcrypt (10 rounds) | scrypt (Firebase managed) |
| **Sessions** | JWT (30-day expiry) | Firebase ID tokens (1-hour, auto-refresh) |
| **Email Verification** | Custom tokens (24h expiry) | Firebase managed |
| **Password Reset** | Custom tokens (1h expiry) | Firebase managed |
| **User Storage** | PostgreSQL via Prisma | Firestore + Firebase Auth |
| **Session Storage** | Database (sessions table) | Firebase Admin SDK (server) |
| **MFA** | Not implemented | Firebase supports (future) |
| **Social Login** | Not implemented | Firebase supports (future) |

---

## Environment Variables (Deprecated)

These NextAuth environment variables are no longer used:

```bash
# ❌ DEPRECATED - Remove from production
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://..."  # Still used by Prisma (legacy)
```

Replaced with Firebase config:

```bash
# ✅ ACTIVE - Firebase Auth
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

---

## Password Migration Strategy

**Challenge**: bcrypt hashes cannot be imported into Firebase Auth.

**Solution**:
1. All migrated users have temporary random passwords
2. Users MUST reset passwords via Firebase password reset flow
3. Password reset emails sent to all 57 migrated users
4. Users click link → set new password → can login

**User Experience**:
- First login attempt fails with "Invalid credentials"
- User clicks "Forgot Password"
- Receives Firebase password reset email
- Sets new password
- Can now login successfully

---

## Code Patterns Removed

### **1. Password Hashing (bcrypt)**

```typescript
// ❌ OLD (NextAuth)
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.passwordHash);
```

```typescript
// ✅ NEW (Firebase manages internally)
await signUp({ email, password, ... });
await signIn(email, password);
```

---

### **2. Email Verification Tokens**

```typescript
// ❌ OLD (NextAuth custom tokens)
const token = crypto.randomBytes(32).toString('hex');
await prisma.email_verification_tokens.create({
  email,
  token,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
});
```

```typescript
// ✅ NEW (Firebase manages)
await sendEmailVerification(user); // Firebase SDK
```

---

### **3. Session Management**

```typescript
// ❌ OLD (NextAuth JWT + database sessions)
export const authConfig = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: { jwt, session }
};
```

```typescript
// ✅ NEW (Firebase ID tokens)
import { getAuth } from 'firebase/auth';
const user = getAuth().currentUser;
const idToken = await user.getIdToken(); // Auto-refreshes
```

---

## Testing Archived Code

**DO NOT use this code in production.** For historical testing only:

### **Local Setup** (if needed for reference)

1. Restore PostgreSQL database from backup
2. Install NextAuth dependencies: `npm install next-auth@beta bcrypt`
3. Set environment variables (NEXTAUTH_SECRET, DATABASE_URL)
4. Uncomment NextAuth routes in `src/app/api/auth/[...nextauth]/route.ts`
5. Run migration: `npx prisma migrate deploy`

---

## Related Documentation

- **Phase 4 Task 1 AAR**: `000-docs/201-AA-MAAR-hustle-phase4-task1-prisma-to-firestore-migration.md`
- **Phase 4 Task 2 AAR**: `000-docs/202-AA-MAAR-hustle-phase4-task2-remove-prisma-from-live-code.md`
- **Firebase Auth Guide**: `000-docs/189-AA-SUMM-hustle-step-1-auth-wiring-complete.md`

---

## Archive Maintenance

**DO NOT**:
- Import these files into active runtime
- Use NextAuth configuration in production
- Restore database sessions table

**DO**:
- Keep for historical reference
- Refer to for business logic understanding
- Use for migration documentation

---

**Archive Created**: 2025-11-16
**Last Active**: Phase 3 (November 2025)
**Status**: Read-Only Reference

---
