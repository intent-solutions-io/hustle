import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Migration API endpoint
 * Runs database schema creation using the complete Prisma schema
 * This is safe to run multiple times (uses IF NOT EXISTS)
 *
 * POST /api/migrate
 */
export async function POST() {
  try {
    console.log('[Migration] Starting database schema migration...');

    // Create tables one by one (PostgreSQL doesn't support multiple statements in prepared queries)
    const createTableStatements = [
      // Users table
      `CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "emailVerified" TIMESTAMP(3),
          "phone" TEXT,
          "password" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
          "agreedToPrivacy" BOOLEAN NOT NULL DEFAULT false,
          "isParentGuardian" BOOLEAN NOT NULL DEFAULT false,
          "termsAgreedAt" TIMESTAMP(3),
          "privacyAgreedAt" TIMESTAMP(3),
          "verificationPinHash" TEXT,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )`,

      // Player table
      `CREATE TABLE IF NOT EXISTS "Player" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "birthday" TIMESTAMP(3) NOT NULL,
          "position" TEXT NOT NULL,
          "teamClub" TEXT NOT NULL,
          "photoUrl" TEXT,
          "parentId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
      )`,

      // Game table
      `CREATE TABLE IF NOT EXISTS "Game" (
          "id" TEXT NOT NULL,
          "playerId" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "opponent" TEXT NOT NULL,
          "result" TEXT NOT NULL,
          "finalScore" TEXT NOT NULL,
          "minutesPlayed" INTEGER NOT NULL,
          "goals" INTEGER NOT NULL DEFAULT 0,
          "assists" INTEGER NOT NULL DEFAULT 0,
          "tackles" INTEGER,
          "interceptions" INTEGER,
          "clearances" INTEGER,
          "blocks" INTEGER,
          "aerialDuelsWon" INTEGER,
          "saves" INTEGER,
          "goalsAgainst" INTEGER,
          "cleanSheet" BOOLEAN,
          "verified" BOOLEAN NOT NULL DEFAULT false,
          "verifiedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
      )`,

      // Accounts table
      `CREATE TABLE IF NOT EXISTS "accounts" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          "refresh_token" TEXT,
          "access_token" TEXT,
          "expires_at" INTEGER,
          "token_type" TEXT,
          "scope" TEXT,
          "id_token" TEXT,
          "session_state" TEXT,
          CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
      )`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
      )`,

      // Verification tokens table
      `CREATE TABLE IF NOT EXISTS "verification_tokens" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL
      )`,

      // Password reset tokens table
      `CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
          "id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
      )`,

      // Email verification tokens table
      `CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
          "id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
      )`,

      // Waitlist table
      `CREATE TABLE IF NOT EXISTS "waitlist" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "firstName" TEXT,
          "lastName" TEXT,
          "source" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
      )`,
    ];

    // Execute all CREATE TABLE statements
    for (const sql of createTableStatements) {
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('[Migration] Created tables successfully');

    // Create indexes
    const indexStatements = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")',
      'CREATE INDEX IF NOT EXISTS "Player_parentId_createdAt_idx" ON "Player"("parentId", "createdAt" DESC)',
      'CREATE INDEX IF NOT EXISTS "Game_playerId_idx" ON "Game"("playerId")',
      'CREATE INDEX IF NOT EXISTS "Game_verified_idx" ON "Game"("verified")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token")',
      'CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token")',
      'CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId")',
      'CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_idx" ON "password_reset_tokens"("expires")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_token_key" ON "email_verification_tokens"("token")',
      'CREATE INDEX IF NOT EXISTS "email_verification_tokens_token_idx" ON "email_verification_tokens"("token")',
      'CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId")',
      'CREATE INDEX IF NOT EXISTS "email_verification_tokens_expires_idx" ON "email_verification_tokens"("expires")',
      'CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_email_key" ON "waitlist"("email")',
      'CREATE INDEX IF NOT EXISTS "waitlist_email_idx" ON "waitlist"("email")',
      'CREATE INDEX IF NOT EXISTS "waitlist_createdAt_idx" ON "waitlist"("createdAt")',
    ];

    // Execute all CREATE INDEX statements
    for (const sql of indexStatements) {
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('[Migration] Created indexes successfully');

    // Add foreign keys (these may already exist, so we'll catch errors)
    const foreignKeys = [
      'ALTER TABLE "Player" ADD CONSTRAINT "Player_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    ];

    for (const fkSql of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fkSql);
      } catch (error) {
        // Foreign key likely already exists - this is expected
        console.log(`[Migration] Foreign key constraint already exists or error: ${error instanceof Error ? error.message.substring(0, 100) : 'Unknown'}`);
      }
    }

    console.log('[Migration] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migrations applied successfully',
      timestamp: new Date().toISOString(),
      tablesCreated: createTableStatements.length,
      indexesCreated: indexStatements.length,
      foreignKeysAdded: foreignKeys.length,
    });

  } catch (error) {
    console.error('[Migration] Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
