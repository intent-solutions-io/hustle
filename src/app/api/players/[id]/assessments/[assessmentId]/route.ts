import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  getAssessmentAdmin,
  updateAssessmentAdmin,
  deleteAssessmentAdmin,
  getAssessmentProgressAdmin,
} from '@/lib/firebase/admin-services/assessments';
import { fitnessAssessmentUpdateSchema, validateAssessmentValue } from '@/lib/validations/assessment-schema';

/**
 * GET /api/players/[id]/assessments/[assessmentId] - Get single assessment
 * Optionally includes progress history for the same test type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, assessmentId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const assessment = await getAssessmentAdmin(
      session.user.id,
      playerId,
      assessmentId
    );

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Optionally include progress history
    const url = new URL(request.url);
    const includeProgress = url.searchParams.get('includeProgress') === 'true';

    let progress = null;
    if (includeProgress) {
      progress = await getAssessmentProgressAdmin(
        session.user.id,
        playerId,
        assessment.testType,
        { limit: 10 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment,
      progress,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players/[id]/assessments/[assessmentId] - Update assessment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, assessmentId } = await params;
    const body = await request.json();

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify assessment exists
    const existingAssessment = await getAssessmentAdmin(
      session.user.id,
      playerId,
      assessmentId
    );
    if (!existingAssessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = fitnessAssessmentUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid assessment data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // If value is being updated, validate against test type
    const testType = validationResult.data.testType ?? existingAssessment.testType;
    const value = validationResult.data.value ?? existingAssessment.value;

    if (validationResult.data.value !== undefined || validationResult.data.testType !== undefined) {
      const valueValidation = validateAssessmentValue(testType, value);
      if (!valueValidation.valid) {
        return NextResponse.json(
          { error: valueValidation.message },
          { status: 400 }
        );
      }
    }

    const assessment = await updateAssessmentAdmin(
      session.user.id,
      playerId,
      assessmentId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id]/assessments/[assessmentId] - Delete assessment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, assessmentId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify assessment exists
    const existingAssessment = await getAssessmentAdmin(
      session.user.id,
      playerId,
      assessmentId
    );
    if (!existingAssessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    await deleteAssessmentAdmin(session.user.id, playerId, assessmentId);

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted',
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
