'use client';

/**
 * Workspace Summary Component
 *
 * Displays current workspace information including:
 * - Workspace name
 * - Current plan tier
 * - Workspace status
 * - Usage stats (players, games this month)
 *
 * Phase 5 Task 1: Basic UI surfacing for workspace model
 */

import { useEffect, useState } from 'react';
import { getWorkspaceById } from '@/lib/firebase/services/workspaces';
import type { Workspace } from '@/types/firestore';

interface WorkspaceSummaryProps {
  workspaceId: string;
}

export function WorkspaceSummary({ workspaceId }: WorkspaceSummaryProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        const data = await getWorkspaceById(workspaceId);
        setWorkspace(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [workspaceId]);

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
        <p className="text-sm text-red-800">
          {error || 'Workspace not found'}
        </p>
      </div>
    );
  }

  // Status badge styling
  const statusBadgeClass = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-500',
  }[workspace.status];

  // Plan badge styling
  const planBadgeClass = {
    free: 'bg-gray-100 text-gray-800',
    starter: 'bg-blue-100 text-blue-800',
    plus: 'bg-purple-100 text-purple-800',
    pro: 'bg-indigo-100 text-indigo-800',
  }[workspace.plan];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {workspace.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${planBadgeClass}`}
          >
            {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} Plan
          </span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusBadgeClass}`}
          >
            {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1).replace('_', ' ')}
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

      {/* Billing Info (if subscription active) */}
      {workspace.billing.stripeCustomerId && workspace.billing.currentPeriodEnd && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-600">
            {workspace.status === 'canceled' ? 'Ends on' : 'Renews on'}{' '}
            <span className="font-medium text-gray-900">
              {workspace.billing.currentPeriodEnd.toLocaleDateString()}
            </span>
          </p>
        </div>
      )}

      {/* Trial Info (if in trial) */}
      {workspace.status === 'trial' && workspace.billing.currentPeriodEnd && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm text-gray-600">
            Trial ends on{' '}
            <span className="font-medium text-gray-900">
              {workspace.billing.currentPeriodEnd.toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
