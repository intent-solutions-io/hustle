#!/usr/bin/env tsx

/**
 * Verify Firebase User Creation
 *
 * Checks that a user exists in both Firebase Auth and Firestore.
 */

import { adminAuth, adminDb } from '../src/lib/firebase/admin';

async function verifyUser(email: string) {
  console.log(`\n🔍 Verifying user: ${email}\n`);

  try {
    // Check Firebase Auth
    console.log('1. Checking Firebase Authentication...');
    const authUser = await adminAuth.getUserByEmail(email);
    console.log('✅ User found in Firebase Auth:');
    console.log(`   - UID: ${authUser.uid}`);
    console.log(`   - Email: ${authUser.email}`);
    console.log(`   - Email Verified: ${authUser.emailVerified}`);
    console.log(`   - Display Name: ${authUser.displayName}`);
    console.log(`   - Created: ${authUser.metadata.creationTime}`);

    // Check Firestore
    console.log('\n2. Checking Firestore users collection...');
    const userDoc = await adminDb.collection('users').doc(authUser.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User document found in Firestore:');
      console.log(`   - First Name: ${userData?.firstName}`);
      console.log(`   - Last Name: ${userData?.lastName}`);
      console.log(`   - Email: ${userData?.email}`);
      console.log(`   - Phone: ${userData?.phone || 'N/A'}`);
      console.log(`   - Created At: ${userData?.createdAt?.toDate?.()}`);
      console.log(`   - Agreed to Terms: ${userData?.agreedToTerms}`);
      console.log(`   - Agreed to Privacy: ${userData?.agreedToPrivacy}`);
      console.log(`   - Is Parent/Guardian: ${userData?.isParentGuardian}`);
    } else {
      console.log('❌ User document NOT found in Firestore');
      return false;
    }

    console.log('\n✅ User verification successful!');
    console.log('Firebase Auth + Firestore are working correctly.\n');
    return true;

  } catch (error: any) {
    console.error('❌ Error verifying user:', error.message);
    return false;
  }
}

// Main execution
const email = process.argv[2] || 'test-firebase-step1@example.com';
verifyUser(email)
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
