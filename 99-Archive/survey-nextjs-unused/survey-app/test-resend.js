/**
 * Quick Resend Email Test
 *
 * Tests that Resend API key works and can send emails
 */

import { Resend } from 'resend';

const resend = new Resend('REDACTED_RESEND_KEY');

async function testEmail() {
  console.log('🔄 Testing Resend email...\n');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Hustle Survey Test <onboarding@resend.dev>',
      to: 'jeremy@intentsolutions.io',
      subject: '✅ Resend Test - Hustle Survey',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #9333ea;">✅ Resend is Working!</h1>
          <p>Congrats on sending your <strong>first email</strong> from the Hustle Survey app!</p>

          <h2 style="color: #6b21a8; margin-top: 30px;">Test Details:</h2>
          <ul>
            <li><strong>API Key:</strong> Configured ✓</li>
            <li><strong>From Email:</strong> onboarding@resend.dev ✓</li>
            <li><strong>To Email:</strong> jeremy@intentsolutions.io ✓</li>
            <li><strong>Service:</strong> Resend ✓</li>
          </ul>

          <h2 style="color: #6b21a8; margin-top: 30px;">Next Steps:</h2>
          <ol>
            <li>Complete a survey to test the full thank you email</li>
            <li>Add environment variables to Netlify for production</li>
            <li>Monitor emails in Resend dashboard</li>
          </ol>

          <div style="margin-top: 40px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Resend Dashboard:</strong> <a href="https://resend.com/emails" style="color: #9333ea;">View Sent Emails</a>
            </p>
          </div>
        </div>
      `,
      text: `
✅ Resend is Working!

Congrats on sending your first email from the Hustle Survey app!

Test Details:
- API Key: Configured ✓
- From Email: onboarding@resend.dev ✓
- To Email: jeremy@intentsolutions.io ✓
- Service: Resend ✓

Next Steps:
1. Complete a survey to test the full thank you email
2. Add environment variables to Netlify for production
3. Monitor emails in Resend dashboard

Resend Dashboard: https://resend.com/emails
      `.trim()
    });

    if (error) {
      console.error('❌ Email send failed:');
      console.error(error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📬 Check your inbox: jeremy@intentsolutions.io');
    console.log('🔗 View in Resend: https://resend.com/emails\n');

  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
  }
}

// Run the test
testEmail();
