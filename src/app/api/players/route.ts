import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPlayersAdmin } from '@/lib/firebase/admin-services/players'
import { getUnverifiedGamesAdmin } from '@/lib/firebase/admin-services/games'
import { getUserProfileAdmin } from '@/lib/firebase/admin-services/users'

// GET /api/players - Get all players for authenticated user
export async function GET() {
  try {
    const session = await auth();

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
          // Use primaryPosition (SoccerPositionCode like "GK", "CB") for position detection
          position: player.primaryPosition ?? player.position,
          teamClub: player.teamClub,
          photoUrl: player.photoUrl,
          pendingGames: unverifiedGames.length,
          parentEmail: parentUser?.email ?? null
        };
      })
    );

    return NextResponse.json({ players: playersWithPending })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({
      error: 'Failed to fetch players'
    }, { status: 500 })
  }
}
