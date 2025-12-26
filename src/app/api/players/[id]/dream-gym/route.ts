import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayer } from '@/lib/firebase/services/players';
import { getDreamGym, upsertDreamGym } from '@/lib/firebase/services/dream-gym';
import type { DreamGymProfile, DreamGymSchedule } from '@/types/firestore';

/**
 * GET /api/players/[id]/dream-gym - Get Dream Gym profile
 * Security: Verifies parent ownership via player ownership check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;

    // Verify player belongs to user
    const player = await getPlayer(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get Dream Gym profile
    const dreamGym = await getDreamGym(session.user.id, playerId);

    return NextResponse.json({
      success: true,
      dreamGym
    });
  } catch (error) {
    console.error('Error fetching Dream Gym:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Dream Gym profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/dream-gym - Create or update Dream Gym profile
 * Security: Verifies parent ownership via player ownership check
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();

    // Validate required fields
    const { profile, schedule } = body as {
      profile: DreamGymProfile;
      schedule: DreamGymSchedule;
    };

    if (!profile || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: profile and schedule' },
        { status: 400 }
      );
    }

    // Validate profile fields
    if (!profile.goals || profile.goals.length === 0) {
      return NextResponse.json(
        { error: 'At least one goal is required' },
        { status: 400 }
      );
    }

    if (!profile.intensity) {
      return NextResponse.json(
        { error: 'Intensity is required' },
        { status: 400 }
      );
    }

    // Verify player belongs to user
    const player = await getPlayer(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Create/update Dream Gym profile
    const dreamGym = await upsertDreamGym(session.user.id, playerId, {
      profile,
      schedule,
    });

    return NextResponse.json({
      success: true,
      dreamGym
    });
  } catch (error) {
    console.error('Error saving Dream Gym:', error);
    return NextResponse.json(
      { error: 'Failed to save Dream Gym profile' },
      { status: 500 }
    );
  }
}
