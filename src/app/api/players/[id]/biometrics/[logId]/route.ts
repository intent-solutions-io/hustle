import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  getBiometricsLogAdmin,
  updateBiometricsLogAdmin,
  deleteBiometricsLogAdmin,
} from '@/lib/firebase/admin-services/biometrics';
import { biometricsLogUpdateSchema } from '@/lib/validations/biometrics-schema';

/**
 * GET /api/players/[id]/biometrics/[logId] - Get single biometrics log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const biometricsLog = await getBiometricsLogAdmin(
      session.user.id,
      playerId,
      logId
    );

    if (!biometricsLog) {
      return NextResponse.json(
        { error: 'Biometrics log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      biometricsLog,
    });
  } catch (error) {
    console.error('Error fetching biometrics log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometrics log' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players/[id]/biometrics/[logId] - Update biometrics log
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;
    const body = await request.json();

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify log exists
    const existingLog = await getBiometricsLogAdmin(
      session.user.id,
      playerId,
      logId
    );
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Biometrics log not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = biometricsLogUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid biometrics data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const biometricsLog = await updateBiometricsLogAdmin(
      session.user.id,
      playerId,
      logId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      biometricsLog,
    });
  } catch (error) {
    console.error('Error updating biometrics log:', error);
    return NextResponse.json(
      { error: 'Failed to update biometrics log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id]/biometrics/[logId] - Delete biometrics log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify log exists
    const existingLog = await getBiometricsLogAdmin(
      session.user.id,
      playerId,
      logId
    );
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Biometrics log not found' },
        { status: 404 }
      );
    }

    await deleteBiometricsLogAdmin(session.user.id, playerId, logId);

    return NextResponse.json({
      success: true,
      message: 'Biometrics log deleted',
    });
  } catch (error) {
    console.error('Error deleting biometrics log:', error);
    return NextResponse.json(
      { error: 'Failed to delete biometrics log' },
      { status: 500 }
    );
  }
}
