/**
 * Current Workspace API
 *
 * GET /api/workspace/current
 *
 * Returns the current user's default workspace data — client-safe fields
 * only (no Stripe customer / subscription IDs).
 *
 * Phase 4.5 migration: user + workspace lookups moved off Firestore onto
 * Drizzle.
 */

import { authWithProfile } from '@/lib/auth';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/workspace/current');

export async function GET() {
  try {
    const dashboardUser = await authWithProfile();
    if (!dashboardUser) {
      return Response.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserProfileAdmin(dashboardUser.uid);
    if (!user) {
      return Response.json(
        { error: 'USER_NOT_FOUND', message: 'User document not found' },
        { status: 404 }
      );
    }

    const workspaceId = user.defaultWorkspaceId;
    if (!workspaceId) {
      return Response.json(
        { error: 'NO_WORKSPACE', message: 'User has no default workspace' },
        { status: 404 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(workspaceId);
    if (!workspace) {
      return Response.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
        status: workspace.status,
        billing: {
          currentPeriodEnd: workspace.billing.currentPeriodEnd
            ? workspace.billing.currentPeriodEnd.toISOString()
            : null,
          // Do NOT expose Stripe customer ID or subscription ID to client.
        },
        usage: workspace.usage,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      '/api/workspace/current error: ' + msg,
      error instanceof Error ? error : new Error(msg)
    );
    return Response.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}
