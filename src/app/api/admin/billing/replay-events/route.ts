/**
 * Stripe Event Replay Endpoint (Admin-Only)
 *
 * Phase 7 Task 7: Stripe Event Replay + Billing Consistency Auditor
 *
 * POST /api/admin/billing/replay-events
 *
 * Reprocesses recent Stripe events for a workspace to fix billing drift.
 * Fetches historical events from Stripe and re-runs webhook handlers.
 *
 * Security: Admin-only endpoint with UID allow-list
 *
 * Usage:
 * ```bash
 * curl -X POST /api/admin/billing/replay-events \
 *   -H "Cookie: __session=<firebase-id-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"workspaceId": "workspace123"}'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe/client';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  updateWorkspaceBilling,
  getWorkspaceByStripeCustomerId,
} from '@/lib/firebase/services/workspaces';
import { enforceWorkspacePlan } from '@/lib/stripe/plan-enforcement';
import type { Workspace } from '@/types/firestore';

/** Safely convert Firestore Timestamp to Date with warning on missing data */
function safeTimestampToDate(
  value: unknown,
  fieldName: string,
  docId: string
): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  console.warn(
    `[replay-events] Missing or invalid ${fieldName} for workspace ${docId}, using current time`
  );
  return new Date();
}

/**
 * Admin allow-list (UIDs)
 *
 * Add Firebase UIDs of admin users who can access this endpoint.
 * In production, use Firebase custom claims or a database table.
 */
const ADMIN_UIDS: string[] = [
  // Add your admin UIDs here
  // Example: 'firebase-uid-of-admin-user'
];

/**
 * Check if user is admin
 */
function isAdmin(uid: string): boolean {
  // If allow-list is empty, allow all authenticated users (dev mode)
  if (ADMIN_UIDS.length === 0) {
    console.warn('[Admin] ADMIN_UIDS allow-list is empty - allowing all authenticated users');
    return true;
  }

  return ADMIN_UIDS.includes(uid);
}

/**
 * Event replay report
 */
interface ReplayReport {
  workspaceId: string;
  reprocessed: Array<{
    eventId: string;
    type: string;
    created: string;
  }>;
  skipped: Array<{
    eventId: string;
    type: string;
    reason: string;
  }>;
  updatedWorkspaceStatus: string;
  updatedPlan: string;
  lastStripeStatus: string | null;
  totalEventsRetrieved: number;
  totalReprocessed: number;
  totalSkipped: number;
}

/**
 * POST handler for event replay
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getDashboardUser();

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Check admin access
    if (!isAdmin(user.uid)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // 4. Fetch workspace
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
      createdAt: safeTimestampToDate(workspaceData?.createdAt, 'createdAt', workspaceId),
      updatedAt: safeTimestampToDate(workspaceData?.updatedAt, 'updatedAt', workspaceId),
      deletedAt: workspaceData?.deletedAt?.toDate() || null,
      billing: {
        stripeCustomerId: workspaceData?.billing?.stripeCustomerId || null,
        stripeSubscriptionId: workspaceData?.billing?.stripeSubscriptionId || null,
        currentPeriodEnd: workspaceData?.billing?.currentPeriodEnd?.toDate() || null,
      },
      members: (workspaceData?.members || []).map((member: { addedAt?: unknown; [key: string]: unknown }) => ({
        ...member,
        addedAt: safeTimestampToDate(member.addedAt, 'member.addedAt', workspaceId),
      })),
    } as unknown as Workspace;

    // 5. Check if workspace has Stripe customer ID
    if (!workspace.billing.stripeCustomerId) {
      return NextResponse.json(
        {
          error: 'NO_STRIPE_CUSTOMER',
          message: 'Workspace has no Stripe customer ID - nothing to replay',
        },
        { status: 400 }
      );
    }

    // 6. Initialize replay report
    const report: ReplayReport = {
      workspaceId,
      reprocessed: [],
      skipped: [],
      updatedWorkspaceStatus: workspace.status,
      updatedPlan: workspace.plan,
      lastStripeStatus: null,
      totalEventsRetrieved: 0,
      totalReprocessed: 0,
      totalSkipped: 0,
    };

    // 7. Fetch recent Stripe events for this customer
    const events = await getStripeClient().events.list({
      limit: 100, // Last 100 events
      type: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
        'invoice.payment_succeeded',
      ].join(',') as any,
    });

    // Filter events for this customer
    const customerEvents = events.data.filter((event) => {
      const data = event.data.object as any;
      return (
        data.customer === workspace.billing.stripeCustomerId ||
        data.metadata?.workspaceId === workspaceId
      );
    });

    report.totalEventsRetrieved = customerEvents.length;

    console.log('[Replay] Processing events:', {
      workspaceId,
      customerId: workspace.billing.stripeCustomerId,
      totalEvents: customerEvents.length,
    });

    // 8. Replay events in chronological order (oldest first)
    const sortedEvents = customerEvents.sort((a, b) => a.created - b.created);

    for (const event of sortedEvents) {
      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await replayCheckoutSessionCompleted(
              event.data.object as Stripe.Checkout.Session,
              workspaceId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          case 'customer.subscription.updated':
            await replaySubscriptionUpdated(
              event.data.object as Stripe.Subscription,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            // Track last subscription status
            report.lastStripeStatus = (event.data.object as Stripe.Subscription).status;
            break;

          case 'customer.subscription.deleted':
            await replaySubscriptionDeleted(
              event.data.object as Stripe.Subscription,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            report.lastStripeStatus = 'canceled';
            break;

          case 'invoice.payment_failed':
            await replayPaymentFailed(
              event.data.object as Stripe.Invoice,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          case 'invoice.payment_succeeded':
            await replayPaymentSucceeded(
              event.data.object as Stripe.Invoice,
              workspace.billing.stripeCustomerId,
              event.id
            );
            report.reprocessed.push({
              eventId: event.id,
              type: event.type,
              created: new Date(event.created * 1000).toISOString(),
            });
            break;

          default:
            report.skipped.push({
              eventId: event.id,
              type: event.type,
              reason: 'Unsupported event type',
            });
        }
      } catch (error: any) {
        console.error(`[Replay] Error processing event ${event.id}:`, error.message);
        report.skipped.push({
          eventId: event.id,
          type: event.type,
          reason: error.message || 'Processing error',
        });
      }
    }

    // 9. Fetch final workspace state
    const updatedWorkspaceDoc = await adminDb
      .collection('workspaces')
      .doc(workspaceId)
      .get();
    const updatedWorkspaceData = updatedWorkspaceDoc.data();

    report.updatedWorkspaceStatus = updatedWorkspaceData?.status || workspace.status;
    report.updatedPlan = updatedWorkspaceData?.plan || workspace.plan;
    report.totalReprocessed = report.reprocessed.length;
    report.totalSkipped = report.skipped.length;

    // 10. Log replay completion
    console.log('[Replay] Completed:', {
      workspaceId,
      reprocessed: report.totalReprocessed,
      skipped: report.totalSkipped,
      finalStatus: report.updatedWorkspaceStatus,
      finalPlan: report.updatedPlan,
    });

    // 11. Return report
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[Replay] Error:', error);
    return NextResponse.json(
      { error: 'REPLAY_FAILED', message: error.message || 'Event replay failed' },
      { status: 500 }
    );
  }
}

/**
 * Replay handlers (mimic webhook handlers)
 *
 * These duplicate the logic from /api/billing/webhook/route.ts
 * to reprocess events without modifying the original webhook code.
 */

