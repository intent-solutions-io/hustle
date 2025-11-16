/**
 * Cleanup Script: Delete All Test Users and Workspaces
 *
 * DANGER: This script DELETES ALL Firebase Auth users and Firestore data.
 * Only run this on test/dev environments or when explicitly cleaning production test data.
 *
 * Usage:
 *   npx tsx scripts/maintenance/cleanup-all-test-users-and-workspaces.ts
 *
 * What it does:
 *   1. Deletes all Firebase Auth users
 *   2. Deletes all Firestore /users/{uid} documents
 *   3. Deletes all Firestore /workspaces/{id} documents
 *   4. Optionally deletes players and games (commented out by default)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

/**
 * Delete all Firebase Auth users
 */
async function deleteAllAuthUsers() {
  console.log('\n🔥 Deleting all Firebase Auth users...');

  let nextPageToken: string | undefined = undefined;
  let totalCount = 0;

  do {
    const result = await auth.listUsers(1000, nextPageToken);

    if (result.users.length === 0) {
      console.log('   No more users to delete.');
      break;
    }

    const uids = result.users.map((u) => u.uid);
    await auth.deleteUsers(uids);

    totalCount += uids.length;
    console.log(`   Deleted ${uids.length} users in this batch. Total: ${totalCount}`);

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`✅ Done. Total Auth users deleted: ${totalCount}\n`);
}

/**
 * Delete all documents in a Firestore collection
 */
async function deleteCollection(collectionName: string) {
  console.log(`🔥 Deleting all docs in collection "${collectionName}"...`);

  const snap = await db.collection(collectionName).get();

  if (snap.empty) {
    console.log(`   No docs found in "${collectionName}", skipping.\n`);
    return;
  }

  const batchSize = 300; // Firestore batch write limit is 500
  let docs = snap.docs;
  let totalDeleted = 0;

  while (docs.length > 0) {
    const batch = db.batch();
    const chunk = docs.splice(0, batchSize);

    for (const doc of chunk) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    totalDeleted += chunk.length;
    console.log(`   Deleted ${chunk.length} docs from "${collectionName}". Total: ${totalDeleted}`);
  }

  console.log(`✅ Finished deleting "${collectionName}". Total: ${totalDeleted}\n`);
}

/**
 * Delete subcollections for a parent document
 * (Only needed if you want to clean up players/games nested under users)
 */
async function deleteSubcollections(parentPath: string, subcollections: string[]) {
  console.log(`🔥 Deleting subcollections under "${parentPath}"...`);

  for (const subcollection of subcollections) {
    const snap = await db.collection(parentPath).doc('*').collection(subcollection).get();

    if (snap.empty) {
      console.log(`   No docs in "${parentPath}/*/${subcollection}", skipping.`);
      continue;
    }

    // Similar batch delete logic as deleteCollection
    const batchSize = 300;
    let docs = snap.docs;

    while (docs.length > 0) {
      const batch = db.batch();
      const chunk = docs.splice(0, batchSize);

      for (const doc of chunk) {
        batch.delete(doc.ref);
      }

      await batch.commit();
      console.log(`   Deleted ${chunk.length} docs from "${parentPath}/*/${subcollection}"`);
    }
  }

  console.log(`✅ Finished deleting subcollections under "${parentPath}"\n`);
}

/**
 * Main cleanup execution
 */
async function main() {
  try {
    console.log('\n========================================');
    console.log('  HUSTLE TEST DATA CLEANUP');
    console.log('========================================');
    console.log('⚠️  WARNING: This will DELETE ALL users and workspaces!');
    console.log('⚠️  Only run this if you are CERTAIN you want to wipe all test data.');
    console.log('========================================\n');

    // Safety check: Require explicit confirmation via environment variable
    if (process.env.CONFIRM_CLEANUP !== 'yes') {
      console.error('❌ Safety check failed.');
      console.error('   To run this script, set environment variable:');
      console.error('   CONFIRM_CLEANUP=yes npx tsx scripts/maintenance/cleanup-all-test-users-and-workspaces.ts\n');
      process.exit(1);
    }

    console.log('✅ Confirmation received. Starting cleanup...\n');

    // Step 1: Delete all Firebase Auth users
    await deleteAllAuthUsers();

    // Step 2: Delete all Firestore user documents
    await deleteCollection('users');

    // Step 3: Delete all Firestore workspace documents
    await deleteCollection('workspaces');

    // Step 4 (Optional): Delete other test collections
    // Uncomment if you want to also delete players, games, etc.
    // await deleteCollection('players');
    // await deleteCollection('games');
    // await deleteCollection('waitlist');

    // Step 5 (Optional): Delete nested subcollections
    // If you have players/games as subcollections under users, use this:
    // await deleteSubcollections('users', ['players', 'games']);

    console.log('========================================');
    console.log('✅ CLEANUP COMPLETE');
    console.log('========================================');
    console.log('   All Firebase Auth users deleted.');
    console.log('   All Firestore user docs deleted.');
    console.log('   All Firestore workspace docs deleted.');
    console.log('   Project is now a clean slate.\n');

    process.exit(0);
  } catch (err: any) {
    console.error('\n========================================');
    console.error('❌ CLEANUP FAILED');
    console.error('========================================');
    console.error(err.message);
    console.error(err.stack);
    console.error('\n');
    process.exit(1);
  }
}

// Run cleanup
main();
