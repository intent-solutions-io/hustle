/**
 * Plan Change Dashboard Page
 *
 * Phase 7 Task 3: Self-Service Plan Changes
 *
 * Allows customers to upgrade or downgrade their subscription plan.
 * Displays available plans with pricing, limits, and proration preview.
 */

import { redirect } from 'next/navigation';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import { getAvailablePlans } from '@/lib/billing/plan-change';
import { PlanSelector } from '@/components/billing/PlanSelector';
import type { Workspace } from '@/types/firestore';

export const metadata = {
  title: 'Change Plan | Hustle',
  description: 'Upgrade or downgrade your Hustle subscription plan',
};

/**
 * Plan Change Page
 *
 * Server component that:
 * 1. Authenticates the user
 * 2. Fetches workspace and available plans
 * 3. Redirects suspended/canceled workspaces
 * 4. Renders PlanSelector for eligible workspaces
 */
export default async function ChangePlanPage() {
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

  // 4. Handle workspace status redirects
  if (workspace.status === 'suspended') {
    // Suspended workspaces must contact support
    redirect('/dashboard/settings/billing?error=suspended');
  }

  if (workspace.status === 'canceled') {
    // Canceled workspaces can reactivate via Customer Portal
    redirect('/dashboard/settings/billing?action=reactivate');
  }

  if (workspace.status === 'deleted') {
    // Deleted workspaces cannot recover
    redirect('/dashboard');
  }

  // 5. Get available plans
  const availablePlans = getAvailablePlans(workspace);

  // 6. Render plan selector
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Your Plan</h1>
        <p className="text-gray-600">
          Upgrade or downgrade your subscription. Changes take effect immediately (upgrades) or at
          the end of your billing cycle (downgrades).
        </p>
      </div>

      {/* Trial Notice */}
      {workspace.status === 'trial' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">Free Trial Active</h3>
          <p className="text-sm text-yellow-800">
            You're currently on a free trial. To change plans, you must first upgrade to a paid
            subscription. Visit your{' '}
            <a href="/dashboard/settings/billing" className="underline font-semibold">
              billing settings
            </a>{' '}
            to get started.
          </p>
        </div>
      )}

      {/* Past Due Notice */}
      {workspace.status === 'past_due' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-900 mb-1">Payment Past Due</h3>
          <p className="text-sm text-red-800">
            Your account has a past due payment. You can still change plans, but you'll need to
            update your payment method during checkout.
          </p>
        </div>
      )}

      {/* Plan Selector Component */}
      {workspace.status !== 'trial' ? (
        <PlanSelector plans={availablePlans} workspaceId={workspace.id} />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            Plan changes are not available during free trial. Please upgrade to a paid plan first.
          </p>
          <a
            href="/dashboard/settings/billing"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            View Billing Settings
          </a>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-8 text-center">
        <a href="/dashboard/settings/billing" className="text-sm text-blue-600 hover:underline">
          ← Back to Billing Settings
        </a>
      </div>
    </div>
  );
}
