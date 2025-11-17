/**
 * Plan Change API Route
 *
 * POST /api/billing/change-plan
 *
 * Phase 7 Task 3: Self-Service Plan Changes
 *
 * Creates a Stripe Checkout session for plan upgrades/downgrades.
 * Validates workspace eligibility and returns checkout URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import {
  validatePlanChangeEligibility,
  buildCheckoutSession,
  getProrationPreview,
} from '@/lib/billing/plan-change';
import { getPlanForPriceId } from '@/lib/stripe/plan-mapping';
import type { Workspace } from '@/types/firestore';

/**
 * POST handler for plan change
 *
 * Request body: { targetPriceId: string }
 * Response: { url: string, preview: { amountDue, immediateCharge, ... } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const dashboardUser = await getDashboardUser();

    if (!dashboardUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user's default workspace
    const userDoc = await adminDb.collection('users').doc(dashboardUser.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const workspaceId = userData?.defaultWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'NO_WORKSPACE', message: 'User has no default workspace' },
        { status: 404 }
      );
    }

    // 3. Get workspace document
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const workspaceData = workspaceDoc.data();
    const workspace = {
      id: workspaceDoc.id,
      ...workspaceData,
    } as unknown as Workspace;

    // 4. Parse request body
    const body = await request.json();
    const { targetPriceId } = body;

    if (!targetPriceId || typeof targetPriceId !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'targetPriceId is required' },
        { status: 400 }
      );
    }

    // 5. Validate price ID
    try {
      getPlanForPriceId(targetPriceId); // Throws if invalid
    } catch (error: any) {
      return NextResponse.json(
        { error: 'INVALID_PRICE_ID', message: 'Unknown Stripe price ID' },
        { status: 400 }
      );
    }

    // 6. Validate workspace eligibility
    const eligibility = validatePlanChangeEligibility(workspace);

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'NOT_ELIGIBLE',
          message: eligibility.reason || 'Workspace not eligible for plan change',
        },
        { status: 403 }
      );
    }

    // 7. Get proration preview
    let prorationPreview;
    try {
      prorationPreview = await getProrationPreview(workspace, targetPriceId);
    } catch (error: any) {
      console.error('[API] Plan change proration preview failed:', error.message);
      return NextResponse.json(
        {
          error: 'PRORATION_FAILED',
          message: 'Failed to calculate proration. Please try again.',
        },
        { status: 500 }
      );
    }

    // 8. Build checkout session
    let checkoutUrl;
    try {
      checkoutUrl = await buildCheckoutSession(workspace, targetPriceId);
    } catch (error: any) {
      console.error('[API] Plan change checkout session failed:', error.message);
      return NextResponse.json(
        {
          error: 'CHECKOUT_FAILED',
          message: 'Failed to create checkout session. Please try again.',
        },
        { status: 500 }
      );
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      url: checkoutUrl,
      preview: {
        amountDue: prorationPreview.amountDue,
        currentPeriodEnd: prorationPreview.currentPeriodEnd.toISOString(),
        proratedAmount: prorationPreview.proratedAmount,
        immediateCharge: prorationPreview.immediateCharge,
        currencyCode: prorationPreview.currencyCode,
      },
    });
  } catch (error: any) {
    console.error('[API] /api/billing/change-plan error:', error.message);

    // Handle Stripe API errors
    if (error.type) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          message: error.message || 'Stripe API error occurred',
          type: error.type,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process plan change request' },
      { status: 500 }
    );
  }
}
