/**
 * Workspace Health Dashboard Page
 *
 * Phase 7 Task 2: Workspace Health Dashboard Section
 *
 * Displays workspace health indicators including:
 * - Workspace status and plan
 * - Billing information and next action
 * - Usage metrics (players, games, pending verifications)
 * - Sync status (Stripe <-> Firestore)
 * - Email verification status
 */

import { redirect } from 'next/navigation';
import { getWorkspaceHealth } from '@/lib/dashboard/health';
import { HealthSummary } from '@/components/dashboard/health-summary';

export const metadata = {
  title: 'Workspace Health | Hustle',
  description: 'View workspace status, billing, and usage information',
};

export default async function HealthPage() {
  // Fetch workspace health data (server-side)
  const healthData = await getWorkspaceHealth();

  // Redirect to login if not authenticated
  if (!healthData) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspace Health</h1>
        <p className="text-gray-600">
          Monitor your workspace status, billing, and usage metrics.
        </p>
      </div>

      {/* Health Summary Component */}
      <HealthSummary data={healthData} />

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          💡 <strong>Need help understanding this data?</strong> The workspace health dashboard shows real-time
          information about your account status, billing cycle, and usage limits. If you see any issues,
          use the "Manage Billing" button to update payment methods or contact support if needed.
        </p>
      </div>
    </div>
  );
}
