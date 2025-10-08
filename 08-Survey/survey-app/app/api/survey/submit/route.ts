/**
 * Survey Submission API Endpoint
 *
 * @description Handles survey submission and storage to PostgreSQL via Prisma.
 *              Stores all 68 questions in structured JSON format.
 *
 * @route POST /api/survey/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Return success response
    return NextResponse.json({
      success: true,
      submissionId: surveyResponse.id,
      message: 'Survey submitted successfully',
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
