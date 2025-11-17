/**
 * Stripe Checkout Session Creation
 *
 * Creates a Stripe Checkout session for workspace subscription.
 * Phase 5 Task 3: Stripe Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { getWorkspaceById, updateWorkspaceBilling } from '@/lib/firebase/services/workspaces';
import { z } from 'zod';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Request validation schema
const checkoutRequestSchema = z.object({
  workspaceId: z.string().min(1),
  priceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 0. Check billing feature switch (Phase 7 Task 6)
    const billingEnabled = process.env.BILLING_ENABLED !== 'false';

    if (!billingEnabled) {
      return NextResponse.json(
        {
          error: 'BILLING_DISABLED',
          message: 'Billing is temporarily disabled. Please try again later.',
        },
        { status: 503 }
      );
    }

    // 1. Authenticate user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = checkoutRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { workspaceId, priceId } = validation.data;

    // 3. Verify workspace ownership
    const workspace = await getWorkspaceById(workspaceId);

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this workspace' },
        { status: 403 }
      );
    }

    // 4. Create or retrieve Stripe customer
    let customerId = workspace.billing.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          workspaceId,
          userId: session.user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID immediately
      await updateWorkspaceBilling(workspaceId, {
        stripeCustomerId: customerId,
      });
    }

    // 5. Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
      metadata: {
        workspaceId,
        userId: session.user.id,
      },
      allow_promotion_codes: true, // Enable promo codes in checkout
      billing_address_collection: 'auto',
    });

    // 6. Return checkout URL
    return NextResponse.json({
      sessionUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card error', details: error.message },
        { status: 400 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid request to Stripe', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
