/**
 * Invoice Table Component
 *
 * Phase 7 Task 4: Customer Billing Portal & Invoice History
 *
 * Displays billing history in a table format.
 * Shows invoice date, plan, amount, status, and link to hosted invoice.
 */

'use client';

import type { InvoiceDTO } from '@/lib/stripe/billing-portal';

interface InvoiceTableProps {
  invoices: InvoiceDTO[];
}

/**
 * InvoiceTable Component
 *
 * Simple table displaying recent invoices from Stripe.
 */
export function InvoiceTable({ invoices }: InvoiceTableProps) {
  // Helper: Format date from Unix timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper: Format currency
  const formatAmount = (cents: number, currency: string) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(dollars);
  };

  // Helper: Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'void':
        return 'bg-red-100 text-red-800';
      case 'uncollectible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
              {/* Date */}
              <td className="py-3 px-4 text-sm text-gray-900">
                {formatDate(invoice.periodEnd || invoice.created)}
              </td>

              {/* Plan */}
              <td className="py-3 px-4 text-sm text-gray-700">
                {invoice.planName || 'Subscription'}
              </td>

              {/* Amount */}
              <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                {invoice.status === 'paid'
                  ? formatAmount(invoice.amountPaid, invoice.currency)
                  : formatAmount(invoice.amountDue, invoice.currency)}
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </td>

              {/* View Invoice Link */}
              <td className="py-3 px-4 text-right">
                {invoice.hostedInvoiceUrl ? (
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
