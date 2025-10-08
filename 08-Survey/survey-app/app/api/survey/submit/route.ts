/**
 * Survey Submission API Endpoint
 *
 * @description Handles survey submission and storage to PostgreSQL via Prisma.
 *              Stores all 68 questions in structured JSON format.
 *              Sends personalized thank you email via Resend.
 *
 * @route POST /api/survey/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendThankYouEmail, isEmailConfigured } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required data
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid survey data' },
        { status: 400 }
      );
    }

    // Extract key demographics for easy querying
    const email = data.email || data.betaEmail || null;
    const phone = data.phone || data.betaPhone || null;
    const numAthletes = data.numAthletes ? parseInt(data.numAthletes.match(/\d+/)?.[0] || '0') : null;
    const grades = data.grades || null;
    const sports = data.sports || null;
    const hoursPerWeek = data.hoursPerWeek || null;
    const recruitmentStatus = data.recruitmentStatus || null;
    const location = data.location || null;

    // Save to database
    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        email: email || `anonymous-${Date.now()}@survey.local`, // Fallback if no email provided
        phone,
        numAthletes,
        grades: grades ? JSON.parse(JSON.stringify(grades)) : null,
        sports: sports ? JSON.parse(JSON.stringify(sports)) : null,
        hoursPerWeek,
        recruitmentStatus,
        location,
        responses: data, // Store all 68 responses as JSON
        currentSection: 15, // Completed all sections
        completed: true,
        submittedAt: new Date(),
      },
    });

    console.log('[API] Survey submitted successfully:', surveyResponse.id);

    // Send thank you email if configured and email provided
    let emailSent = false;
    let emailError = null;

    if (email && email.includes('@') && !email.includes('anonymous')) {
      if (isEmailConfigured()) {
        // Extract user's name from survey data
        const userName = data.name || data.parentName || data.firstName || null;

        // Get personal note from environment variable or use default
        const personalNote = process.env.THANK_YOU_PERSONAL_NOTE || `
Thank you so much for taking the time to complete our survey!

Your feedback is incredibly valuable to us. As a parent managing youth sports, you understand the challenges firsthand, and your insights will directly shape how we build Hustle.

We're committed to creating a tool that truly helps families like yours track games, celebrate progress, and stay organized—without adding more stress to your already busy schedule.

I'm personally reviewing every survey response, and I'm excited about the patterns and needs I'm seeing. This is going to be something special.

Stay tuned for beta testing invitations—we can't wait to get Hustle into your hands!

Thanks again,
Jeremy Longshore
Founder, Hustle
        `.trim();

        const emailResult = await sendThankYouEmail({
          recipientEmail: email,
          recipientName: userName,
          personalNote,
        });

        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
          console.warn('[API] Failed to send thank you email:', emailError);
        } else {
          console.log('[API] Thank you email sent successfully:', emailResult.emailId);
        }
      } else {
        console.warn('[API] Email service not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)');
      }
    } else {
      console.log('[API] No valid email provided, skipping thank you email');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      submissionId: surveyResponse.id,
      message: 'Survey submitted successfully',
      emailSent,
      emailError: emailError || undefined,
    });

  } catch (error) {
    console.error('[API] Survey submission error:', error);

    // Handle unique constraint violation (duplicate email)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          error: 'Duplicate submission',
          message: 'This email has already been used to submit a survey.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to submit survey',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      endpoint: '/api/survey/submit',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        endpoint: '/api/survey/submit',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
