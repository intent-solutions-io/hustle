#!/usr/bin/env tsx

/**
 * Manually Verify Email (Dev/Test Only)
 *
 * Marks a user's email as verified in Firebase Auth.
 * Use this for testing when you don't want to click email verification links.
 */

import { adminAuth } from '../../src/lib/firebase/admin';

async function verifyEmail(email: string) {
  console.log(`\n📧 Manually verifying email for: ${email}\n`);

  try {
    const user = await adminAuth.getUserByEmail(email);

    await adminAuth.updateUser(user.uid, {
      emailVerified: true
    });

    console.log('✅ Email verified successfully!');
    console.log(`   - UID: ${user.uid}`);
    console.log(`   - Email: ${user.email}\n`);

    return true;
  } catch (error: any) {
    console.error('❌ Error verifying email:', error.message);
    return false;
  }
}

// Main execution
const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx verify-email-manual.ts <email>');
  process.exit(1);
}

verifyEmail(email)
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