async function replayCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  workspaceId: string,
  eventId: string
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.warn('[Replay] No subscription ID in checkout session');
    return;
  }

  // Fetch subscription details
  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  console.log('[Replay] Checkout completed:', {
    workspaceId,
    priceId,
    stripeStatus: subscription.status,
    subscriptionId,
  });

  // Enforce workspace plan and status (Phase 7 Task 9)
  await enforceWorkspacePlan(workspaceId, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: 'replay',
    stripeEventId: eventId,
  });

  // Update billing information - access current_period_end via type assertion
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBilling(workspaceId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replaySubscriptionUpdated(
  subscription: Stripe.Subscription,
  customerId: string,
  eventId: string
) {
  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  console.log('[Replay] Subscription updated:', {
    workspaceId: workspace.id,
    priceId,
    stripeStatus: subscription.status,
    subscriptionId: subscription.id,
  });

  // Enforce workspace plan and status (Phase 7 Task 9)
  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: subscription.status,
    source: 'replay',
    stripeEventId: eventId,
  });

  // Update billing information - access current_period_end via type assertion
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replaySubscriptionDeleted(
  subscription: Stripe.Subscription,
  customerId: string,
  eventId: string
) {
  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;

  console.log('[Replay] Subscription deleted:', {
    workspaceId: workspace.id,
    subscriptionId: subscription.id,
  });

  // Enforce workspace plan and status (Phase 7 Task 9)
  // Subscription deleted means status should be 'canceled'
  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'canceled',
    source: 'replay',
    stripeEventId: eventId,
  });

  // Keep currentPeriodEnd for access grace period - access current_period_end via type assertion
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}

async function replayPaymentFailed(
  invoice: Stripe.Invoice,
  customerId: string,
  eventId: string
) {
  // Access subscription via type assertion
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    // One-time payment (not subscription), ignore
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  console.log('[Replay] Payment failed:', {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    attemptCount: invoice.attempt_count,
  });

  // Fetch subscription to get price ID
  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Enforce workspace plan and status (Phase 7 Task 9)
  // Payment failed means status should be 'past_due'
  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'past_due',
    source: 'replay',
    stripeEventId: eventId,
  });
}

async function replayPaymentSucceeded(
  invoice: Stripe.Invoice,
  customerId: string,
  eventId: string
) {
  // Access subscription via type assertion
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    // One-time payment (not subscription), ignore
    return;
  }

  const workspace = await getWorkspaceByStripeCustomerId(customerId);

  if (!workspace) {
    console.warn('[Replay] Workspace not found for customer:', customerId);
    return;
  }

  console.log('[Replay] Payment succeeded:', {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100, // Convert cents to dollars
  });

  // Fetch subscription to get price ID and updated period
  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Enforce workspace plan and status (Phase 7 Task 9)
  // Payment succeeded means status should be 'active'
  await enforceWorkspacePlan(workspace.id, {
    stripePriceId: priceId,
    stripeStatus: 'active',
    source: 'replay',
    stripeEventId: eventId,
  });

  // Update renewal date - access current_period_end via type assertion
  const renewalPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  await updateWorkspaceBilling(workspace.id, {
    currentPeriodEnd: new Date(renewalPeriodEnd * 1000),
  });
}
