import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Run the migration SQL directly
    await prisma.$executeRawUnsafe(`
      -- CreateTable
      CREATE TABLE IF NOT EXISTS "Parent" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "pin" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      -- CreateTable
      CREATE TABLE IF NOT EXISTS "Player" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "grade" INTEGER NOT NULL,
          "position" TEXT NOT NULL,
          "teamClub" TEXT NOT NULL,
          "parentId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      -- CreateTable
      CREATE TABLE IF NOT EXISTS "Game" (
          "id" TEXT NOT NULL,
          "playerId" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "opponent" TEXT NOT NULL,
          "result" TEXT NOT NULL,
          "finalScore" TEXT NOT NULL,
          "minutesPlayed" INTEGER NOT NULL,
          "goals" INTEGER NOT NULL DEFAULT 0,
          "assists" INTEGER NOT NULL DEFAULT 0,
          "saves" INTEGER,
          "goalsAgainst" INTEGER,
          "cleanSheet" BOOLEAN,
          "verified" BOOLEAN NOT NULL DEFAULT false,
          "verifiedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Parent_email_key" ON "Parent"("email");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Game_playerId_idx" ON "Game"("playerId");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Game_verified_idx" ON "Game"("verified");
    `)

    // Add foreign keys if they don't exist (this will error if they exist, so we'll ignore)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Player" ADD CONSTRAINT "Player_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)
    } catch {
      // Constraint already exists
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `)
    } catch {
      // Constraint already exists
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Database migrations applied successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
