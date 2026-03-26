/**
 * Workspace Health Summary Component
 *
 * Phase 7 Task 2: Workspace Health Dashboard Section
 *
 * Displays workspace health data including status, billing, usage, and sync information.
 * Minimal UI component - simple stacked boxes layout.
 */

'use client';

import type { WorkspaceHealthData } from '@/lib/dashboard/health';
import { ManageBillingButton } from '@/components/ManageBillingButton';

interface HealthSummaryProps {
  data: WorkspaceHealthData;
}

/**
 * HealthSummary Component
 *
 * Displays workspace health information in stacked card layout.
 */
export function HealthSummary({ data }: HealthSummaryProps) {
  const { workspace } = data;

  return (
    <div className="space-y-6">
      {/* Status & Plan Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Status & Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
            <dd>
              <StatusBadge status={workspace.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Plan</dt>
            <dd className="text-lg font-semibold text-gray-900 capitalize">
              {workspace.plan}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Email Verified</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {workspace.emailVerified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-yellow-600">⚠ Not Verified</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Next Billing Action</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {getNextActionLabel(workspace.nextBillingAction)}
            </dd>
          </div>
        </div>
      </div>

      {/* Billing Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Current Period End</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {workspace.currentPeriodEnd
                ? new Date(workspace.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Days Until Renewal</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {workspace.currentPeriodEnd
                ? Math.ceil(
                    (new Date(workspace.currentPeriodEnd).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 'N/A'}
            </dd>
          </div>
        </div>

        {/* Manage Billing Button */}
        <div className="pt-4 border-t border-gray-200">
          <ManageBillingButton>
            {workspace.nextBillingAction === 'update_payment'
              ? 'Update Payment Method'
              : workspace.nextBillingAction === 'reactivate'
              ? 'Reactivate Subscription'
              : 'Manage Billing'}
          </ManageBillingButton>
        </div>
      </div>

      {/* Usage Metrics Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Players</dt>
            <dd className="text-3xl font-bold text-gray-900">
              {workspace.usage.players}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Games This Month</dt>
            <dd className="text-3xl font-bold text-gray-900">
              {workspace.usage.games}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Pending Verifications</dt>
            <dd className="text-3xl font-bold text-gray-900">
              {workspace.usage.pendingVerifications}
              {workspace.usage.pendingVerifications > 0 && (
                <span className="ml-2 text-sm font-normal text-yellow-600">
                  ⚠ Action needed
                </span>
              )}
            </dd>
          </div>
        </div>
      </div>

      {/* Sync Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Stripe Last Sync</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {workspace.sync.stripeLastSyncAt ? (
                <>
                  {new Date(workspace.sync.stripeLastSyncAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    {new Date(workspace.sync.stripeLastSyncAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No Stripe customer</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Firestore Last Update</dt>
            <dd className="text-lg font-semibold text-gray-900">
              {new Date(workspace.sync.firestoreLastUpdateAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}{' '}
              <span className="text-sm font-normal text-gray-500">
                {new Date(workspace.sync.firestoreLastUpdateAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </dd>
          </div>
        </div>

        {/* Sync Health Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <SyncHealthIndicator
            stripeLastSync={workspace.sync.stripeLastSyncAt}
            firestoreLastUpdate={workspace.sync.firestoreLastUpdateAt}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const badgeStyles: Record<string, { bg: string; text: string; label: string }> = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Active',
    },
    trial: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Trial',
    },
    past_due: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Past Due',
    },
    canceled: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Canceled',
    },
    suspended: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Suspended',
    },
    deleted: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Deleted',
    },
  };

  const style = badgeStyles[status] || badgeStyles.active;

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

/**
 * Get human-readable label for next billing action
 */
function getNextActionLabel(action: string): string {
  const labels: Record<string, string> = {
    none: 'None',
    update_payment: 'Update Payment',
    reactivate: 'Reactivate Subscription',
    contact_support: 'Contact Support',
  };

  return labels[action] || 'None';
}

/**
 * Sync Health Indicator
 *
 * Shows if Stripe and Firestore are in sync based on timestamps.
 */
function SyncHealthIndicator({
  stripeLastSync,
  firestoreLastUpdate,
}: {
  stripeLastSync: string | null;
  firestoreLastUpdate: string;
}) {
  // If no Stripe customer, show N/A
  if (!stripeLastSync) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <span className="text-xl">ℹ️</span>
        <span className="text-sm">No Stripe subscription (free plan)</span>
      </div>
    );
  }

  // Calculate time difference
  const stripeTime = new Date(stripeLastSync).getTime();
  const firestoreTime = new Date(firestoreLastUpdate).getTime();
  const diffMinutes = Math.abs(firestoreTime - stripeTime) / (1000 * 60);

  // If synced within 5 minutes, show healthy
  if (diffMinutes < 5) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <span className="text-xl">✓</span>
        <span className="text-sm font-semibold">Billing sync healthy</span>
      </div>
    );
  }

  // If synced within 1 hour, show warning
  if (diffMinutes < 60) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <span className="text-xl">⚠️</span>
        <span className="text-sm font-semibold">
          Billing sync delayed ({Math.floor(diffMinutes)} minutes)
        </span>
      </div>
    );
  }

  // If more than 1 hour out of sync, show error
  return (
    <div className="flex items-center gap-2 text-red-600">
      <span className="text-xl">⚠️</span>
      <span className="text-sm font-semibold">
        Billing sync issue (contact support)
      </span>
    </div>
  );
}
