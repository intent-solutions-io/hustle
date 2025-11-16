/**
 * Hustle A2A Agent System - Cloud Functions
 *
 * This file contains the Cloud Functions that interface with Vertex AI agents.
 * Phase 6 Task 3: Added scheduled trial reminder emails
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getA2AClient } from './a2a-client';
import { sendEmail } from './email-service';
import { emailTemplates } from './email-templates';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Orchestrator Agent Entry Point
 *
 * Receives requests from the frontend and routes them to the appropriate
 * Vertex AI agent for processing.
 *
 * Example call:
 * ```typescript
 * const result = await functions.httpsCallable('orchestrator')({
 *   intent: 'user_registration',
 *   data: {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     password: 'SecurePass123!'
 *   }
 * });
 * ```
 */
export const orchestrator = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 30,
    memory: '512MB'
  })
  .https.onCall(async (data, context) => {
    try {
      const { intent, data: requestData } = data;

      // Validate authentication for most intents
      if (intent !== 'user_registration' && !context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Must be authenticated to perform this action'
        );
      }

      // Log request
      console.log(`Orchestrator received intent: ${intent}`, {
        userId: context.auth?.uid,
        requestId: context.instanceIdToken
      });

      // Call Vertex AI agent via A2A protocol
      const a2aClient = getA2AClient();
      const response = await a2aClient.sendTask({
        intent,
        data: requestData,
        auth: context.auth
          ? {
              uid: context.auth.uid,
              email: context.auth.token.email,
            }
          : undefined,
      });

      return response;
    } catch (error) {
      console.error('Orchestrator error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'An error occurred processing your request'
      );
    }
  });

/**
 * NOTE: Intent handling is now performed by Vertex AI agents via A2A protocol.
 * The orchestrator agent coordinates validation, creation, onboarding, and analytics agents.
 *
 * This Cloud Function now serves as a thin API gateway that:
 * 1. Receives requests from the frontend
 * 2. Forwards them to the Vertex AI orchestrator agent
 * 3. Returns the agent's response
 *
 * All business logic, validation, and orchestration is handled by the agents.
 */

/**
 * Validation Agent
 *
 * Handles input validation and security checks
 */
export const validationAgent = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 10,
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // TODO: Implement validation logic
    return { valid: true, errors: [] };
  });

/**
 * User Creation Agent
 *
 * Handles user and player creation in Firestore
 */
export const userCreationAgent = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 15,
    memory: '512MB'
  })
  .https.onCall(async (data, context) => {
    // TODO: Implement user creation logic
    return { userId: 'created-id', created: true };
  });

/**
 * Onboarding Agent
 *
 * Handles welcome emails and onboarding flow
 */
export const onboardingAgent = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 20,
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // TODO: Implement onboarding logic
    return { emailSent: true, tokenId: 'token-id' };
  });

/**
 * Analytics Agent
 *
 * Handles metrics tracking and dashboard updates
 */
export const analyticsAgent = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 10,
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // TODO: Implement analytics logic
    return { tracked: true };
  });

/**
 * Send Welcome Email on User Creation
 *
 * Automatically triggered when a new user is created in Firebase Auth.
 * Sends a branded welcome email via Resend.
 *
 * Note: Firebase also sends a verification email automatically.
 * This is a separate branded welcome message.
 */
export const sendWelcomeEmail = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 30,
    memory: '256MB'
  })
  .auth.user().onCreate(async (user) => {
    try {
      console.log(`[WelcomeEmail] Triggered for new user: ${user.email}`);

      // Get user's first name from Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      const userData = userDoc.data();
      const firstName = userData?.firstName || user.displayName?.split(' ')[0] || 'there';

      console.log(`[WelcomeEmail] Sending welcome email to: ${user.email} (${firstName})`);

      // Send welcome email via Resend
      const template = emailTemplates.welcome(firstName);
      await sendEmail({
        to: user.email!,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[WelcomeEmail] Successfully sent welcome email to: ${user.email}`);

      return {
        success: true,
        email: user.email,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[WelcomeEmail] Error sending welcome email:', error);

      // Don't throw - we don't want to block user creation if email fails
      // Just log the error and continue
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        email: user.email,
        timestamp: new Date().toISOString(),
      };
    }
  });


/**
 * Daily Trial Reminder Emails (Phase 6 Task 3)
 *
 * Scheduled function that runs daily at 9:00 AM UTC to check for trials
 * ending in 3 days and send reminder emails.
 *
 * Schedule: every day at 09:00 (UTC)
 */
export const sendTrialReminders = functions
  .region("us-central1")
  .pubsub.schedule("0 9 * * *") // Every day at 9:00 AM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("[TrialReminders] Starting daily trial reminder check");

      // Calculate date 3 days from now (midnight)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(0, 0, 0, 0);

      // Calculate date 4 days from now (to create a range)
      const fourDaysFromNow = new Date();
      fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
      fourDaysFromNow.setHours(0, 0, 0, 0);

      // Query workspaces with trial status and trialEndsAt in range
      const workspaces = await db
        .collection("workspaces")
        .where("status", "==", "trial")
        .where("trialEndsAt", ">=", admin.firestore.Timestamp.fromDate(threeDaysFromNow))
        .where("trialEndsAt", "<", admin.firestore.Timestamp.fromDate(fourDaysFromNow))
        .get();

      console.log(`[TrialReminders] Found ${workspaces.size} workspaces with trials ending in 3 days`);

      let emailsSent = 0;
      let emailsFailed = 0;

      for (const workspaceDoc of workspaces.docs) {
        try {
          const workspaceData = workspaceDoc.data();

          // Find workspace owner
          const usersSnap = await db
            .collection("users")
            .where("defaultWorkspaceId", "==", workspaceDoc.id)
            .limit(1)
            .get();

          if (usersSnap.empty) {
            console.warn(`[TrialReminders] No user found for workspace ${workspaceDoc.id}`);
            continue;
          }

          const userData = usersSnap.docs[0].data();
          const userEmail = userData.email;
          const userName = userData.firstName || "User";

          if (\!userEmail) {
            console.warn(`[TrialReminders] User ${usersSnap.docs[0].id} has no email`);
            continue;
          }

          // Send trial ending soon email
          const template = emailTemplates.trialEndingSoon({
            name: userName,
            daysRemaining: 3,
            upgradeUrl: `${process.env.NEXTAUTH_URL}/billing/plans`,
          });

          const result = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });

          if (result.success) {
            emailsSent++;
            console.log(`[TrialReminders] Sent reminder to ${userEmail} (workspace: ${workspaceDoc.id})`);
          } else {
            emailsFailed++;
            console.error(`[TrialReminders] Failed to send to ${userEmail}:`, result.error);
          }
        } catch (error) {
          emailsFailed++;
          console.error(`[TrialReminders] Error processing workspace ${workspaceDoc.id}:`, error);
        }
      }

      console.log(`[TrialReminders] Complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

      return {
        success: true,
        workspacesChecked: workspaces.size,
        emailsSent,
        emailsFailed,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[TrialReminders] Fatal error:", error);
      throw error;
    }
  });

