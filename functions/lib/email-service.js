"use strict";
/**
 * Email Service for Firebase Cloud Functions
 *
 * Handles sending emails via Resend from Cloud Functions.
 * Uses .env file for configuration (Firebase Functions best practice).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const logger_1 = require("./logger");
const emailLogger = (0, logger_1.createLogger)({ component: 'cloud-function' });
// Initialize Resend client lazily
let resendClient = null;
const getResend = () => {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY not configured in functions/.env');
        }
        resendClient = new resend_1.Resend(apiKey);
    }
    return resendClient;
};
/**
 * Send email using Resend
 *
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with success status
 */
async function sendEmail(options) {
    const { to, subject, html, text } = options;
    // Get configuration from .env
    const emailFrom = process.env.EMAIL_FROM;
    if (!emailFrom) {
        emailLogger.error('EMAIL_FROM not configured in functions/.env');
        return { success: false, error: 'Email sender not configured' };
    }
    try {
        const resend = getResend();
        const { data, error } = await resend.emails.send({
            from: emailFrom,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version
        });
        if (error) {
            emailLogger.error('Resend API error', new Error(error.message), { to, subject });
            return { success: false, error: error.message };
        }
        emailLogger.info('Email sent successfully', { to, subject, emailId: data?.id });
        return { success: true, data };
    }
    catch (error) {
        emailLogger.error('Failed to send email', error, { to, subject });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
//# sourceMappingURL=email-service.js.map