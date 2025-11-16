/**
 * Stripe Webhook Handler
 *
 * Phase 6 Task 3: Email notifications for billing events
 *
 * Receives Stripe webhook events and triggers appropriate actions:
 * - invoice.payment_failed → Send payment failed email
 * - customer.subscription.deleted → Send subscription canceled email
 * - customer.subscription.updated → Update workspace status + send emails
 * - checkout.session.completed → Update workspace + send welcome email (existing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/webhooks/stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook secret from Stripe Dashboard
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Get request body as text
    const body = await request.text();

    // Get Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      logger.error('Webhook signature verification failed', err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    logger.info(`Webhook received: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
    });

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        // Existing handler - update workspace
        // (Implementation exists from Phase 5)
        logger.info('Checkout session completed - handled by existing logic');
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook processing error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle invoice.payment_failed event
 *
 * Sends email notification when payment fails
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.info('Handling payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_due,
  });

  try {
    // Get workspace from Stripe customer ID
    const workspaceSnap = await adminDb
      .collection('workspaces')
      .where('billing.stripeCustomerId', '==', invoice.customer)
      .limit(1)
      .get();

    if (workspaceSnap.empty) {
      logger.warn('No workspace found for Stripe customer', {
        customerId: invoice.customer,
      });
      return;
    }

    const workspaceDoc = workspaceSnap.docs[0];
    const workspaceData = workspaceDoc.data();

    // Get user (workspace owner)
    const userSnap = await adminDb
      .collection('users')
      .where('defaultWorkspaceId', '==', workspaceDoc.id)
      .limit(1)
      .get();

    if (userSnap.empty) {
      logger.warn('No user found for workspace', {
        workspaceId: workspaceDoc.id,
      });
      return;
    }

    const userData = userSnap.docs[0].data();
    const userEmail = userData.email;
    const userName = userData.firstName || 'User';

    if (!userEmail) {
      logger.warn('User has no email address', {
        userId: userSnap.docs[0].id,
      });
      return;
    }

    // Get payment method details (last4)
    let paymentMethodLast4: string | undefined;
    if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
        const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
        if (paymentMethod.card) {
          paymentMethodLast4 = paymentMethod.card.last4;
        }
      }
    }

    // Send payment failed email
    const template = emailTemplates.paymentFailed({
      name: userName,
      planName: workspaceData.plan || 'unknown',
      amount: invoice.amount_due,
      paymentMethodLast4,
      updatePaymentUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
    });

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info('Payment failed email sent', {
      userId: userSnap.docs[0].id,
      workspaceId: workspaceDoc.id,
      email: userEmail,
    });

    // Update workspace status to past_due
    await adminDb.collection('workspaces').doc(workspaceDoc.id).update({
      status: 'past_due',
      'billing.lastPaymentFailed': new Date(),
      updatedAt: new Date(),
    });

    logger.info('Workspace status updated to past_due', {
      workspaceId: workspaceDoc.id,
    });
  } catch (error: any) {
    logger.error('Error handling payment failed', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 *
 * Sends email notification when subscription is canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Handling subscription deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });

  try {
    // Get workspace from Stripe customer ID
    const workspaceSnap = await adminDb
      .collection('workspaces')
      .where('billing.stripeCustomerId', '==', subscription.customer)
      .limit(1)
      .get();

    if (workspaceSnap.empty) {
      logger.warn('No workspace found for Stripe customer', {
        customerId: subscription.customer,
      });
      return;
    }

    const workspaceDoc = workspaceSnap.docs[0];
    const workspaceData = workspaceDoc.data();

    // Get user (workspace owner)
    const userSnap = await adminDb
      .collection('users')
      .where('defaultWorkspaceId', '==', workspaceDoc.id)
      .limit(1)
      .get();

    if (userSnap.empty) {
      logger.warn('No user found for workspace', {
        workspaceId: workspaceDoc.id,
      });
      return;
    }

    const userData = userSnap.docs[0].data();
    const userEmail = userData.email;
    const userName = userData.firstName || 'User';

    if (!userEmail) {
      logger.warn('User has no email address', {
        userId: userSnap.docs[0].id,
      });
      return;
    }

    // Send subscription canceled email
    const template = emailTemplates.subscriptionCanceled({
      name: userName,
      planName: workspaceData.plan || 'unknown',
      cancellationDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      reactivateUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
    });

    await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info('Subscription canceled email sent', {
      userId: userSnap.docs[0].id,
      workspaceId: workspaceDoc.id,
      email: userEmail,
    });

    // Update workspace status to canceled
    await adminDb.collection('workspaces').doc(workspaceDoc.id).update({
      status: 'canceled',
      'billing.canceledAt': new Date(),
      updatedAt: new Date(),
    });

    logger.info('Workspace status updated to canceled', {
      workspaceId: workspaceDoc.id,
    });
  } catch (error: any) {
    logger.error('Error handling subscription deleted', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 *
 * Updates workspace status and sends emails if needed
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Handling subscription updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
  });

  try {
    // Get workspace from Stripe customer ID
    const workspaceSnap = await adminDb
      .collection('workspaces')
      .where('billing.stripeCustomerId', '==', subscription.customer)
      .limit(1)
      .get();

    if (workspaceSnap.empty) {
      logger.warn('No workspace found for Stripe customer', {
        customerId: subscription.customer,
      });
      return;
    }

    const workspaceDoc = workspaceSnap.docs[0];
    const workspaceData = workspaceDoc.data();
    const previousStatus = workspaceData.status;

    // Map Stripe subscription status to workspace status
    let newStatus: string;
    switch (subscription.status) {
      case 'active':
        newStatus = 'active';
        break;
      case 'trialing':
        newStatus = 'trial';
        break;
      case 'past_due':
        newStatus = 'past_due';
        break;
      case 'canceled':
      case 'unpaid':
        newStatus = 'canceled';
        break;
      default:
        newStatus = previousStatus; // Keep current status
    }

    // Update workspace status
    await adminDb.collection('workspaces').doc(workspaceDoc.id).update({
      status: newStatus,
      'billing.subscriptionStatus': subscription.status,
      updatedAt: new Date(),
    });

    logger.info('Workspace status updated', {
      workspaceId: workspaceDoc.id,
      previousStatus,
      newStatus,
    });

    // Send email if status changed to canceled (via portal or Stripe)
    if (newStatus === 'canceled' && previousStatus !== 'canceled') {
      const userSnap = await adminDb
        .collection('users')
        .where('defaultWorkspaceId', '==', workspaceDoc.id)
        .limit(1)
        .get();

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        const userEmail = userData.email;
        const userName = userData.firstName || 'User';

        if (userEmail) {
          const template = emailTemplates.subscriptionCanceled({
            name: userName,
            planName: workspaceData.plan || 'unknown',
            cancellationDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
            reactivateUrl: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
          });

          await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });

          logger.info('Subscription canceled email sent (via subscription updated)', {
            userId: userSnap.docs[0].id,
            workspaceId: workspaceDoc.id,
            email: userEmail,
          });
        }
      }
    }
  } catch (error: any) {
    logger.error('Error handling subscription updated', error);
    throw error;
  }
}
