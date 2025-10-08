/**
 * Email Templates for HUSTLE™ Survey Application
 *
 * @description Professional email templates with Jeremy's vision and branding
 */

interface ThankYouEmailProps {
  recipientEmail: string;
  recipientName?: string;
}

/**
 * Generate HTML email template for survey thank you
 */
export function generateThankYouEmail({ recipientName }: Omit<ThankYouEmailProps, 'recipientEmail'>) {
  const displayName = recipientName || 'there';

  return {
    subject: 'Thank You - HUSTLE™ Survey Complete',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - HUSTLE™</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #1a1a1a;">

  <!-- Email Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Content Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">

          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;">
                Thank You! 🙏
              </h1>
              <p style="margin: 16px 0 0; color: #e8e4f3; font-size: 18px; line-height: 1.6; font-weight: 500;">
                You&apos;ve just helped shape the future of youth sports tracking
              </p>
            </td>
          </tr>

          <!-- Jeremy's Story Section -->
          <tr>
            <td style="padding: 50px 40px; background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);">
              <h2 style="margin: 0 0 24px; color: #2d3748; font-size: 28px; font-weight: 700; line-height: 1.3;">
                A Note from Jeremy 👋
              </h2>
              <div style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                <p style="margin: 0 0 16px;">
                  Hey ${displayName},
                </p>
                <p style="margin: 0 0 16px;">
                  I&apos;m Jeremy Longshore, and I want to personally thank you for completing this survey. Your insights are <strong>incredibly valuable</strong>.
                </p>
                <p style="margin: 0 0 16px;">
                  Quick background: I spent <strong>20+ years in restaurants</strong> (eventually running 6 locations), then <strong>5 years in trucking</strong>, and now I&apos;m pivoting into AI and tech. I was <strong>accepted into the Google Cloud Startup Program</strong>, which gives me $350,000 in credits over 2 years to build something meaningful.
                </p>
                <p style="margin: 0 0 16px;">
                  As a parent of a high school soccer player, I saw firsthand how hard it is to track stats, celebrate progress, and stay organized during the season. That frustration sparked <strong>HUSTLE™</strong>.
                </p>
                <p style="margin: 0 0 16px; color: #667eea; font-weight: 600; font-size: 17px;">
                  This isn&apos;t just another app—it&apos;s built by a parent who gets it, powered by enterprise-grade AI, and designed to actually help families like ours.
                </p>
                <p style="margin: 0;">
                  Thanks again for being part of this journey.
                </p>
                <p style="margin: 16px 0 0; font-weight: 600;">
                  — Jeremy
                </p>
              </div>
            </td>
          </tr>

          <!-- What We're Building -->
          <tr>
            <td style="padding: 0 40px 50px;">
              <h2 style="margin: 0 0 24px; color: #2d3748; font-size: 26px; font-weight: 700;">
                What We&apos;re Building ⚽
              </h2>

              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 22px; font-weight: 700;">
                  HUSTLE™ Platform
                </h3>
                <p style="margin: 0; color: #e8e4f3; font-size: 16px; line-height: 1.7;">
                  The <strong>AI-powered youth sports tracking platform</strong> that helps parents like you manage player profiles, log game stats, track progress over time, and celebrate your athlete&apos;s achievements—all in one place.
                </p>
              </div>

              <h3 style="margin: 0 0 20px; color: #4a5568; font-size: 20px; font-weight: 600;">
                Key Features:
              </h3>

              <ul style="margin: 0 0 30px; padding-left: 24px; color: #4a5568; font-size: 15px; line-height: 1.9;">
                <li style="margin-bottom: 12px;"><strong>Player Profiles:</strong> Manage multiple kids, positions, teams, and seasons</li>
                <li style="margin-bottom: 12px;"><strong>Game Logging:</strong> Quick stat entry (goals, assists, minutes, saves)</li>
                <li style="margin-bottom: 12px;"><strong>Progress Tracking:</strong> Visualize improvement over time with charts</li>
                <li style="margin-bottom: 12px;"><strong>Verification System:</strong> Confirm stats after watching game film</li>
                <li style="margin-bottom: 12px;"><strong>AI Insights:</strong> Smart analysis of performance trends (coming soon)</li>
                <li style="margin-bottom: 12px;"><strong>Family Sharing:</strong> Grandparents, coaches, scouts can view progress</li>
              </ul>

              <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px;">
                <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.7; font-style: italic;">
                  &quot;Built on <strong>Google Cloud Platform</strong> with the same infrastructure that powers Gmail and YouTube. Your data is secure, scalable, and always available.&quot;
                </p>
              </div>
            </td>
          </tr>

          <!-- Beta Testing Reward -->
          <tr>
            <td style="padding: 0 40px 50px;">
              <div style="background: linear-gradient(to right, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #9333ea; border-radius: 16px; padding: 35px;">
                <h2 style="margin: 0 0 24px; color: #6b21a8; font-size: 26px; font-weight: 700; text-align: center;">
                  🎁 Your Beta Tester Reward
                </h2>

                <div style="margin-bottom: 24px;">
                  <div style="display: flex; align-items: start; margin-bottom: 20px;">
                    <div style="background-color: #10b981; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; margin-right: 16px;">✓</div>
                    <div>
                      <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        Survey Complete ✅
                      </h3>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        You&apos;ve shared invaluable insights about what parents actually need
                      </p>
                    </div>
                  </div>

                  <div style="display: flex; align-items: start; margin-bottom: 20px;">
                    <div style="background-color: #667eea; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; margin-right: 16px;">2</div>
                    <div>
                      <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        Beta Testing (2-4 weeks)
                      </h3>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        If selected, you&apos;ll get early access and help shape the final product
                      </p>
                    </div>
                  </div>

                  <div style="display: flex; align-items: start;">
                    <div style="background-color: #667eea; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; margin-right: 16px;">3</div>
                    <div>
                      <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">
                        FREE for 1 Year 🎉
                      </h3>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        Complete beta testing, get 12 months free—no credit card required
                      </p>
                    </div>
                  </div>
                </div>

                <p style="margin: 24px 0 0; padding: 20px; background-color: #ffffff; border-radius: 8px; color: #4a5568; font-size: 14px; line-height: 1.7; text-align: center; border: 1px solid #e9d5ff;">
                  <strong>Selected beta testers</strong> will receive an email invitation within <strong>7 days</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="padding: 0 40px 50px;">
              <div style="background-color: #f7fafc; border-radius: 12px; padding: 30px; text-align: center;">
                <h3 style="margin: 0 0 16px; color: #2d3748; font-size: 22px; font-weight: 600;">
                  Questions? Let&apos;s Connect 💬
                </h3>
                <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 1.6;">
                  I&apos;d love to hear from you! Reach out directly:
                </p>

                <!-- Contact Buttons -->
                <div style="margin-bottom: 16px;">
                  <a href="mailto:jeremy@intentsolutions.io" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                    📧 Email Me
                  </a>
                  <a href="https://jeremylongshore.com" style="display: inline-block; background-color: #48bb78; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                    🌐 Personal Site
                  </a>
                </div>
                <div>
                  <a href="https://github.com/jeremylongshore" style="display: inline-block; background-color: #2d3748; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                    💻 GitHub
                  </a>
                  <a href="https://linkedin.com/in/jeremylongshore" style="display: inline-block; background-color: #0077b5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 8px 12px;">
                    💼 LinkedIn
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <p style="margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                HUSTLE™
              </p>
              <p style="margin: 0 0 16px; color: #e8e4f3; font-size: 14px;">
                Track Stats. Celebrate Progress. Build Legends.
              </p>
              <p style="margin: 0; color: #c4b5fd; font-size: 13px;">
                Powered by Intent Solutions × Google Cloud Platform
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
HUSTLE™ - Thank You!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey ${displayName},

I'm Jeremy Longshore, and I want to personally thank you for completing this survey. Your insights are incredibly valuable.

Quick background: I spent 20+ years in restaurants (eventually running 6 locations), then 5 years in trucking, and now I'm pivoting into AI and tech. I was accepted into the Google Cloud Startup Program, which gives me $350,000 in credits over 2 years to build something meaningful.

As a parent of a high school soccer player, I saw firsthand how hard it is to track stats, celebrate progress, and stay organized during the season. That frustration sparked HUSTLE™.

This isn't just another app—it's built by a parent who gets it, powered by enterprise-grade AI, and designed to actually help families like ours.

Thanks again for being part of this journey.

— Jeremy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT WE'RE BUILDING

HUSTLE™ Platform - The AI-powered youth sports tracking platform that helps parents like you manage player profiles, log game stats, track progress over time, and celebrate your athlete's achievements—all in one place.

KEY FEATURES:
• Player Profiles: Manage multiple kids, positions, teams, and seasons
• Game Logging: Quick stat entry (goals, assists, minutes, saves)
• Progress Tracking: Visualize improvement over time with charts
• Verification System: Confirm stats after watching game film
• AI Insights: Smart analysis of performance trends (coming soon)
• Family Sharing: Grandparents, coaches, scouts can view progress

Built on Google Cloud Platform with the same infrastructure that powers Gmail and YouTube. Your data is secure, scalable, and always available.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR BETA TESTER REWARD

✓ Survey Complete
You've shared invaluable insights about what parents actually need

2. Beta Testing (2-4 weeks)
If selected, you'll get early access and help shape the final product

3. FREE for 1 Year
Complete beta testing, get 12 months free—no credit card required

Selected beta testers will receive an email invitation within 7 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS? LET'S CONNECT

I'd love to hear from you! Reach out directly:

📧 Email: jeremy@intentsolutions.io
🌐 Website: https://jeremylongshore.com
💻 GitHub: https://github.com/jeremylongshore
💼 LinkedIn: https://linkedin.com/in/jeremylongshore

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HUSTLE™
Track Stats. Celebrate Progress. Build Legends.

Powered by Intent Solutions × Google Cloud Platform
    `.trim()
  };
}
