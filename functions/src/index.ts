/**
 * Hustle A2A Agent System - Cloud Functions
 *
 * This file contains the Cloud Functions that interface with Vertex AI agents.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getA2AClient } from './a2a-client';
import { sendEmail } from './email-service';
import { emailTemplates } from './email-templates';

// Initialize Firebase Admin
admin.initializeApp();

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
