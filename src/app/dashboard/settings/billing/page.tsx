/**
 * Billing Settings Page
 *
 * Phase 6 Task 2: Stripe Customer Portal Integration
 *
 * Self-service billing management powered by Stripe Customer Portal.
 * Users can update payment methods, view invoices, and manage subscriptions.
 */

'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { ManageBillingButton } from '@/components/ManageBillingButton';
import { BillingCallToAction } from '@/components/BillingCallToAction';

export default function BillingSettingsPage() {
  const access = useWorkspaceAccess();

  // Loading state
  if (access.loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (access.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing Settings</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold">Unable to load billing information</p>
          <p className="text-red-600 text-sm mt-2">{access.error}</p>
        </div>
      </div>
    );
  }

  // Deleted workspace - show upgrade prompt
  if (access.status === 'deleted') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing Settings</h1>
        <BillingCallToAction
          status="deleted"
          message="This workspace has been deleted. Create a new workspace to continue using Hustle."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing Settings</h1>

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Current Plan</h2>
            <p className="text-gray-600">
              You're currently on the{' '}
              <span className="font-semibold text-gray-900 capitalize">
                {access.plan || 'free'}
              </span>{' '}
              plan
            </p>
          </div>

          {/* Status Badge */}
          <StatusBadge status={access.status} />
        </div>

        {/* Trial Information */}
        {access.isTrial && access.trialEndsIn !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏰</span>
              <div>
                <p className="font-semibold text-blue-900">Trial Active</p>
                <p className="text-sm text-blue-700">
                  {access.trialEndsIn === 0
                    ? 'Your trial expires today!'
                    : `Your trial expires in ${access.trialEndsIn} day${access.trialEndsIn === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {access.isPastDue && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-900">Payment Past Due</p>
                <p className="text-sm text-yellow-700">
                  Your payment method was declined. Please update it to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Canceled Warning */}
        {access.isCanceled && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚫</span>
              <div>
                <p className="font-semibold text-red-900">Subscription Canceled</p>
                <p className="text-sm text-red-700">
                  Your subscription has been canceled. Reactivate to continue using Hustle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suspended Warning */}
        {access.isSuspended && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⛔</span>
              <div>
                <p className="font-semibold text-red-900">Account Suspended</p>
                <p className="text-sm text-red-700">
                  Your account has been suspended. Please contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manage Subscription Button */}
        <div className="pt-4 border-t border-gray-200">
          <ManageBillingButton>
            {access.isCanceled ? 'Reactivate Subscription' : 'Manage Subscription'}
          </ManageBillingButton>
        </div>
      </div>

      {/* Payment Method Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Method</h2>
        <p className="text-gray-600 mb-4">
          Update your payment method, billing address, or view payment history
        </p>

        <ManageBillingButton variant="secondary">
          Update Payment Method
        </ManageBillingButton>
      </div>

      {/* Invoices Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoices & Receipts</h2>
        <p className="text-gray-600 mb-4">
          View past invoices, download receipts, and see upcoming billing dates
        </p>

        <ManageBillingButton variant="secondary">
          View Invoices
        </ManageBillingButton>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          💡 <strong>Need help?</strong> All billing operations are handled securely by Stripe.
          You can update payment methods, view invoices, and manage subscriptions without contacting support.
        </p>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

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
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
