import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { getDreamGymAdmin } from '@/lib/firebase/admin-services/dream-gym';
import { getWorkoutLogsAdmin } from '@/lib/firebase/admin-services/workout-logs';
import { getBiometricsTrendsAdmin } from '@/lib/firebase/admin-services/biometrics';
import {
  generateWorkoutStrategy,
  analyzeRecoveryStatus,
  suggestProgressions,
  type WorkoutStrategyInput,
} from '@/lib/ai/workout-strategy';

/**
 * POST /api/players/[id]/dream-gym/ai-strategy
 * Generate an AI-powered workout strategy for the player
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

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get Dream Gym profile
    const dreamGym = await getDreamGymAdmin(session.user.id, playerId);
    if (!dreamGym?.profile) {
      return NextResponse.json(
        { error: 'Dream Gym profile not found. Complete onboarding first.' },
        { status: 400 }
      );
    }

    // Get recent workout logs (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { logs: workoutLogs } = await getWorkoutLogsAdmin(
      session.user.id,
      playerId,
      { startDate: fourWeeksAgo, limit: 50 }
    );

    // Get biometrics trends
    let biometricsTrends = null;
    try {
      biometricsTrends = await getBiometricsTrendsAdmin(
        session.user.id,
        playerId,
        { startDate: fourWeeksAgo, limit: 30 }
      );
    } catch {
      // Biometrics may not exist
    }

    // Get mental check-in data
    const checkIns = dreamGym?.mental?.checkIns || [];
    const recentCheckIns = checkIns.slice(-7);

    // Calculate average mood data
    let recentMood = undefined;
    if (recentCheckIns.length > 0) {
      const avgMood = recentCheckIns.reduce((sum: number, c: { mood: number }) => sum + c.mood, 0) / recentCheckIns.length;
      const energyCounts = { low: 0, ok: 0, high: 0 };
      const sorenessCounts = { low: 0, medium: 0, high: 0 };

      for (const c of recentCheckIns) {
        if (c.energy in energyCounts) energyCounts[c.energy as keyof typeof energyCounts]++;
        if (c.soreness in sorenessCounts) sorenessCounts[c.soreness as keyof typeof sorenessCounts]++;
      }

      const avgEnergy = Object.entries(energyCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
      const avgSoreness = Object.entries(sorenessCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];

      recentMood = { avgMood, avgEnergy, avgSoreness };
    }

    // Calculate player age
    let age: number | undefined;
    if (player.birthday) {
      const today = new Date();
      const birthDate = new Date(player.birthday);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Extract available days from schedule (days that aren't 'off')
    const schedule = dreamGym.schedule;
    const availableDays: string[] = [];
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    for (const day of dayNames) {
      if (schedule[day] && schedule[day] !== 'off') {
        availableDays.push(day.charAt(0).toUpperCase() + day.slice(1));
      }
    }

    // Build strategy input
    const strategyInput: WorkoutStrategyInput = {
      playerId,
      playerName: player.name,
      position: player.primaryPosition,
      goals: dreamGym.profile.goals || [],
      age,
      recentWorkouts: workoutLogs.map(log => ({
        date: new Date(log.completedAt),
        type: log.type,
        duration: log.duration,
        totalVolume: log.totalVolume ?? undefined,
        exercises: log.exercises.map(e => e.exerciseName),
      })),
      biometrics: biometricsTrends ? {
        avgRestingHeartRate: biometricsTrends.avgRestingHeartRate ?? undefined,
        avgHrv: biometricsTrends.avgHrv ?? undefined,
        avgSleepHours: biometricsTrends.avgSleepHours ?? undefined,
        avgSleepScore: biometricsTrends.avgSleepScore ?? undefined,
      } : undefined,
      recentMood,
      availableDays,
      hasGymAccess: dreamGym.profile.hasGymAccess,
    };

    // Generate AI strategy
    const strategy = await generateWorkoutStrategy(strategyInput);

    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error) {
    console.error('Error generating AI strategy:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout strategy' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/players/[id]/dream-gym/ai-strategy/recovery
 * Get recovery status analysis
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
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'recovery';

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (type === 'recovery') {
      // Get recent data for recovery analysis
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { logs: workoutLogs } = await getWorkoutLogsAdmin(
        session.user.id,
        playerId,
        { startDate: fourWeeksAgo, limit: 50 }
      );

      let biometricsTrends = null;
      try {
        biometricsTrends = await getBiometricsTrendsAdmin(
          session.user.id,
          playerId,
          { startDate: fourWeeksAgo, limit: 30 }
        );
      } catch {
        // Biometrics may not exist
      }

      const dreamGym = await getDreamGymAdmin(session.user.id, playerId);
      const checkIns = dreamGym?.mental?.checkIns || [];
      const recentCheckIns = checkIns.slice(-7);

      let recentMood = undefined;
      if (recentCheckIns.length > 0) {
        const avgMood = recentCheckIns.reduce((sum: number, c: { mood: number }) => sum + c.mood, 0) / recentCheckIns.length;
        const sorenessCounts = { low: 0, medium: 0, high: 0 };
        for (const c of recentCheckIns) {
          if (c.soreness in sorenessCounts) sorenessCounts[c.soreness as keyof typeof sorenessCounts]++;
        }
        const avgSoreness = Object.entries(sorenessCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
        recentMood = { avgMood, avgSoreness };
      }

      const recovery = analyzeRecoveryStatus({
        recentWorkouts: workoutLogs.map(log => ({
          date: new Date(log.completedAt),
          duration: log.duration,
          totalVolume: log.totalVolume ?? undefined,
        })),
        biometrics: biometricsTrends ? {
          avgRestingHeartRate: biometricsTrends.avgRestingHeartRate ?? undefined,
          avgHrv: biometricsTrends.avgHrv ?? undefined,
          avgSleepScore: biometricsTrends.avgSleepScore ?? undefined,
        } : undefined,
        recentMood,
      });

      return NextResponse.json({
        success: true,
        recovery,
      });
    }

    if (type === 'progressions') {
      // Get workout history for progression analysis
      const { logs: workoutLogs } = await getWorkoutLogsAdmin(
        session.user.id,
        playerId,
        { limit: 50 }
      );

      // Flatten exercise data
      const exerciseHistory: {
        exerciseName: string;
        sets: number;
        reps: number;
        weight?: number;
        date: Date;
      }[] = [];

      for (const log of workoutLogs) {
        for (const exercise of log.exercises) {
          for (const set of exercise.sets) {
            if (set.completed) {
              exerciseHistory.push({
                exerciseName: exercise.exerciseName,
                sets: exercise.targetSets,
                reps: set.reps,
                weight: set.weight ?? undefined,
                date: new Date(log.completedAt),
              });
            }
          }
        }
      }

      const progressions = suggestProgressions(exerciseHistory);

      return NextResponse.json({
        success: true,
        progressions,
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use "recovery" or "progressions".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error analyzing data:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
