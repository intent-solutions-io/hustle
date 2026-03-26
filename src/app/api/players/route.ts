import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { getPlayersAdmin } from '@/lib/firebase/admin-services/players'
import { getUnverifiedGamesAdmin } from '@/lib/firebase/admin-services/games'
import { getUserProfileAdmin } from '@/lib/firebase/admin-services/users'

const logger = createLogger('api/players')

// GET /api/players - Get all players for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all players for authenticated user from Firestore (Admin SDK)
    const firestorePlayers = await getPlayersAdmin(session.user.id);

    // Get user email for parent info (Admin SDK)
    const parentUser = await getUserProfileAdmin(session.user.id);

    // Get pending games count for each player (Admin SDK)
    const playersWithPending = await Promise.all(
      firestorePlayers.map(async (player) => {
        const unverifiedGames = await getUnverifiedGamesAdmin(session.user.id, player.id);
        return {
          id: player.id,
          name: player.name,
          birthday: player.birthday,
          gender: player.gender,
          primaryPosition: player.primaryPosition,
          secondaryPositions: player.secondaryPositions ?? [],
          positionNote: player.positionNote ?? null,
          // Legacy field (backward compatibility)
          position: player.primaryPosition ?? player.position,
          teamClub: player.teamClub,
          leagueCode: player.leagueCode,
          leagueOtherName: player.leagueOtherName ?? null,
          photoUrl: player.photoUrl,
          pendingGames: unverifiedGames.length,
          parentEmail: parentUser?.email ?? null
        };
      })
    );

    return NextResponse.json({ players: playersWithPending })
  } catch (error) {
    logger.error('Error fetching players', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({
      error: 'Failed to fetch players'
    }, { status: 500 })
  }
}
