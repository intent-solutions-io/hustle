"use strict";
/**
 * Professional email templates for Hustle authentication system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
exports.emailTemplates = {
    /**
     * Email verification template
     */
    emailVerification: (name, verificationUrl) => {
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Welcome to Hustle, ${name}!</h1>
              <p>Thanks for creating your account. You&apos;re one step away from tracking elite athletic performance.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-box">${verificationUrl}</div>
              <div class="warning">
                <p style="margin: 0;"><span class="expires">This link expires in 24 hours</span></p>
              </div>
              <p>Once verified, you&apos;ll be able to:</p>
              <ul>
                <li>Add player profiles for your athletes</li>
                <li>Track game statistics and performance</li>
                <li>Monitor development over time</li>
                <li>Share verified stats with recruiters</li>
              </ul>
            </div>
            <div class="footer">
              <p>If you didn&apos;t create this account, you can safely ignore this email.</p>
              <p style="margin-top: 10px;">&copy; 2025 Hustle. All rights reserved.</p>
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

If you did not create this account, you can safely ignore this email.

(c) 2025 Hustle
      `.trim()
        };
    },
    /**
     * Password reset template
     */
    passwordReset: (email, resetUrl) => {
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
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
                <p style="margin: 0;"><span class="expires">This link expires in 1 hour</span></p>
              </div>
              <p><strong>Security reminder:</strong></p>
              <ul>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication if available</li>
              </ul>
            </div>
            <div class="footer">
              <p><strong>Didn&apos;t request a password reset?</strong><br>
              If you didn&apos;t make this request, you can safely ignore this email. Your password will not be changed.</p>
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

Did not request a password reset? You can safely ignore this email.

(c) 2025 Hustle
      `.trim()
        };
    },
    /**
     * Welcome email after verification
     */
    welcome: (name) => {
        return {
            subject: 'Welcome to Hustle - Let Us Get Started!',
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Welcome Aboard, ${name}!</h1>
              <p>Your email is verified and your account is ready to go!</p>
              <p>Here&apos;s how to get started:</p>
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

Here is how to get started:

1. Add Your First Player - Create a profile for your athlete
2. Log Game Stats - Track performance after each game
3. Monitor Progress - View development over the season
4. Share & Verify - Generate reports for recruiters

Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard

Need help? Reply to this email or visit our help center.

(c) 2025 Hustle
      `.trim()
        };
    },
    /**
     * Password successfully changed confirmation
     */
    passwordChanged: (email) => {
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Password Changed Successfully</h1>
              <p>The password for your account (<strong>${email}</strong>) has been changed.</p>
              <p>This change was made on ${new Date().toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short'
            })}.</p>
              <div class="warning">
                <p style="margin: 0;"><strong>Didn&apos;t change your password?</strong><br>
                If you didn&apos;t make this change, please contact us immediately at <a href="mailto:support@hustle-app.com">support@hustle-app.com</a></p>
              </div>
              <p>Your account security is important to us. Remember to:</p>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Never share your password</li>
                <li>Log out from shared devices</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Password Changed Successfully

The password for your account (${email}) has been changed.

Changed on: ${new Date().toLocaleString()}

Did not change your password? Contact us immediately at support@hustle-app.com

(c) 2025 Hustle
      `.trim()
        };
    },
    /**
     * Notification sent to parent when a new game requires verification
     */
    gameVerificationRequest: (options) => {
        const { parentName, playerName, opponent, result, finalScore, minutesPlayed, verifyUrl, pendingCount } = options;
        return {
            subject: `Action required: Verify ${playerName}'s game vs ${opponent}`,
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Hi ${parentName}, action needed!</h1>
              <p>A new game log for <strong>${playerName}</strong> is waiting for your verification.</p>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb;">
                <p style="margin: 0; font-weight: 600;">Game Summary</p>
                <ul style="margin: 12px 0 0 18px; padding: 0; color: #4b5563;">
                  <li>Opponent: <strong>${opponent}</strong></li>
                  <li>Result: <strong>${result}</strong></li>
                  <li>Score: <strong>${finalScore}</strong></li>
                  <li>Minutes Played: <strong>${minutesPlayed}</strong></li>
                </ul>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" class="button">Verify This Game</a>
              </p>
              <p>Verifying locks in the stats and adds them to your athlete's official record.</p>
              <div class="warning">
                <p style="margin: 0;">You currently have <strong>${pendingCount}</strong> game${pendingCount === 1 ? '' : 's'} awaiting verification.</p>
                <p style="margin: 8px 0 0 0;">Games must be verified within 14 days of the event.</p>
              </div>
            </div>
            <div class="footer">
              <p>Thanks for keeping ${playerName}'s performance data honest and recruiter-ready.</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Hi ${parentName},

A new game log for ${playerName} vs ${opponent} is waiting for your verification.

Result: ${result}
Score: ${finalScore}
Minutes Played: ${minutesPlayed}

Verify now: ${verifyUrl}

You currently have ${pendingCount} game${pendingCount === 1 ? '' : 's'} awaiting verification. Remember to verify within 14 days.

Thanks for keeping ${playerName}'s performance data accurate.
© 2025 Hustle
      `.trim()
        };
    },
    /**
     * Trial ending soon notification (Phase 6 Task 3)
     *
     * Sent 3 days before trial expiration to encourage upgrade
     */
    trialEndingSoon: (options) => {
        const { name, daysRemaining, upgradeUrl } = options;
        return {
            subject: `Your Hustle trial expires in ${daysRemaining} days`,
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Hi ${name}, your trial is ending soon</h1>
              <p>Your Hustle trial will expire in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
              <div class="warning">
                <p style="margin: 0;"><span class="expires">Trial expires: ${new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { dateStyle: 'long' })}</span></p>
              </div>
              <p>After your trial ends, you&apos;ll lose access to:</p>
              <ul>
                <li>Player profiles and game tracking</li>
                <li>Performance analytics and trends</li>
                <li>Verified stats for recruiters</li>
                <li>All historical data</li>
              </ul>
              <p><strong>Upgrade now to keep tracking your athletes&apos; progress!</strong></p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" class="button">Upgrade to Continue</a>
              </p>
              <p>Choose the plan that fits your needs:</p>
              <ul>
                <li><strong>Starter ($9/month)</strong> - Perfect for individual athletes</li>
                <li><strong>Plus ($19/month)</strong> - Ideal for families with multiple players</li>
                <li><strong>Pro ($39/month)</strong> - Complete solution for teams and coaches</li>
              </ul>
            </div>
            <div class="footer">
              <p>Questions about plans? Reply to this email or visit our <a href="${process.env.NEXTAUTH_URL}/help">help center</a>.</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Hi ${name},

Your Hustle trial will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.

After your trial ends, you'll lose access to:
- Player profiles and game tracking
- Performance analytics and trends
- Verified stats for recruiters
- All historical data

Upgrade now: ${upgradeUrl}

Choose your plan:
- Starter ($9/month) - Perfect for individual athletes
- Plus ($19/month) - Ideal for families with multiple players
- Pro ($39/month) - Complete solution for teams and coaches

Questions? Reply to this email or visit our help center.

© 2025 Hustle
      `.trim()
        };
    },
    /**
     * Payment failed notification (Phase 6 Task 3)
     *
     * Sent when Stripe invoice payment fails
     */
    paymentFailed: (options) => {
        const { name, planName, amount, paymentMethodLast4, updatePaymentUrl, invoiceUrl } = options;
        return {
            subject: 'Payment failed - Action required',
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Hi ${name}, your payment failed</h1>
              <p>We couldn&apos;t process your payment for the <strong>${planName}</strong> plan.</p>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600;">Payment Details</p>
                <ul style="margin: 12px 0 0 18px; padding: 0; color: #4b5563;">
                  <li>Plan: <strong>${planName}</strong></li>
                  <li>Amount: <strong>$${(amount / 100).toFixed(2)}</strong></li>
                  ${paymentMethodLast4 ? `<li>Payment method ending in: <strong>${paymentMethodLast4}</strong></li>` : ''}
                  <li>Attempted: <strong>${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</strong></li>
                </ul>
              </div>
              <div class="warning">
                <p style="margin: 0;"><span class="expires">Update your payment method now to avoid service interruption</span></p>
                <p style="margin: 8px 0 0 0;">You can still view existing data, but creating new players and games is disabled until payment is updated.</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${updatePaymentUrl}" class="button">Update Payment Method</a>
              </p>
              ${invoiceUrl ? `<p>View invoice: <a href="${invoiceUrl}">Invoice details</a></p>` : ''}
              <p><strong>Common reasons for payment failures:</strong></p>
              <ul>
                <li>Expired or canceled credit card</li>
                <li>Insufficient funds</li>
                <li>Bank declined the transaction</li>
                <li>Incorrect billing address</li>
              </ul>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:support@hustle-app.com">support@hustle-app.com</a></p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Hi ${name},

We couldn't process your payment for the ${planName} plan.

Payment Details:
- Plan: ${planName}
- Amount: $${(amount / 100).toFixed(2)}
${paymentMethodLast4 ? `- Payment method ending in: ${paymentMethodLast4}` : ''}
- Attempted: ${new Date().toLocaleDateString()}

Update your payment method now: ${updatePaymentUrl}
${invoiceUrl ? `\nView invoice: ${invoiceUrl}` : ''}

You can still view existing data, but creating new content is disabled until payment is updated.

Common reasons for failures:
- Expired or canceled credit card
- Insufficient funds
- Bank declined the transaction
- Incorrect billing address

Need help? Reply to this email or contact support@hustle-app.com

© 2025 Hustle
      `.trim()
        };
    },
    /**
     * Subscription canceled notification (Phase 6 Task 3)
     *
     * Sent when user cancels subscription via Stripe portal
     */
    subscriptionCanceled: (options) => {
        const { name, planName, cancellationDate, reactivateUrl } = options;
        return {
            subject: 'Your Hustle subscription has been canceled',
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
              <h1 class="logo">HUSTLE<sup style="font-size: 0.5em; vertical-align: super;">&trade;</sup></h1>
            </div>
            <div class="content">
              <h1>Hi ${name}, your subscription is canceled</h1>
              <p>Your <strong>${planName}</strong> subscription has been canceled as of <strong>${cancellationDate}</strong>.</p>
              <div class="warning">
                <p style="margin: 0;">You no longer have access to:</p>
                <ul style="margin: 8px 0 0 18px; padding: 0;">
                  <li>Create new player profiles</li>
                  <li>Log new game statistics</li>
                  <li>View performance analytics</li>
                  <li>Generate verified reports</li>
                </ul>
              </div>
              <p>Your historical data is safe and will be retained for 90 days. If you reactivate within this period, all your data will be restored.</p>
              <p><strong>Changed your mind?</strong> You can reactivate your subscription anytime:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${reactivateUrl}" class="button">Reactivate Subscription</a>
              </p>
              <p>We&apos;re sorry to see you go! If there&apos;s anything we could do better, please let us know by replying to this email.</p>
            </div>
            <div class="footer">
              <p>We hope to see you back soon!</p>
              <p style="margin-top: 10px;">© 2025 Hustle. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Hi ${name},

Your ${planName} subscription has been canceled as of ${cancellationDate}.

You no longer have access to:
- Create new player profiles
- Log new game statistics
- View performance analytics
- Generate verified reports

Your historical data is safe and will be retained for 90 days. Reactivate within this period to restore all your data.

Reactivate now: ${reactivateUrl}

We're sorry to see you go! If there's anything we could do better, please reply to this email.

© 2025 Hustle
      `.trim()
        };
    }
};
//# sourceMappingURL=email-templates.js.map