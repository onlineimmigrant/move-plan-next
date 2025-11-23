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
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    console.log('Cancelling payment intent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    console.log('Payment intent cancelled:', paymentIntent.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling Payment Intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel Payment Intent' },
      { status: 500 }
    );
  }
}