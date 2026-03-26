#!/usr/bin/env npx ts-node
/**
 * Cleanup Test Accounts Script
 *
 * Deletes all Firebase Auth test accounts matching patterns:
 * - gymtest*@example.com
 * - e2e*@example.com
 * - test*@example.com
 *
 * Usage: npx ts-node 05-Scripts/cleanup-test-accounts.ts
 *
 * Note: Firebase Admin initialization mirrors src/lib/firebase/admin.ts
 * for consistency. Consider refactoring to a shared utility if this grows.
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin if not already done
// Supports multiple credential sources for flexibility
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Parse JSON from environment variable (used in CI/CD)
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (serviceAccountPath) {
    // Load from file path
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Use application default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

const auth = admin.auth();
const db = admin.firestore();

// Test email patterns to match
const TEST_EMAIL_PATTERNS = [
  /^gymtest\d*@example\.com$/i,
  /^e2etest\d*@example\.com$/i,
  /^test\d*@example\.com$/i,
  /^playwright.*@example\.com$/i,
];

function isTestEmail(email: string | undefined): boolean {
  if (!email) return false;
  return TEST_EMAIL_PATTERNS.some(pattern => pattern.test(email));
}

async function deleteUserFirestoreData(uid: string): Promise<void> {
  try {
    // Delete user document
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Delete players subcollection with parallel deletions for performance
      const playersSnapshot = await userRef.collection('players').get();
      const playerDeletionPromises = playersSnapshot.docs.map(async (playerDoc) => {
        // Delete games subcollection under each player
        const gamesSnapshot = await playerDoc.ref.collection('games').get();
        const gameDeletionPromises = gamesSnapshot.docs.map((gameDoc) => gameDoc.ref.delete());
        await Promise.all(gameDeletionPromises);
        await playerDoc.ref.delete();
      });
      await Promise.all(playerDeletionPromises);

      // Delete workspace if user owns one
      if (userData?.defaultWorkspaceId) {
        const workspaceRef = db.collection('workspaces').doc(userData.defaultWorkspaceId);
        const workspaceDoc = await workspaceRef.get();
        if (workspaceDoc.exists) {
          const workspaceData = workspaceDoc.data();
          // Only delete if this user is the owner
          if (workspaceData?.ownerUserId === uid) {
            await workspaceRef.delete();
            console.log(`  Deleted workspace: ${userData.defaultWorkspaceId}`);
          }
        }
      }

      // Delete user document
      await userRef.delete();
      console.log(`  Deleted Firestore user doc: ${uid}`);
    }
  } catch (error: any) {
    console.error(`  Error deleting Firestore data for ${uid}:`, error.message);
  }
}

async function cleanupTestAccounts(): Promise<void> {
  console.log('🧹 Starting test account cleanup...\n');

  let deletedCount = 0;
  let errorCount = 0;
  let nextPageToken: string | undefined;

  try {
    // List all users and filter for test accounts
    do {
      const listResult = await auth.listUsers(1000, nextPageToken);

      for (const user of listResult.users) {
        if (isTestEmail(user.email)) {
          console.log(`Found test account: ${user.email} (${user.uid})`);

          try {
            // Delete Firestore data first
            await deleteUserFirestoreData(user.uid);

            // Delete Firebase Auth user
            await auth.deleteUser(user.uid);
            console.log(`  ✓ Deleted Auth user: ${user.email}\n`);
            deletedCount++;
          } catch (deleteError: any) {
            console.error(`  ✗ Failed to delete ${user.email}: ${deleteError.message}\n`);
            errorCount++;
          }
        }
      }

      nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    console.log('\n========================================');
    console.log(`✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} test accounts`);
    console.log(`   Errors: ${errorCount}`);
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
