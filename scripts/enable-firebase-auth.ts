/**
 * Enable Firebase Auth Email/Password Provider
 *
 * This script enables the email/password authentication provider in Firebase Auth.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK with Application Default Credentials
if (getApps().length === 0) {
  initializeApp({
    projectId: 'hustleapp-production',
  });
}

const auth = getAuth();

async function enableEmailProvider() {
  try {
    console.log('🔧 Attempting to enable Firebase Auth Email/Password provider...\n');

    // Try to import a test user (this will fail if auth is not configured)
    try {
      await auth.createUser({
        email: 'test-enable-auth@example.com',
        password: 'TestPassword123!',
        emailVerified: false,
      });
      console.log('✅ Firebase Auth Email/Password provider is already enabled!');
      console.log('✅ Created test user: test-enable-auth@example.com');

      // Clean up test user
      const testUser = await auth.getUserByEmail('test-enable-auth@example.com');
      await auth.deleteUser(testUser.uid);
      console.log('🗑️  Deleted test user\n');

    } catch (error: any) {
      if (error.code === 'auth/configuration-not-found') {
        console.error('❌ Firebase Auth Email/Password provider is NOT enabled.');
        console.error('');
        console.error('⚠️  MANUAL ACTION REQUIRED:');
        console.error('   You must enable the Email/Password provider in Firebase Console:');
        console.error('');
        console.error('   1. Go to: https://console.firebase.google.com/project/hustleapp-production/authentication');
        console.error('   2. Click "Get Started" button');
        console.error('   3. Click "Email/Password" in the Sign-in providers list');
        console.error('   4. Enable the first toggle: "Email/Password"');
        console.error('   5. Click "Save"');
        console.error('');
        console.error('   Then run the migration script again: npx tsx scripts/migrate-to-firestore.ts');
        console.error('');
        process.exit(1);
      } else {
        throw error;
      }
    }

  } catch (error: any) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

enableEmailProvider();
