/**
 * PostgreSQL to Firebase Migration Script
 *
 * Migrates data from PostgreSQL (Prisma) to Firebase (Auth + Firestore).
 *
 * Migration Strategy:
 * 1. Export users from PostgreSQL
 * 2. Create Firebase Auth accounts (email/password)
 * 3. Create Firestore user documents
 * 4. Export players and games (when data exists)
 *
 * Password Strategy:
 * - Passwords are bcrypt hashed in PostgreSQL
 * - Firebase Auth uses scrypt (not compatible)
 * - Solution: Set random passwords, send password reset emails
 * - Users will reset passwords on first login
 *
 * Usage:
 *   Dry Run:  DRY_RUN=true npx tsx 05-Scripts/migration/migrate-to-firestore.ts
 *   Live Run: npx tsx 05-Scripts/migration/migrate-to-firestore.ts
 */

import { PrismaClient, User, Player, Game } from '@prisma/client';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

// Dry run mode (set DRY_RUN=true to preview without writing)
const DRY_RUN = process.env.DRY_RUN === 'true';

// Initialize Firebase Admin SDK with Application Default Credentials
if (getApps().length === 0) {
  initializeApp({
    projectId: 'hustleapp-production',
  });
}

const prisma = new PrismaClient();
const adminAuth = getAuth();
const adminDb = getFirestore();

interface MigrationStats {
  usersTotal: number;
  usersSuccess: number;
  usersFailed: number;
  playersTotal: number;
  playersSuccess: number;
  playersFailed: number;
  gamesTotal: number;
  gamesSuccess: number;
  gamesFailed: number;
  errors: string[];
}

const stats: MigrationStats = {
  usersTotal: 0,
  usersSuccess: 0,
  usersFailed: 0,
  playersTotal: 0,
  playersSuccess: 0,
  playersFailed: 0,
  gamesTotal: 0,
  gamesSuccess: 0,
  gamesFailed: 0,
  errors: [],
};

/**
 * Generate random password for temporary Firebase Auth accounts
 * Users will reset their passwords via email
 */
function generateRandomPassword(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Migrate a single user from PostgreSQL to Firebase Auth + Firestore
 */
async function migrateUser(user: User): Promise<string | null> {
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would migrate user: ${user.email} (UID: ${user.id})`);
      stats.usersSuccess++;
      return user.id; // Return PostgreSQL ID as mock UID
    }

    // Step 1: Create Firebase Auth account
    const tempPassword = generateRandomPassword();

    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        uid: user.id, // Use PostgreSQL CUID as Firebase UID
        email: user.email,
        emailVerified: !!user.emailVerified,
        displayName: `${user.firstName} ${user.lastName}`,
        password: tempPassword, // Temporary password
      });
      console.log(`✅ Created Firebase Auth user: ${user.email}`);
    } catch (authError: unknown) {
      const error = authError as { code?: string };
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  Firebase Auth user already exists: ${user.email}`);
        // Get existing user
        firebaseUser = await adminAuth.getUserByEmail(user.email);
      } else {
        throw authError;
      }
    }

    // Step 2: Create Firestore user document
    const userDoc: Record<string, unknown> = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || null,
      emailVerified: !!user.emailVerified,
      agreedToTerms: user.agreedToTerms || false,
      agreedToPrivacy: user.agreedToPrivacy || false,
      isParentGuardian: user.isParentGuardian || false,
      termsAgreedAt: user.termsAgreedAt ? Timestamp.fromDate(new Date(user.termsAgreedAt)) : null,
      privacyAgreedAt: user.privacyAgreedAt ? Timestamp.fromDate(new Date(user.privacyAgreedAt)) : null,
      createdAt: Timestamp.fromDate(new Date(user.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(user.updatedAt)),
    };

    // Only add verificationPinHash if it exists in the database
    if ('verificationPinHash' in user && user.verificationPinHash) {
      userDoc.verificationPinHash = user.verificationPinHash;
    }

    await adminDb.collection('users').doc(firebaseUser.uid).set(userDoc);
    console.log(`✅ Created Firestore user document: ${user.email}`);

    stats.usersSuccess++;
    return firebaseUser.uid;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`❌ Failed to migrate user ${user.email}:`, err.message);
    stats.usersFailed++;
    stats.errors.push(`User ${user.email}: ${err.message}`);
    return null;
  }
}

/**
 * Migrate a single player from PostgreSQL to Firestore subcollection
 */
