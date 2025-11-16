/**
 * Manage Billing Button
 *
 * Phase 7 Task 5: Stripe Customer Portal Integration
 *
 * Button that opens Stripe Customer Portal for self-service billing management.
 * Users can update payment methods, view invoices, and cancel subscriptions.
 */

'use client';

import { useState } from 'react';

interface ManageBillingButtonProps {
  /**
   * Custom return URL after portal session (optional)
   * Default: /dashboard/settings/billing
   */
  returnUrl?: string;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'link';

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom button text
   */
  children?: React.ReactNode;
}

/**
 * ManageBillingButton Component
 *
 * Creates Stripe Customer Portal session and redirects user to Stripe-hosted portal.
 *
 * @example
 * ```tsx
 * // In billing settings page
 * <ManageBillingButton>Manage Subscription</ManageBillingButton>
 *
 * // With custom return URL
 * <ManageBillingButton returnUrl="/dashboard">
 *   Update Payment Method
 * </ManageBillingButton>
 *
 * // Link variant
 * <ManageBillingButton variant="link">
 *   View invoices →
 * </ManageBillingButton>
 * ```
 */
export function ManageBillingButton({
  returnUrl,
  variant = 'primary',
  className = '',
  children = 'Manage Billing',
}: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create portal session
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (errorData.error === 'NO_STRIPE_CUSTOMER') {
          setError('You need to upgrade to a paid plan first.');
          return;
        }

        throw new Error(errorData.message || 'Failed to open billing portal');
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err: any) {
      console.error('[ManageBillingButton] Error:', err);
      setError(err.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  // Variant styles
  const baseStyles = 'font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3',
    link: 'text-blue-600 hover:text-blue-700 underline px-0 py-0',
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}

/**
 * Inline Billing Link
 *
 * Compact link variant for embedding in text.
 */
export function BillingPortalLink({
  children = 'manage your billing',
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <ManageBillingButton variant="link" className={className}>
      {children}
    </ManageBillingButton>
  );
}
