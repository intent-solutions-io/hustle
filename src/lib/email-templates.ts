/**
 * Professional email templates for Hustle authentication system
 */

const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: #18181b;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #18181b;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      margin: 15px 0;
      color: #555;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .link-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
      margin: 15px 0;
      word-break: break-all;
      font-size: 13px;
      color: #6b7280;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
      border-top: 1px solid #e5e7eb;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .expires {
      color: #dc2626;
      font-weight: 600;
    }
  </style>
`;

export const emailTemplates = {
  /**
   * Email verification template
   */
  emailVerification: (name: string, verificationUrl: string) => {
    return {
      subject: 'Verify your Hustle account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">™</sup></h1>
            </div>
            <div class="content">
              <h1>Welcome to Hustle, ${name}!</h1>
              <p>Thanks for creating your account. You're one step away from tracking elite athletic performance.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-box">${verificationUrl}</div>
              <div class="warning">
                <p style="margin: 0;"><span class="expires">⏱ This link expires in 24 hours</span></p>
              </div>
              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Add player profiles for your athletes</li>
                <li>Track game statistics and performance</li>
                <li>Monitor development over time</li>
                <li>Share verified stats with recruiters</li>
              </ul>
            </div>
            <div class="footer">
              <p>If you didn't create this account, you can safely ignore this email.</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Hustle, ${name}!

Thanks for creating your account. Please verify your email address by visiting:

${verificationUrl}

This link expires in 24 hours.

If you didn't create this account, you can safely ignore this email.

© 2025 Hustle
      `.trim()
    };
  },

  /**
   * Password reset template
   */
  passwordReset: (email: string, resetUrl: string) => {
    return {
      subject: 'Reset your Hustle password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">™</sup></h1>
            </div>
            <div class="content">
              <h1>Password Reset Request</h1>
              <p>We received a request to reset the password for your account (<strong>${email}</strong>).</p>
              <p>Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-box">${resetUrl}</div>
              <div class="warning">
                <p style="margin: 0;"><span class="expires">⏱ This link expires in 1 hour</span></p>
              </div>
              <p><strong>Security reminder:</strong></p>
              <ul>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication if available</li>
              </ul>
            </div>
            <div class="footer">
              <p><strong>Didn't request a password reset?</strong><br>
              If you didn't make this request, you can safely ignore this email. Your password will not be changed.</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

We received a request to reset the password for your account (${email}).

Visit this link to create a new password:

${resetUrl}

This link expires in 1 hour.

Didn't request a password reset? You can safely ignore this email.

© 2025 Hustle
      `.trim()
    };
  },

  /**
   * Welcome email after verification
   */
  welcome: (name: string) => {
    return {
      subject: 'Welcome to Hustle - Let\'s Get Started!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">™</sup></h1>
            </div>
            <div class="content">
              <h1>🎉 Welcome Aboard, ${name}!</h1>
              <p>Your email is verified and your account is ready to go!</p>
              <p>Here's how to get started:</p>
              <ol>
                <li><strong>Add Your First Player</strong> - Create a profile for your athlete with their position and team details</li>
                <li><strong>Log Game Stats</strong> - Track minutes played, goals, assists, and more after each game</li>
                <li><strong>Monitor Progress</strong> - View performance trends and development over the season</li>
                <li><strong>Share & Verify</strong> - Generate verified reports for recruiters and coaches</li>
              </ol>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
              </p>
              <p>Need help? Check out our <a href="${process.env.NEXTAUTH_URL}/help">help center</a> or reply to this email.</p>
            </div>
            <div class="footer">
              <p>Happy tracking!</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome Aboard, ${name}!

Your email is verified and your account is ready to go!

Here's how to get started:

1. Add Your First Player - Create a profile for your athlete
2. Log Game Stats - Track performance after each game
3. Monitor Progress - View development over the season
4. Share & Verify - Generate reports for recruiters

Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard

Need help? Reply to this email or visit our help center.

© 2025 Hustle
      `.trim()
    };
  },

  /**
   * Password successfully changed confirmation
   */
  passwordChanged: (email: string) => {
    return {
      subject: 'Your Hustle password was changed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">™</sup></h1>
            </div>
            <div class="content">
              <h1>✓ Password Changed Successfully</h1>
              <p>The password for your account (<strong>${email}</strong>) has been changed.</p>
              <p>This change was made on ${new Date().toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short'
              })}.</p>
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Didn't change your password?</strong><br>
                If you didn't make this change, please contact us immediately at <a href="mailto:support@hustle-app.com">support@hustle-app.com</a></p>
              </div>
              <p>Your account security is important to us. Remember to:</p>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Never share your password</li>
                <li>Log out from shared devices</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Changed Successfully

The password for your account (${email}) has been changed.

Changed on: ${new Date().toLocaleString()}

Didn't change your password? Contact us immediately at support@hustle-app.com

© 2025 Hustle
      `.trim()
    };
  }
};
