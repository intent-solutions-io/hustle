import type Stripe from 'stripe';

export function getSubscriptionCurrentPeriodEndUnix(
  subscription: Stripe.Subscription
): number | null {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (periodEnds.length === 0) return null;

  // Stripe now models billing periods at the subscription-item level.
  // Use the earliest ending period as the effective "current period end".
  return Math.min(...periodEnds);
}

export function getSubscriptionCurrentPeriodEndDate(
  subscription: Stripe.Subscription
): Date | null {
  const unixSeconds = getSubscriptionCurrentPeriodEndUnix(subscription);
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (typeof subscription === 'string') return subscription;
  if (subscription && typeof subscription === 'object') return subscription.id;

  return null;
}

