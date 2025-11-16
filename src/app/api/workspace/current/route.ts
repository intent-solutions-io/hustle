/**
 * Current Workspace API
 *
 * GET /api/workspace/current
 *
 * Returns the current user's default workspace data.
 * Used by useWorkspaceAccess() hook for client-side access checks.
 */

import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    // 1. Authenticate user
    const dashboardUser = await getDashboardUser();

    if (!dashboardUser) {
      return Response.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user's default workspace ID
    const userDoc = await adminDb.collection('users').doc(dashboardUser.uid).get();

    if (!userDoc.exists) {
      return Response.json(
        { error: 'USER_NOT_FOUND', message: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const workspaceId = userData?.defaultWorkspaceId;

    if (!workspaceId) {
      return Response.json(
        { error: 'NO_WORKSPACE', message: 'User has no default workspace' },
        { status: 404 }
      );
    }

    // 3. Fetch workspace document
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return Response.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const workspaceData = workspaceDoc.data();

    // 4. Return workspace data (client-safe fields only)
    return Response.json({
      success: true,
      workspace: {
        id: workspaceDoc.id,
        name: workspaceData?.name,
        plan: workspaceData?.plan,
        status: workspaceData?.status,
        billing: {
          currentPeriodEnd: workspaceData?.billing?.currentPeriodEnd?.toDate().toISOString() || null,
          // Do NOT expose Stripe customer ID or subscription ID to client
        },
        usage: workspaceData?.usage,
        createdAt: workspaceData?.createdAt?.toDate().toISOString(),
        updatedAt: workspaceData?.updatedAt?.toDate().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API] /api/workspace/current error:', error.message);
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}
