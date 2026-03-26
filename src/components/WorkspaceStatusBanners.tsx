/**
 * Workspace Status Banners Component
 *
 * Phase 6 Task 1: Client component for showing workspace status warnings
 *
 * Shows banners at top of dashboard based on workspace status:
 * - past_due: Grace period warning (can read, cannot write)
 * - canceled: Subscription canceled (no access)
 * - suspended: Account suspended (no access)
 */

'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { GracePeriodBanner, CanceledSubscriptionBanner, BillingCallToAction } from './BillingCallToAction';

/**
 * Workspace Status Banners
 *
 * Automatically shows appropriate banner based on workspace status.
 * Place at top of dashboard layout.
 *
 * @example
 * ```tsx
 * // In dashboard layout
 * <WorkspaceStatusBanners />
 * ```
 */
export function WorkspaceStatusBanners() {
  const access = useWorkspaceAccess();

  // Loading state - no banners
  if (access.loading) {
    return null;
  }

  // Error state - show generic error
  if (access.error) {
    return (
      <div className="w-full px-4 py-3 bg-red-600 text-white">
        <div className="max-w-7xl mx-auto">
          <p className="font-semibold">Unable to load workspace status</p>
          <p className="text-sm opacity-90">{access.error}</p>
        </div>
      </div>
    );
  }

  // Past due - grace period banner (can read, cannot write)
  if (access.isPastDue) {
    return <GracePeriodBanner />;
  }

  // Canceled - no access banner
  if (access.isCanceled) {
    return <CanceledSubscriptionBanner />;
  }

  // Suspended - account issue banner
  if (access.isSuspended) {
    return (
      <BillingCallToAction
        status="suspended"
        variant="banner"
        message="Your account has been suspended. Please contact support to resolve this issue."
      />
    );
  }

  // No banners for active/trial workspaces
  return null;
}
