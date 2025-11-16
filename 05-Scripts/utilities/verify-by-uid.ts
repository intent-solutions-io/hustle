#!/usr/bin/env tsx

import { adminAuth, adminDb } from '../src/lib/firebase/admin';

async function verifyByUid(uid: string) {
  console.log(`\n🔍 Verifying user by UID: ${uid}\n`);

  try {
    const authUser = await adminAuth.getUser(uid);
    console.log('✅ User found in Firebase Auth:');
    console.log(`   - UID: ${authUser.uid}`);
    console.log(`   - Email: ${authUser.email}`);
    console.log(`   - Display Name: ${authUser.displayName}`);

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      console.log('✅ User document found in Firestore');
    } else {
      console.log('❌ User document NOT found in Firestore');
    }
    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

verifyByUid(process.argv[2] || 'TGsbB4ogF8furxuyHLmXEUmekts1')
  .then(s => process.exit(s ? 0 : 1))
  .catch(() => process.exit(1));
