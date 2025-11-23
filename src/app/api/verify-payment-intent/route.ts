// /src/app/api/verify-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getOrganizationId } from '@/lib/getSettings';
import { createStripeInstance } from '@/lib/stripeInstance';

export async function POST(request: Request) {
  const host = request.headers.get('host') || undefined;
  const organizationId = await getOrganizationId({ headers: { host } });
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const stripe = await createStripeInstance(organizationId);
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('session_id');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Retrieved payment intent:', paymentIntent);

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount, // Amount in cents
      currency: paymentIntent.currency,
    });
  } catch (error: any) {
    console.error('Error verifying payment intent:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}