async function migratePlayer(player: Player, parentFirebaseUid: string): Promise<void> {
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would migrate player: ${player.name} (parent: ${parentFirebaseUid})`);
      stats.playersSuccess++;
      return;
    }

    const playerDoc = {
      name: player.name,
      birthday: Timestamp.fromDate(player.birthday),
      position: player.position,
      teamClub: player.teamClub,
      photoUrl: player.photoUrl || null,
      createdAt: Timestamp.fromDate(player.createdAt),
      updatedAt: Timestamp.fromDate(player.updatedAt),
    };

    // Create player in subcollection: users/{userId}/players/{playerId}
    await adminDb
      .collection('users')
      .doc(parentFirebaseUid)
      .collection('players')
      .doc(player.id)
      .set(playerDoc);

    console.log(`✅ Migrated player: ${player.name} (parent: ${parentFirebaseUid})`);
    stats.playersSuccess++;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`❌ Failed to migrate player ${player.name}:`, err.message);
    stats.playersFailed++;
    stats.errors.push(`Player ${player.name}: ${err.message}`);
  }
}

/**
 * Migrate a single game from PostgreSQL to Firestore subcollection
 */
async function migrateGame(game: Game, parentFirebaseUid: string, playerId: string): Promise<void> {
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would migrate game: ${game.opponent} (player: ${playerId})`);
      stats.gamesSuccess++;
      return;
    }

    const gameDoc = {
      date: Timestamp.fromDate(game.date),
      opponent: game.opponent,
      result: game.result,
      finalScore: game.finalScore,
      minutesPlayed: game.minutesPlayed,
      goals: game.goals,
      assists: game.assists,
      tackles: game.tackles,
      interceptions: game.interceptions,
      clearances: game.clearances,
      blocks: game.blocks,
      aerialDuelsWon: game.aerialDuelsWon,
      saves: game.saves,
      goalsAgainst: game.goalsAgainst,
      cleanSheet: game.cleanSheet,
      verified: game.verified,
      verifiedAt: game.verifiedAt ? Timestamp.fromDate(game.verifiedAt) : null,
      createdAt: Timestamp.fromDate(game.createdAt),
      updatedAt: Timestamp.fromDate(game.updatedAt),
    };

    // Create game in nested subcollection: users/{userId}/players/{playerId}/games/{gameId}
    await adminDb
      .collection('users')
      .doc(parentFirebaseUid)
      .collection('players')
      .doc(playerId)
      .collection('games')
      .doc(game.id)
      .set(gameDoc);

    console.log(`✅ Migrated game: ${game.opponent} (player: ${playerId})`);
    stats.gamesSuccess++;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`❌ Failed to migrate game ${game.id}:`, err.message);
    stats.gamesFailed++;
    stats.errors.push(`Game ${game.id}: ${err.message}`);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  if (DRY_RUN) {
    console.log('');
    console.log('='.repeat(60));
    console.log('🔍 DRY RUN MODE - NO DATA WILL BE WRITTEN');
    console.log('='.repeat(60));
    console.log('');
  }

  console.log('🚀 Starting PostgreSQL → Firebase migration...\n');

  try {
    // Step 1: Migrate Users
    console.log('📊 Step 1: Migrating Users from PostgreSQL to Firebase Auth + Firestore');
    const users = await prisma.users.findMany({
      orderBy: { createdAt: 'asc' },
    });

    stats.usersTotal = users.length;
    console.log(`Found ${users.length} users to migrate\n`);

    const userIdMap = new Map<string, string>(); // PostgreSQL ID → Firebase UID

    for (const user of users) {
      const firebaseUid = await migrateUser(user);
      if (firebaseUid) {
        userIdMap.set(user.id, firebaseUid);
      }
    }

    console.log(`\n✅ User migration complete: ${stats.usersSuccess}/${stats.usersTotal} successful\n`);

    // Step 2: Migrate Players
    console.log('📊 Step 2: Migrating Players to Firestore subcollections');
    const players = await prisma.Player.findMany({
      orderBy: { createdAt: 'asc' },
    });

    stats.playersTotal = players.length;
    console.log(`Found ${players.length} players to migrate\n`);

    const playerIdMap = new Map<string, { firebaseUid: string; playerId: string }>(); // PostgreSQL Player ID → Firebase paths

    for (const player of players) {
      const parentFirebaseUid = userIdMap.get(player.parentId);
      if (!parentFirebaseUid) {
        console.error(`❌ Skipping player ${player.name}: parent user not migrated`);
        stats.playersFailed++;
        continue;
      }

      await migratePlayer(player, parentFirebaseUid);
      playerIdMap.set(player.id, { firebaseUid: parentFirebaseUid, playerId: player.id });
    }

    console.log(`\n✅ Player migration complete: ${stats.playersSuccess}/${stats.playersTotal} successful\n`);

    // Step 3: Migrate Games
    console.log('📊 Step 3: Migrating Games to Firestore nested subcollections');
    const games = await prisma.Game.findMany({
      orderBy: { createdAt: 'asc' },
    });

    stats.gamesTotal = games.length;
    console.log(`Found ${games.length} games to migrate\n`);

    for (const game of games) {
      const playerPath = playerIdMap.get(game.playerId);
      if (!playerPath) {
        console.error(`❌ Skipping game ${game.id}: player not migrated`);
        stats.gamesFailed++;
        continue;
      }

      await migrateGame(game, playerPath.firebaseUid, playerPath.playerId);
    }

    console.log(`\n✅ Game migration complete: ${stats.gamesSuccess}/${stats.gamesTotal} successful\n`);

    // Print final statistics
    console.log('📈 Migration Summary:');
    console.log('==========================================');
    console.log(`Users:   ${stats.usersSuccess}/${stats.usersTotal} migrated (${stats.usersFailed} failed)`);
    console.log(`Players: ${stats.playersSuccess}/${stats.playersTotal} migrated (${stats.playersFailed} failed)`);
    console.log(`Games:   ${stats.gamesSuccess}/${stats.gamesTotal} migrated (${stats.gamesFailed} failed)`);
    console.log('==========================================\n');

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Success recommendations
    if (stats.usersSuccess > 0) {
      console.log('✅ Next Steps:');
      console.log('1. All migrated users have TEMPORARY PASSWORDS');
      console.log('2. Users MUST reset their passwords using "Forgot Password" flow');
      console.log('3. Send password reset emails to all users:');
      console.log('   - Use Firebase Auth API: sendPasswordResetEmail()');
      console.log('   - Or manually trigger from Firebase Console');
      console.log('4. Inform users to check their email for password reset link');
      console.log('5. Test login flow with a migrated user\n');
    }

  } catch (error: any) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate();
