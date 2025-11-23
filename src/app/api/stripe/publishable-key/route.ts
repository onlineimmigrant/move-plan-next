/**
 * GET /api/stripe/publishable-key
 * 
 * Returns the Stripe publishable key for the current organization
 * Safe to expose to client-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/getSettings';
import { getStripePublishableKey } from '@/lib/getStripeKeys';

export async function GET(request: Request) {
  try {
    // Get organization ID from request
    const host = request.headers.get('host') || undefined;
    const organizationId = await getOrganizationId({ headers: { host } });
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get publishable key from database or env
    const publishableKey = await getStripePublishableKey(organizationId);

    return NextResponse.json({ 
      publishableKey,
      organizationId 
    });
  } catch (error) {
    console.error('Error fetching Stripe publishable key:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch publishable key' },
      { status: 500 }
    );
  }
}
