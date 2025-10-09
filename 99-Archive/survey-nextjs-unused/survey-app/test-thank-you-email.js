/**
 * Test Thank You Email with Gray Monochrome Theme
 *
 * Sends actual thank you email template to test recipient
 */

import { Resend } from 'resend';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HUSTLE <thankyou@intentsolutions.io>';

// Inline email template function
function generateThankYouEmail({ recipientName }) {
  const name = recipientName || 'there';

  const subject = '🎉 Thanks for Your Hustle Survey Response!';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; }
    .content p { margin: 0 0 20px; color: #4a5568; font-size: 16px; }
    .highlight-box { background: #f7fafc; border-left: 4px solid #718096; padding: 20px; margin: 30px 0; border-radius: 4px; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #2c3e50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
    .footer { background: #f7fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 HUSTLE</h1>
    </div>
    <div class="content">
      <p>Hey ${name},</p>
      <p><strong>Your survey response is in!</strong> Thank you for taking the time to share your insights with us.</p>

      <div class="highlight-box">
        <h3 style="margin-top: 0; color: #2d3748;">🚀 What's Next?</h3>
        <p style="margin-bottom: 0;">We're analyzing all responses to build a youth sports tracking platform that actually works for busy families. Your input is shaping the future of Hustle.</p>
      </div>

      <p><strong>Keep an eye on your inbox</strong> — we'll be reaching out to select beta testers very soon!</p>

      <p>In the meantime, if you have any questions or additional thoughts, just reply to this email.</p>

      <p style="margin-top: 30px;">Thanks again for being part of this journey!</p>
      <p style="margin-bottom: 0;"><strong>Jeremy Longshore</strong><br>Founder, Hustle</p>
    </div>
    <div class="footer">
      <p>This email was sent because you completed the Hustle Beta Survey.</p>
      <p style="margin: 10px 0 0;">© ${new Date().getFullYear()} Hustle. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hey ${name},

Your survey response is in! Thank you for taking the time to share your insights with us.

🚀 What's Next?
We're analyzing all responses to build a youth sports tracking platform that actually works for busy families. Your input is shaping the future of Hustle.

Keep an eye on your inbox — we'll be reaching out to select beta testers very soon!

In the meantime, if you have any questions or additional thoughts, just reply to this email.

Thanks again for being part of this journey!

Jeremy Longshore
Founder, Hustle

---
This email was sent because you completed the Hustle Beta Survey.
© ${new Date().getFullYear()} Hustle. All rights reserved.`;

  return { subject, html, text };
}

async function testThankYouEmail() {
  console.log('🔄 Sending test thank you email...\n');

  try {
    // Generate the actual thank you email content
    const { subject, html, text } = generateThankYouEmail({
      recipientName: 'Jeremy',
    });

    console.log('📧 Subject:', subject);
    console.log('📝 Sending to: jeremy@intentsolutions.io\n');
    console.log('ℹ️  Note: Resend test mode only allows sending to jeremy@intentsolutions.io\n');

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
    console.log('\n🎨 Email uses gray monochrome theme (Option 7: CHARCOAL SLATE)\n');

  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
  }
}

// Run the test
testThankYouEmail();
