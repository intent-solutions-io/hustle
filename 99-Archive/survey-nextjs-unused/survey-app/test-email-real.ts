/**
 * Test Thank You Email - Uses Real Template
 *
 * Sends actual thank you email using lib/email-templates.ts
 */

import { Resend } from 'resend';
import { config } from 'dotenv';
import { join } from 'path';
import { generateThankYouEmail } from './lib/email-templates';

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HUSTLE <thankyou@intentsolutions.io>';

async function testThankYouEmail() {
  console.log('🔄 Sending test thank you email with FULL LONG LETTER...\n');

  try {
    // Generate the actual thank you email content from lib/email-templates.ts
    const { subject, html, text } = generateThankYouEmail({
      recipientName: 'Jeremy',
    });

    console.log('📧 Subject:', subject);
    console.log('📧 From:', FROM_EMAIL);
    console.log('📝 Sending to: jeremy@intentsolutions.io\n');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'jeremy@intentsolutions.io',
      reply_to: 'jeremy@intentsolutions.io',
      subject: subject,
      html: html,
      text: text,
      tags: [
        { name: 'campaign', value: 'survey-thank-you' },
        { name: 'type', value: 'test' },
      ],
    });

    if (error) {
      console.error('❌ Email send failed:');
      console.error(error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📬 Check your inbox: jeremy@intentsolutions.io');
    console.log('🔗 View in Resend: https://resend.com/emails');
    console.log('\n✨ This email contains the FULL LONG personal letter!\n');

  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
  }
}

// Run the test
testThankYouEmail();
