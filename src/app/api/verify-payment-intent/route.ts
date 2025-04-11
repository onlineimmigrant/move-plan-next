import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentIntentId = searchParams.get('session_id');

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Missing payment_intent_id' }, { status: 400 });
  }

  try {
    // Retrieve the Payment Intent with expanded payment method
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    return NextResponse.json(paymentIntent);
  } catch (error: any) {
    console.error('Error verifying Payment Intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify Payment Intent' },
      { status: 500 }
    );
  }
}