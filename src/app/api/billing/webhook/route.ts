/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle.
 * Phase 5 Task 3: Stripe Integration
 *
 * Events handled:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 * - invoice.payment_succeeded
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  getWorkspaceByStripeCustomerId,
  updateWorkspace,
  updateWorkspaceBilling,
  updateWorkspaceStatus,
} from '@/lib/firebase/services/workspaces';
import {
  getPlanForPriceId,
  mapStripeStatusToWorkspaceStatus,
} from '@/lib/stripe/plan-mapping';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST handler for Stripe webhooks
 * Must use raw body for signature verification
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 3. Log event (for debugging)
    console.log(`Stripe webhook received: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // 4. Handle event by type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 5. Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * User completed first payment
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;

  if (!workspaceId) {
    console.error('Missing workspaceId in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  // Fetch subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanForPriceId(priceId);
  const status = mapStripeStatusToWorkspaceStatus(subscription.status);

  console.log('Checkout completed:', {
    workspaceId,
    plan,
    status,
    subscriptionId,
  });

  // Update workspace plan and status
  await updateWorkspace(workspaceId, {
    plan,
    status,
  });

  // Update billing information
  await updateWorkspaceBilling(workspaceId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

/**
 * Handle customer.subscription.updated event
 * Subscription changed (plan upgrade/downgrade, renewal)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find workspace by Stripe customer ID
  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.error('Workspace not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanForPriceId(priceId);
  const status = mapStripeStatusToWorkspaceStatus(subscription.status);

  console.log('Subscription updated:', {
    workspaceId: workspace.id,
    plan,
    status,
    subscriptionId: subscription.id,
  });

  // Update workspace plan and status
  await updateWorkspace(workspace.id, {
    plan,
    status,
  });

  // Update billing information
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

/**
 * Handle customer.subscription.deleted event
 * Subscription canceled (immediate or at period end)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.error('Workspace not found for customer:', customerId);
    return;
  }

  console.log('Subscription deleted:', {
    workspaceId: workspace.id,
    subscriptionId: subscription.id,
  });

  // Mark workspace as canceled
  await updateWorkspaceStatus(workspace.id, 'canceled');

  // Keep currentPeriodEnd for access grace period
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

/**
 * Handle invoice.payment_failed event
 * Payment failed (card declined, insufficient funds)
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.error('Workspace not found for customer:', customerId);
    return;
  }

  console.log('Payment failed:', {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    attemptCount: invoice.attempt_count,
  });

  // Move workspace to past_due status (grace period)
  await updateWorkspaceStatus(workspace.id, 'past_due');

  // TODO: Send email notification to user about failed payment
}

/**
 * Handle invoice.payment_succeeded event
 * Payment succeeded (renewal or retry after failure)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    // One-time payment (not subscription), ignore
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.error('Workspace not found for customer:', customerId);
    return;
  }

  console.log('Payment succeeded:', {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100, // Convert cents to dollars
  });

  // Restore workspace to active status
  await updateWorkspaceStatus(workspace.id, 'active');

  // Update renewal date
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}
