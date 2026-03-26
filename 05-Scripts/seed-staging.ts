/**
 * Staging Environment Seed Script
 *
 * Creates stable test data in Firebase for E2E testing.
 *
 * Usage:
 *   npm run qa:seed:staging
 *
 * Environment Variables Required:
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (only if not already initialized)
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'hustleapp-production',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('❌ Missing Firebase credentials!');
    console.error('Required environment variables:');
    console.error('  - FIREBASE_PROJECT_ID (optional, defaults to hustleapp-production)');
    console.error('  - FIREBASE_CLIENT_EMAIL');
    console.error('  - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();
const auth = getAuth();

// Demo parent account credentials
const DEMO_PARENT_EMAIL = 'demo-parent@hustle-qa.test';
const DEMO_PARENT_PASSWORD = 'DemoParent123!';

/**
 * Seed staging environment with stable test data
 */
async function seedStaging() {
  console.log('🌱 Seeding staging environment...\n');

  try {
    // 1. Delete existing demo parent if exists
    console.log('Step 1: Cleaning up existing demo account...');
    try {
      const existingUser = await auth.getUserByEmail(DEMO_PARENT_EMAIL);
      await auth.deleteUser(existingUser.uid);
      console.log(`  ✓ Deleted existing user: ${DEMO_PARENT_EMAIL}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('  ℹ No existing user found (clean slate)');
      } else {
        throw error;
      }
    }

    // 2. Create fresh demo parent user
    console.log('\nStep 2: Creating demo parent account...');
    const parentUser = await auth.createUser({
      email: DEMO_PARENT_EMAIL,
      password: DEMO_PARENT_PASSWORD,
      emailVerified: true, // Skip email verification for testing
      displayName: 'Demo Parent',
    });
    console.log(`  ✓ Created demo parent: ${DEMO_PARENT_EMAIL}`);
    console.log(`  UID: ${parentUser.uid}`);

    // 3. Create Firestore user document
    console.log('\nStep 3: Creating Firestore user document...');
    await db.collection('users').doc(parentUser.uid).set({
      email: DEMO_PARENT_EMAIL,
      firstName: 'Demo',
      lastName: 'Parent',
      agreedToTerms: true,
      agreedToPrivacy: true,
      isParentGuardian: true,
      createdAt: new Date(),
      workspace: {
        id: `demo-workspace-${parentUser.uid}`,
        plan: 'FREE',
        status: 'ACTIVE',
        playerLimit: 2,
        storageLimit: 100 * 1024 * 1024, // 100MB
      },
    });
    console.log('  ✓ User document created in Firestore');

    // 4. Create demo player 1 (Attacking Midfielder)
    console.log('\nStep 4: Creating demo player 1 (Attacking Midfielder)...');
    const player1Ref = await db
      .collection('users')
      .doc(parentUser.uid)
      .collection('players')
      .add({
        name: 'Demo Player 1',
        birthday: '2010-06-15',
        primaryPosition: 'Attacking Midfielder',
        secondaryPositions: ['Central Midfielder'],
        league: 'ECNL Girls',
        teamClub: 'Demo FC',
        gender: 'female',
        createdAt: new Date(),
      });
    console.log(`  ✓ Player 1 created (ID: ${player1Ref.id})`);

    // 5. Create demo player 2 (Goalkeeper)
    console.log('\nStep 5: Creating demo player 2 (Goalkeeper)...');
    const player2Ref = await db
      .collection('users')
      .doc(parentUser.uid)
      .collection('players')
      .add({
        name: 'Demo Player 2',
        birthday: '2011-03-20',
        primaryPosition: 'Goalkeeper',
        secondaryPositions: [],
        league: 'MLS Next',
        teamClub: 'Keeper United',
        gender: 'male',
        createdAt: new Date(),
      });
    console.log(`  ✓ Player 2 created (ID: ${player2Ref.id})`);

    // 6. Create demo game for player 1
    console.log('\nStep 6: Creating demo game for Player 1...');
    const gameRef = await db
      .collection('users')
      .doc(parentUser.uid)
      .collection('players')
      .doc(player1Ref.id)
      .collection('games')
      .add({
        date: new Date('2024-11-01'),
        opponent: 'Rival FC',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
        assists: 2,
        tackles: 5,
        interceptions: 3,
        clearances: 2,
        createdAt: new Date(),
      });
    console.log(`  ✓ Game created (ID: ${gameRef.id})`);

    // 7. Create demo game for player 2 (goalkeeper stats)
    console.log('\nStep 7: Creating demo game for Player 2 (GK)...');
    const game2Ref = await db
      .collection('users')
      .doc(parentUser.uid)
      .collection('players')
      .doc(player2Ref.id)
      .collection('games')
      .add({
        date: new Date('2024-11-05'),
        opponent: 'Striker FC',
        result: 'Win',
        yourScore: 2,
        opponentScore: 0,
        minutesPlayed: 90,
        saves: 5,
        goalsAgainst: 0,
        cleanSheet: true,
        createdAt: new Date(),
      });
    console.log(`  ✓ GK game created (ID: ${game2Ref.id})`);

    console.log('\n✅ Staging seed complete!\n');
    console.log('═'.repeat(60));
    console.log('Demo Account Credentials:');
    console.log('═'.repeat(60));
    console.log(`Email:    ${DEMO_PARENT_EMAIL}`);
    console.log(`Password: ${DEMO_PARENT_PASSWORD}`);
    console.log(`User ID:  ${parentUser.uid}`);
    console.log(`Player 1: ${player1Ref.id} (Attacking Midfielder)`);
    console.log(`Player 2: ${player2Ref.id} (Goalkeeper)`);
    console.log('═'.repeat(60));
    console.log('\nUse these credentials in Playwright tests.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run seeding
seedStaging();
