'use client';

/**
 * Workspace Summary Component
 *
 * Displays current workspace information including:
 * - Workspace name
 * - Current plan tier + status badges
 * - Usage stats (players, games this month)
 *
 * Phase 4.5 migration: replaced the direct Firebase Firestore read with a
 * fetch against /api/workspace/current (which now reads from Drizzle).
 * The workspaceId prop is kept for source-compat but ignored — the route
 * returns the authenticated user's own workspace.
 */

import { useEffect, useState } from 'react';

interface WorkspaceSummaryProps {
  // Source-compat — unused; the API route resolves the workspace from session.
  workspaceId?: string;
}

interface WorkspaceView {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'plus' | 'pro';
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended' | 'deleted';
  billing: { currentPeriodEnd: string | null };
  usage: {
    playerCount: number;
    gamesThisMonth: number;
    storageUsedMB: number;
  };
}

export function WorkspaceSummary({ workspaceId: _workspaceId }: WorkspaceSummaryProps = {}) {
  void _workspaceId;
  const [workspace, setWorkspace] = useState<WorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        setLoading(true);
        const res = await fetch('/api/workspace/current', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to load workspace (HTTP ${res.status})`);
        }
        const data = (await res.json()) as { workspace?: WorkspaceView };
        if (!cancelled) setWorkspace(data.workspace ?? null);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load workspace');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">{error || 'Workspace not found'}</p>
      </div>
    );
  }

  const statusBadgeClass = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-500',
  }[workspace.status];

  const planBadgeClass = {
    free: 'bg-gray-100 text-gray-800',
    starter: 'bg-blue-100 text-blue-800',
    plus: 'bg-purple-100 text-purple-800',
    pro: 'bg-indigo-100 text-indigo-800',
  }[workspace.plan];

  const periodEnd = workspace.billing.currentPeriodEnd
    ? new Date(workspace.billing.currentPeriodEnd)
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${planBadgeClass}`}
          >
            {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} Plan
          </span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusBadgeClass}`}
          >
            {workspace.status.charAt(0).toUpperCase() +
              workspace.status.slice(1).replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Usage This Month</h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Players</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {workspace.usage.playerCount}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Games</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {workspace.usage.gamesThisMonth}
            </dd>
          </div>
        </dl>
      </div>

      {/* Billing Info / Trial Info */}
      {periodEnd && workspace.status !== 'trial' && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-600">
            {workspace.status === 'canceled' ? 'Ends on' : 'Renews on'}{' '}
            <span className="font-medium text-gray-900">
              {periodEnd.toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
      {workspace.status === 'trial' && periodEnd && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-600">
            Trial ends on{' '}
            <span className="font-medium text-gray-900">
              {periodEnd.toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
