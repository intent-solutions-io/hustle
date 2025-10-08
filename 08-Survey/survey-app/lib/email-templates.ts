/**
 * Email Templates for Survey Application
 *
 * @description Reusable email templates with personalized content
 */

interface ThankYouEmailProps {
  recipientEmail: string;
  recipientName?: string;
  personalNote: string;
}

/**
 * Generate HTML email template for survey thank you
 */
export function generateThankYouEmail({ recipientName, personalNote }: Omit<ThankYouEmailProps, 'recipientEmail'>) {
  const displayName = recipientName || 'Sports Parent';

  return {
    subject: '🎉 Thank You for Completing the Hustle Survey!',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - Hustle Survey</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">

  <!-- Email Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Content Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; line-height: 1.2;">
                🎉 Thank You!
              </h1>
              <p style="margin: 12px 0 0; color: #e0e7ff; font-size: 18px; line-height: 1.5;">
                You&apos;re helping shape the future of youth sports tracking
              </p>
            </td>
          </tr>

          <!-- Personal Note Section -->
          <tr>
            <td style="padding: 40px 30px; background-color: #faf5ff; border-bottom: 4px solid #9333ea;">
              <h2 style="margin: 0 0 16px; color: #6b21a8; font-size: 20px; font-weight: 600;">
                A Personal Note from Jeremy
              </h2>
              <div style="color: #4c1d95; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
${personalNote}
              </div>
            </td>
          </tr>

          <!-- Beta Tester Reward -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
                Your Beta Tester Reward
              </h2>

              <!-- Reward Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 16px;">
                          <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 18px;">✓</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                            Survey Complete ✓
                          </h3>
                          <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                            You&apos;ve completed the parent survey and shared invaluable insights about your needs.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 16px;">
                          <div style="width: 32px; height: 32px; background-color: #9333ea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 16px;">2</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                            Next: Beta Testing (2-4 weeks)
                          </h3>
                          <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                            We&apos;ll email you within 7 days if you&apos;re selected for the beta program.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: top; padding-right: 16px;">
                          <div style="width: 32px; height: 32px; background-color: #9333ea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 16px;">3</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                            Your Reward: FREE for 1 Year
                          </h3>
                          <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                            Complete beta testing and get full access for 12 months—no credit card required.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What Happens Next -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px; font-weight: 700;">
                What Happens Next?
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 12px;">We&apos;ll review your responses and identify beta testing candidates</li>
                <li style="margin-bottom: 12px;">Selected beta testers will receive an email invitation within 7 days</li>
                <li style="margin-bottom: 12px;">Beta testing will run for 2-4 weeks with direct product development input</li>
                <li>After successful beta completion, you&apos;ll receive 1 year of free access</li>
              </ul>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <div style="background-color: #faf5ff; border: 2px solid #e9d5ff; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 12px; color: #6b21a8; font-size: 18px; font-weight: 600;">
                  Questions or Concerns?
                </h3>
                <p style="margin: 0 0 16px; color: #7c3aed; font-size: 15px; line-height: 1.6;">
                  We&apos;re here to help! If you have any questions about the survey, beta testing, or the product:
                </p>
                <p style="margin: 0;">
                  <a href="mailto:support@hustlesurvey.intentsolutions.io" style="color: #6b21a8; font-weight: 600; text-decoration: none; font-size: 16px;">
                    📧 support@hustlesurvey.intentsolutions.io
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Join sports parents from across the country helping build the future of youth sports tracking
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                Powered by Hustle · Intent Solutions
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
    text: `
🎉 Thank You, ${displayName}!

You're helping shape the future of youth sports tracking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A PERSONAL NOTE FROM JEREMY

${personalNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR BETA TESTER REWARD

✓ Survey Complete
You've completed the parent survey and shared invaluable insights about your needs.

2. Next: Beta Testing (2-4 weeks)
We'll email you within 7 days if you're selected for the beta program.

3. Your Reward: FREE for 1 Year
Complete beta testing and get full access for 12 months—no credit card required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS NEXT?

• We'll review your responses and identify beta testing candidates
• Selected beta testers will receive an email invitation within 7 days
• Beta testing will run for 2-4 weeks with direct product development input
• After successful beta completion, you'll receive 1 year of free access

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS OR CONCERNS?

We're here to help! If you have any questions about the survey, beta testing, or the product:

📧 support@hustlesurvey.intentsolutions.io

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Join sports parents from across the country helping build the future of youth sports tracking.

Powered by Hustle · Intent Solutions
    `.trim()
  };
}
