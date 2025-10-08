/**
 * Email Utility Functions
 *
 * @description Handles email sending via Resend API
 */

import { Resend } from 'resend';
import { generateThankYouEmail } from './email-templates';

// Lazy-initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Default sender email (must be verified domain with Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Hustle Survey <onboarding@resend.dev>';

interface SendThankYouEmailParams {
  recipientEmail: string;
  recipientName?: string;
  personalNote: string;
}

/**
 * Send thank you email to survey participant
 *
 * @param params - Email parameters
 * @returns Promise with email send result
 */
export async function sendThankYouEmail({
  recipientEmail,
  recipientName,
  personalNote,
}: SendThankYouEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Validate email address
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return {
        success: false,
        error: 'Invalid recipient email address',
      };
    }

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Generate email content
    const { subject, html, text } = generateThankYouEmail({
      recipientName,
      personalNote,
    });

    console.log(`[Email] Sending thank you email to: ${recipientEmail}`);

    // Get Resend client and send email
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
      text,
      // Add tags for tracking
      tags: [
        { name: 'campaign', value: 'survey-thank-you' },
        { name: 'type', value: 'transactional' },
      ],
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log(`[Email] Successfully sent to ${recipientEmail}, ID: ${data?.id}`);

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate Resend configuration
 *
 * @returns Boolean indicating if Resend is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
