/**
 * Billing Invoices API Route
 *
 * GET /api/billing/invoices
 *
 * Phase 7 Task 4: Customer Billing Portal & Invoice History
 *
 * Returns recent invoices for the authenticated user's workspace.
 * Used by the dashboard to display billing history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { adminDb } from '@/lib/firebase/admin';
import { listRecentInvoices } from '@/lib/stripe/billing-portal';
import type { Workspace } from '@/types/firestore';

/**
 * GET handler for invoice list
 *
 * Query params: limit (optional, default: 5)
 * Response: { invoices: InvoiceDTO[] }
 */
export async function GET(request: NextRequest) {
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

    // 4. Enforce workspace status
    // Allowed: active, past_due, trial
    // Blocked: canceled, suspended, deleted
    const blockedStatuses = ['canceled', 'suspended', 'deleted'];

    if (blockedStatuses.includes(workspace.status)) {
      return NextResponse.json(
        {
          error: 'BILLING_INACCESSIBLE',
          reason: 'workspace_status',
          status: workspace.status,
          message: `Billing history not accessible for ${workspace.status} workspaces.`,
        },
        { status: 403 }
      );
    }

    // 5. Parse optional limit from query params
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    // 6. Get invoice list
    let invoices;
    try {
      invoices = await listRecentInvoices(workspace.id, limit);
    } catch (error: any) {
      console.error('[API] Invoice list retrieval failed:', error.message);
      return NextResponse.json(
        {
          error: 'INVOICE_LIST_FAILED',
          message: 'Unable to retrieve invoice history.',
        },
        { status: 500 }
      );
    }

    // 7. Return success response
    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('[API] /api/billing/invoices error:', error.message);

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
      { error: 'INTERNAL_ERROR', message: 'Failed to process invoice request' },
      { status: 500 }
    );
  }
}
