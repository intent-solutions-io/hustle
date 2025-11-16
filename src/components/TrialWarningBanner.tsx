/**
 * Trial Warning Banner
 *
 * Phase 7: Client-Side Access Enforcement
 *
 * Displays a top-banner warning when trial is nearing expiration.
 * Uses useWorkspaceAccess() hook to check trial status.
 */

'use client';

import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useState } from 'react';
import Link from 'next/link';

export function TrialWarningBanner() {
  const access = useWorkspaceAccess();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if loading, error, or not trial
  if (access.loading || access.error || !access.isTrial) {
    return null;
  }

  // Don't show if trial has plenty of time left (> 3 days)
  if (!access.showTrialWarning) {
    return null;
  }

  // Don't show if user dismissed
  if (dismissed) {
    return null;
  }

  const daysRemaining = access.trialEndsIn || 0;
  const isUrgent = daysRemaining <= 1;

  return (
    <div
      className={`${
        isUrgent ? 'bg-red-600' : 'bg-yellow-600'
      } text-white px-4 py-3 shadow-md sticky top-0 z-50`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <div>
            <p className="font-semibold">
              {daysRemaining === 0
                ? 'Your trial expires today!'
                : daysRemaining === 1
                ? 'Your trial expires tomorrow!'
                : `Your trial expires in ${daysRemaining} days`}
            </p>
            <p className="text-sm opacity-90">
              Upgrade now to continue tracking your player stats without interruption.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="bg-white text-gray-900 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors"
          >
            Upgrade Now
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Dismiss warning"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
