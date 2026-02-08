/**
 * DEBUG ENDPOINT - Remove in production
 * GET /api/debug/biometrics/[playerId]
 *
 * Checks what biometrics logs exist for a player
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await params;
    const userId = session.user.id;

    // Log the path we're checking
    const path = `users/${userId}/players/${playerId}/biometrics`;
    console.log('[DEBUG] Checking Firestore path:', path);

    // Get all biometrics logs for this player
    const logsRef = adminDb.collection(path);
    const snapshot = await logsRef.get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Also check if the player exists
    const playerRef = adminDb.doc(`users/${userId}/players/${playerId}`);
    const playerDoc = await playerRef.get();

    return NextResponse.json({
      debug: true,
      userId,
      playerId,
      firestorePath: path,
      playerExists: playerDoc.exists,
      playerData: playerDoc.exists ? { name: playerDoc.data()?.name } : null,
      biometricsLogsCount: logs.length,
      biometricsLogs: logs,
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
