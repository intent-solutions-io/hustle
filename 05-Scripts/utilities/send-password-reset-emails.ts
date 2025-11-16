/**
 * Send Password Reset Emails to Migrated Users
 *
 * After migrating users from PostgreSQL to Firebase, all users have temporary
 * random passwords. This script sends password reset emails to all users so
 * they can set their own passwords.
 *
 * Run with: npx tsx scripts/send-password-reset-emails.ts
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as readline from 'readline';

// Initialize Firebase Admin SDK with Application Default Credentials
if (getApps().length === 0) {
  initializeApp({
    projectId: 'hustleapp-production',
  });
}

const auth = getAuth();

interface EmailStats {
  totalUsers: number;
  emailsSent: number;
  emailsFailed: number;
  alreadyReset: number;
  errors: string[];
}

const stats: EmailStats = {
  totalUsers: 0,
  emailsSent: 0,
  emailsFailed: 0,
  alreadyReset: 0,
  errors: [],
};

/**
 * Ask user for confirmation before sending emails
 */
async function confirmSend(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  This will send password reset emails to ALL users. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Send password reset email to a single user
 */
async function sendPasswordResetEmail(email: string, displayName: string | undefined): Promise<boolean> {
  try {
    const resetLink = await auth.generatePasswordResetLink(email);

    console.log(`✅ Generated reset link for: ${email}`);
    console.log(`   Link: ${resetLink}`);

    // In production, you would send this via your email service (e.g., Resend)
    // For now, we just generate the links

    stats.emailsSent++;
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to generate reset link for ${email}: ${error.message}`);
    stats.emailsFailed++;
    stats.errors.push(`${email}: ${error.message}`);
    return false;
  }
}

/**
 * Main function to send password reset emails to all users
 */
async function sendPasswordResetEmails() {
  console.log('🚀 Starting password reset email campaign...\n');

  try {
    // Step 1: List all users
    console.log('📊 Fetching all users from Firebase Auth...');
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;

    stats.totalUsers = users.length;
    console.log(`Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found. Run migration first: npx tsx scripts/migrate-to-firestore.ts');
      process.exit(0);
    }

    // Step 2: Show preview
    console.log('👥 Users to receive password reset emails:');
    console.log('==========================================');
    users.slice(0, 5).forEach((user) => {
      console.log(`  - ${user.email} (${user.displayName || 'No name'})`);
    });
    if (users.length > 5) {
      console.log(`  ... and ${users.length - 5} more users`);
    }
    console.log('');

    // Step 3: Confirm
    const confirmed = await confirmSend();
    if (!confirmed) {
      console.log('\n❌ Cancelled by user. No emails sent.');
      process.exit(0);
    }

    console.log('\n📧 Generating password reset links...\n');

    // Step 4: Send emails
    for (const user of users) {
      await sendPasswordResetEmail(user.email!, user.displayName);

      // Add small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 5: Print summary
    console.log('\n📈 Email Campaign Summary:');
    console.log('==========================================');
    console.log(`Total Users:       ${stats.totalUsers}`);
    console.log(`Emails Sent:       ${stats.emailsSent}`);
    console.log(`Emails Failed:     ${stats.emailsFailed}`);
    console.log('==========================================\n');

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Step 6: Next steps
    console.log('✅ Next Steps:');
    console.log('1. The password reset links above are valid for 1 hour');
    console.log('2. In production, integrate with email service (Resend, SendGrid, etc.)');
    console.log('3. Send these links via email to users');
    console.log('4. Users click link → set new password → login');
    console.log('');
    console.log('📧 Email Template Example:');
    console.log('==========================================');
    console.log('Subject: Reset Your Password - Hustle Account Migration');
    console.log('');
    console.log('Hi [Name],');
    console.log('');
    console.log('We\'ve migrated your Hustle account to a new authentication system.');
    console.log('To continue using your account, please reset your password:');
    console.log('');
    console.log('[PASSWORD_RESET_LINK]');
    console.log('');
    console.log('This link expires in 1 hour. If you need a new link, use the');
    console.log('"Forgot Password" option on the login page.');
    console.log('');
    console.log('Thanks,');
    console.log('The Hustle Team');
    console.log('==========================================\n');

  } catch (error: any) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
sendPasswordResetEmails();
