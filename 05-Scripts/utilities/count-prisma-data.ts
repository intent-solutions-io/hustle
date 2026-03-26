/**
 * Count data in PostgreSQL via Prisma
 * Quick inventory script for migration planning
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countData() {
  try {
    console.log('\n📊 PostgreSQL Data Inventory\n');
    console.log('='.repeat(50));

    const usersCount = await prisma.users.count();
    const playersCount = await prisma.player.count();
    const gamesCount = await prisma.game.count();
    const accountsCount = await prisma.accounts.count();
    const sessionsCount = await prisma.sessions.count();
    const verificationTokensCount = await prisma.verification_tokens.count();
    const emailVerificationTokensCount = await prisma.email_verification_tokens.count();
    const passwordResetTokensCount = await prisma.password_reset_tokens.count();

    console.log(`\n📦 Core Data (to be migrated):`);
    console.log(`   Users:    ${usersCount}`);
    console.log(`   Players:  ${playersCount}`);
    console.log(`   Games:    ${gamesCount}`);

    console.log(`\n🔐 Auth Data (legacy NextAuth - to be archived):`);
    console.log(`   Accounts:                     ${accountsCount}`);
    console.log(`   Sessions:                     ${sessionsCount}`);
    console.log(`   Verification Tokens:          ${verificationTokensCount}`);
    console.log(`   Email Verification Tokens:    ${emailVerificationTokensCount}`);
    console.log(`   Password Reset Tokens:        ${passwordResetTokensCount}`);

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Total records: ${usersCount + playersCount + gamesCount + accountsCount + sessionsCount + verificationTokensCount + emailVerificationTokensCount + passwordResetTokensCount}\n`);

    // Sample user data (no PII)
    if (usersCount > 0) {
      const sampleUsers = await prisma.users.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          agreedToTerms: true,
          _count: {
            select: { Player: true },
          },
        },
      });

      console.log('📝 Sample Users (first 3):');
      sampleUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Email Verified: ${!!user.emailVerified}`);
        console.log(`      Players: ${user._count.Player}`);
        console.log(`      Created: ${user.createdAt.toISOString()}`);
      });
      console.log('');
    }
  } catch (error: any) {
    console.error('❌ Error counting data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

countData();
