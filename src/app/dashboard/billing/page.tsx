/**
 * Billing Dashboard Page
 *
 * Phase 7 Task 4: Customer Billing Portal & Invoice History
 * Phase 7 Task 5: Plan Limit Warnings & Usage Indicators
 *
 * Displays billing management UI with:
 * - "Manage Billing" button (opens Stripe Customer Portal)
 * - Billing history table (recent invoices)
 * - Plan usage overview with limit indicators
 */

import { redirect } from 'next/navigation';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import { listRecentInvoices } from '@/lib/stripe/billing-portal';
import { ManageBillingButton } from '@/components/billing/ManageBillingButton';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { evaluatePlanLimits, getLimitStateColor, formatLimit } from '@/lib/billing/plan-limits';
import type { Workspace } from '@/types/firestore';

export const metadata = {
  title: 'Billing | Hustle',
  description: 'Manage your subscription and view billing history',
};

/**
 * Billing Dashboard Page
 *
 * Server component that:
 * 1. Authenticates the user
 * 2. Fetches workspace and invoices
 * 3. Renders billing management UI
 */
export default async function BillingPage() {
  // 1. Authenticate user
  const dashboardUser = await getDashboardUser();

  if (!dashboardUser) {
    redirect('/login');
  }

  // 2. Get user's default workspace
  const userDoc = await adminDb.collection('users').doc(dashboardUser.uid).get();

  if (!userDoc.exists) {
    redirect('/login');
  }

  const userData = userDoc.data();
  const workspaceId = userData?.defaultWorkspaceId;

  if (!workspaceId) {
    redirect('/dashboard');
  }

  // 3. Get workspace document
  const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

  if (!workspaceDoc.exists) {
    redirect('/dashboard');
  }

  const workspaceData = workspaceDoc.data();
  const workspace = {
    id: workspaceDoc.id,
    ...workspaceData,
  } as unknown as Workspace;

  // 3a. Evaluate plan limits
  const limits = evaluatePlanLimits(workspace);

  // 4. Fetch invoice history (server-side)
  let invoices = [];
  try {
    invoices = await listRecentInvoices(workspace.id, 5);
  } catch (error) {
    console.error('[Billing Page] Failed to fetch invoices:', error);
    // Continue rendering page with empty invoice list
  }

  // 5. Render billing management UI
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-600">
          Manage your subscription, payment methods, and view billing history.
        </p>
      </div>

      {/* Current Plan Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Plan</h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium capitalize">{workspace.plan}</span> plan •{' '}
              <span className="capitalize">{workspace.status}</span>
            </p>
          </div>
          {/* Plan Change Link */}
          <a
            href="/dashboard/billing/change-plan"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Change Plan →
          </a>
        </div>

        {/* Status Badges */}
        {workspace.status === 'past_due' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              ⚠️ <strong>Payment Past Due:</strong> Please update your payment method to avoid
              service interruption.
            </p>
          </div>
        )}

        {workspace.status === 'trial' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              🎉 <strong>Free Trial Active:</strong> Upgrade to a paid plan to continue using
              Hustle after your trial ends.
            </p>
          </div>
        )}
      </div>

      {/* Plan Usage Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Usage Overview</h2>

        <div className="space-y-4">
          {/* Player Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  getLimitStateColor(limits.player.state) === 'green'
                    ? 'bg-green-500'
                    : getLimitStateColor(limits.player.state) === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Players</p>
                <p className="text-xs text-gray-600">
                  {limits.player.used} of {formatLimit(limits.player.limit)} used
                </p>
              </div>
            </div>
            {limits.player.state === 'critical' && (
              <p className="text-xs text-red-600">Limit reached</p>
            )}
          </div>

          {/* Games This Month */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  getLimitStateColor(limits.games.state) === 'green'
                    ? 'bg-green-500'
                    : getLimitStateColor(limits.games.state) === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Games This Month</p>
                <p className="text-xs text-gray-600">
                  {limits.games.used} of {formatLimit(limits.games.limit)} used
                </p>
              </div>
            </div>
            {limits.games.state === 'critical' && (
              <p className="text-xs text-red-600">Limit reached</p>
            )}
          </div>

          {/* Upgrade Note */}
          {(limits.player.state === 'critical' || limits.games.state === 'critical') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Upgrade your plan to continue adding players or games.
              </p>
              <a
                href="/dashboard/billing/change-plan"
                className="text-sm text-blue-600 hover:underline font-medium mt-1 inline-block"
              >
                View Plans →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Manage Billing Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Billing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Update payment method, view invoices, or manage your subscription through the Stripe
          Customer Portal.
        </p>

        <ManageBillingButton
          workspaceStatus={workspace.status}
          hasStripeCustomer={!!workspace.billing?.stripeCustomerId}
        />
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>

        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No billing history available yet.</p>
            {workspace.status === 'trial' && (
              <p className="text-sm text-gray-400 mt-2">
                Invoices will appear here after you upgrade to a paid plan.
              </p>
            )}
          </div>
        ) : (
          <InvoiceTable invoices={invoices} />
        )}
      </div>
    </div>
  );
}
