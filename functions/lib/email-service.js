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
        console.error('[Email] EMAIL_FROM not configured in functions/.env');
        throw new Error('Email sender not configured');
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
            console.error('[Email] Error sending email:', error);
            throw new Error(error.message);
        }
        console.log(`[Email] Sent to: ${to} - Subject: ${subject} - ID: ${data?.id}`);
        return { success: true, data };
    }
    catch (error) {
        console.error('[Email] Error sending email:', error);
        throw error;
    }
}
//# sourceMappingURL=email-service.js.map