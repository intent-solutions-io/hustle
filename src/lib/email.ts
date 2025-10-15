import { Resend } from 'resend';

// Lazy-initialize Resend to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || 'dummy-key-for-build';
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 *
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with success status
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text } = options;

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.EMAIL_FROM) {
    console.error('[Email] EMAIL_FROM not configured');
    return { success: false, error: 'Email sender not configured' };
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent to: ${to} - Subject: ${subject} - ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
