/**
 * Create Test Session (Firebase Admin SDK)
 *
 * Generates a custom token for a test user and outputs a session cookie value.
 * Used for testing dashboard pages without going through full login flow.
 *
 * Usage: npx tsx 05-Scripts/utilities/create-test-session.ts <email>
 */

import { adminAuth } from '../../src/lib/firebase/admin';

async function createTestSession(email: string) {
  try {
    console.log(`\n🔐 Creating test session for: ${email}\n`);

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`✅ User found:`, {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
    });

    // Create custom token (valid for 1 hour)
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    console.log(`\n✅ Custom token created (exchange this for ID token via Firebase Auth)\n`);

    // For testing, we'll use the UID to create a session token
    // In production, the client exchanges customToken for ID token
    console.log(`\n📋 Test Session Cookie Value:\n`);
    console.log(`   Cookie Name: __session`);
    console.log(`   Cookie Value: (use custom token and exchange via Firebase client SDK)\n`);

    console.log(`⚠️  NOTE: For curl testing, you need to:`);
    console.log(`   1. Use Firebase client SDK to exchange customToken for ID token`);
    console.log(`   2. POST ID token to /api/auth/set-session`);
    console.log(`   3. Use returned session cookie for dashboard access\n`);

    return customToken;
  } catch (error: any) {
    console.error('\n❌ Error creating test session:', error.message);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx 05-Scripts/utilities/create-test-session.ts <email>');
  process.exit(1);
}

createTestSession(email)
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
