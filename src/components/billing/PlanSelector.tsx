/**
 * Plan Selector Component
 *
 * Phase 7 Task 3: Self-Service Plan Changes
 *
 * Displays available plan options with pricing and features.
 * Allows users to select a new plan and proceed to Stripe Checkout.
 */

'use client';

import { useState } from 'react';
import type { AvailablePlan } from '@/lib/billing/plan-change';

interface PlanSelectorProps {
  plans: AvailablePlan[];
  workspaceId: string;
}

/**
 * PlanSelector Component
 *
 * Lists available plans with current plan highlighted.
 * Shows proration preview and redirects to Stripe Checkout.
 */
export function PlanSelector({ plans, workspaceId }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.isCurrent);

  const handleSelectPlan = (plan: AvailablePlan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleContinueToCheckout = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      setError(null);

      // Call API to create checkout session
      const response = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPriceId: selectedPlan.priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start plan change');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('[PlanSelector] Error:', err);
      setError(err.message || 'Failed to start plan change. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Notice */}
      {currentPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Current Plan:</strong> {currentPlan.displayName} (${currentPlan.monthlyPrice}/month)
          </p>
        </div>
      )}

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            isSelected={selectedPlan?.plan === plan.plan}
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </div>

      {/* Selected Plan Actions */}
      {selectedPlan && !selectedPlan.isCurrent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedPlan.changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'} to {selectedPlan.displayName}
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">New Monthly Price:</span>
              <span className="font-semibold text-gray-900">${selectedPlan.monthlyPrice}/month</span>
            </div>

            {selectedPlan.changeType === 'upgrade' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Proration:</strong> You'll be charged a prorated amount for the remainder of your current billing cycle.
                </p>
              </div>
            )}

            {selectedPlan.changeType === 'downgrade' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Downgrade:</strong> Your plan will change at the end of your current billing cycle.
                  No immediate refund.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinueToCheckout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
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
              'Continue to Checkout'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Stripe Checkout to complete your plan change.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Plan Card Component
 */
function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: AvailablePlan;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const borderColor = plan.isCurrent
    ? 'border-blue-500'
    : isSelected
    ? 'border-green-500'
    : 'border-gray-200';

  return (
    <div
      className={`bg-white border-2 ${borderColor} rounded-lg p-6 cursor-pointer hover:border-gray-300 transition-colors ${
        plan.isCurrent ? 'bg-blue-50' : ''
      }`}
      onClick={() => !plan.isCurrent && onSelect()}
    >
      {/* Plan Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
          {plan.isCurrent && (
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
              CURRENT
            </span>
          )}
          {isSelected && !plan.isCurrent && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold">
              SELECTED
            </span>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900">
          ${plan.monthlyPrice}
          <span className="text-sm font-normal text-gray-500">/month</span>
        </div>
      </div>

      {/* Plan Limits */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-green-600">✓</span>
          <span>{plan.limits.maxPlayers === 9999 ? 'Unlimited' : plan.limits.maxPlayers} players</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-green-600">✓</span>
          <span>
            {plan.limits.maxGamesPerMonth === 9999 ? 'Unlimited' : plan.limits.maxGamesPerMonth} games/month
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-green-600">✓</span>
          <span>{Math.floor(plan.limits.storageMB / 1024)} GB storage</span>
        </div>
      </div>

      {/* Action Button */}
      {!plan.isCurrent && (
        <button
          className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
            isSelected
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {plan.changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
        </button>
      )}
    </div>
  );
}
