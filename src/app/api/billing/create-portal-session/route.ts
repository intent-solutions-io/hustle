/**
 * Stripe Customer Portal Session API
 *
 * POST /api/billing/create-portal-session
 *
 * Phase 7 Task 5: Customer Portal Integration
 *
 * Creates a Stripe Customer Portal session for self-service billing management.
 * Users can update payment methods, view invoices, and cancel subscriptions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

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

    // 3. Get workspace with Stripe customer ID
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return NextResponse.json(
        { error: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const workspaceData = workspaceDoc.data();
    const stripeCustomerId = workspaceData?.billing?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: 'NO_STRIPE_CUSTOMER',
          message: 'No Stripe customer found. Please upgrade to a paid plan first.',
        },
        { status: 400 }
      );
    }

    // 4. Get return URL from request body or use default
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/settings/billing`;

    // 5. Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    // 6. Return portal URL
    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('[API] /api/billing/create-portal-session error:', error.message);

    // Handle Stripe API errors
    if (error.type) {
      return NextResponse.json(
        {
          error: 'STRIPE_ERROR',
          message: error.message || 'Failed to create portal session',
          type: error.type,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
